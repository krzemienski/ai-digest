import { Job } from "bullmq";
import Anthropic from "@anthropic-ai/sdk";
import { db, queries } from "@ai-digest/db";
import { episodes, transcripts, normalizedItems, eq, and, isNull, gte, desc } from "@ai-digest/db";
import type { VoiceConfig, TranscriptSegment } from "@ai-digest/shared";
import { formatDigestDate } from "@ai-digest/shared";
import {
  PODCAST_SCRIPT_SYSTEM_PROMPT,
  buildPodcastScriptPrompt,
  BudgetTracker,
  type PodcastTopicItem,
} from "@ai-digest/agents";
import {
  parseScript,
  validateSegments,
  generateAllSegments,
  assembleEpisode,
  uploadToS3,
  buildEpisodeKey,
} from "@ai-digest/podcast";

export interface PodcastJobData {
  episodeId: string;
  digestId: string;
  targetDurationMinutes: number;
}

type PodcastStage = "content_select" | "script_gen" | "quality_review" | "tts" | "assembly" | "upload";

// Duration config: how many stories to include
const STORY_COUNT_MAP: Record<number, number> = {
  5: 3,
  10: 5,
  15: 7,
  20: 9,
};

// Default voice config with Brian + Sarah
const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  speakers: [
    {
      role: "Host A",
      voiceId: "nPczCjzI2devNBz1zQrb", // Brian
      settings: { stability: 0.70, similarityBoost: 0.75, speed: 1.0, style: 0.30 },
    },
    {
      role: "Host B",
      voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah
      settings: { stability: 0.60, similarityBoost: 0.70, speed: 1.0, style: 0.40 },
    },
  ],
  audioFormat: "mp3_44100_128",
  targetDurationMinutes: 10,
};

async function updateStage(episodeId: string, stage: PodcastStage, status: string): Promise<void> {
  const episode = await db.query.episodes.findFirst({
    where: eq(episodes.id, episodeId),
  });
  if (!episode) return;

  const stages = (episode.podcastStages as Record<string, string>) ?? {};
  const updatedStages = { ...stages, [stage]: status };
  await db.update(episodes).set({ podcastStages: updatedStages }).where(eq(episodes.id, episodeId));
}

export async function processPodcastJob(job: Job<PodcastJobData>): Promise<void> {
  const { episodeId, targetDurationMinutes } = job.data;
  const dateStr = formatDigestDate(new Date());
  const voiceConfig: VoiceConfig = { ...DEFAULT_VOICE_CONFIG, targetDurationMinutes };
  const storyCount = STORY_COUNT_MAP[targetDurationMinutes] ?? 5;
  const budget = new BudgetTracker(5);

  console.log(`[Podcast] Starting generation for episode ${episodeId}, target ${targetDurationMinutes}min`);

  try {
    // Stage 1: Content Selection
    await updateStage(episodeId, "content_select", "running");

    const topItems = await db.query.normalizedItems.findMany({
      where: and(
        isNull(normalizedItems.duplicateOf),
        gte(normalizedItems.compositeScore, 0.3)
      ),
      orderBy: [desc(normalizedItems.compositeScore)],
      limit: storyCount,
    });

    if (topItems.length === 0) {
      throw new Error("No scored items found for podcast content");
    }

    const podcastItems: PodcastTopicItem[] = topItems.map(item => ({
      title: item.title,
      summary: item.summary,
      source: item.source,
      topics: item.categories,
      compositeScore: item.compositeScore ?? 0,
    }));

    await updateStage(episodeId, "content_select", "done");
    console.log(`[Podcast] Content selected: ${podcastItems.length} stories`);

    // Stage 2: Script Generation
    await updateStage(episodeId, "script_gen", "running");

    const client = new Anthropic();
    const scriptPrompt = buildPodcastScriptPrompt({
      digestDate: dateStr,
      synthesis: `Top ${podcastItems.length} AI stories for ${dateStr}`,
      items: podcastItems,
      targetDurationMinutes,
    });

    const scriptResponse = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8192,
      system: PODCAST_SCRIPT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: scriptPrompt }],
    });

    const textBlock = scriptResponse.content.find(b => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from script generation");
    }

    const scriptCost = (scriptResponse.usage.input_tokens * 1 + scriptResponse.usage.output_tokens * 5) / 1_000_000;
    budget.addCost(scriptCost);

    const segments = parseScript(textBlock.text);
    const validation = validateSegments(segments);
    if (!validation.valid) {
      console.warn("[Podcast] Script validation warnings:", validation.errors);
    }

    // Save script preview
    const preview = segments.slice(0, 3).map(s => `${s.speaker}: ${s.text.slice(0, 100)}...`).join("\n");
    await queries.updateEpisodeStatus(db, episodeId, "generating", { scriptPreview: preview });

    await updateStage(episodeId, "script_gen", "done");
    console.log(`[Podcast] Script generated: ${segments.length} segments`);

    // Stage 3: Quality Review
    await updateStage(episodeId, "quality_review", "running");

    const MAX_REVIEW_ATTEMPTS = 3;
    const PASS_THRESHOLD = 7;
    let reviewPassed = false;

    for (let attempt = 0; attempt < MAX_REVIEW_ATTEMPTS; attempt++) {
      const reviewResponse = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        system: "You are a podcast script quality reviewer. Evaluate the script for naturalness, coverage, accuracy, engagement, pacing, and transitions. Score each 1-10 and give overall score. passed=true if overall >= 7.",
        messages: [{
          role: "user",
          content: `Review this podcast script:\n\n${segments.map(s => `[${s.speaker}] ${s.text}`).join("\n\n")}\n\nReturn JSON with: overallScore, naturalness, coverage, accuracy, engagement, pacing, transitions (all numbers 1-10), passed (boolean), feedback (string), segmentsToRevise (array of {segmentOrder, issue, suggestion}).`,
        }],
      });

      const reviewText = reviewResponse.content.find(b => b.type === "text");
      if (reviewText && reviewText.type === "text") {
        try {
          const cleaned = reviewText.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const review = JSON.parse(cleaned) as { overallScore: number; passed: boolean };
          const reviewCost = (reviewResponse.usage.input_tokens * 1 + reviewResponse.usage.output_tokens * 5) / 1_000_000;
          budget.addCost(reviewCost);

          console.log(`[Podcast] Quality review attempt ${attempt + 1}: score ${review.overallScore}/10`);
          if (review.overallScore >= PASS_THRESHOLD) {
            reviewPassed = true;
            break;
          }
        } catch {
          console.warn(`[Podcast] Failed to parse quality review on attempt ${attempt + 1}`);
        }
      }
    }

    if (!reviewPassed) {
      console.warn("[Podcast] Quality review did not pass after max attempts, proceeding anyway");
    }

    await updateStage(episodeId, "quality_review", reviewPassed ? "done" : "warn");

    // Stage 4: TTS
    await updateStage(episodeId, "tts", "running");

    console.log(`[Podcast] Generating TTS for ${segments.length} segments...`);
    const ttsResults = await generateAllSegments(segments, voiceConfig);

    await updateStage(episodeId, "tts", "done");
    console.log(`[Podcast] TTS complete: ${ttsResults.length} audio segments`);

    // Stage 5: Assembly
    await updateStage(episodeId, "assembly", "running");

    const { buffer, durationSeconds } = await assembleEpisode(ttsResults);

    await updateStage(episodeId, "assembly", "done");
    console.log(`[Podcast] Assembly complete: ${durationSeconds}s`);

    // Stage 6: Upload
    await updateStage(episodeId, "upload", "running");

    const episodeKey = buildEpisodeKey(dateStr);
    const audioUrl = await uploadToS3(buffer, episodeKey, "audio/mpeg");

    // Store transcript
    let cumulativeTime = 0;
    const transcriptSegments: TranscriptSegment[] = segments.map(seg => {
      const startTime = cumulativeTime;
      cumulativeTime = cumulativeTime + seg.estimatedDuration;
      return {
        speaker: seg.speaker,
        text: seg.text,
        startTime,
        endTime: cumulativeTime,
      };
    });
    const fullText = segments.map(s => `${s.speaker}: ${s.text}`).join("\n\n");

    await db.insert(transcripts).values({
      episodeId,
      segments: transcriptSegments,
      fullText,
    });

    // Update episode as ready
    await queries.updateEpisodeStatus(db, episodeId, "ready", {
      audioUrl,
      durationSeconds,
    });

    await updateStage(episodeId, "upload", "done");
    console.log(`[Podcast] Complete: ${audioUrl} (${durationSeconds}s)`);
  } catch (error) {
    console.error("[Podcast] Generation failed:", error);
    await queries.updateEpisodeStatus(db, episodeId, "failed");
    throw error;
  }
}

// Legacy export for backward compatibility with pipeline processor
export async function processPodcast(
  digestId: string,
  _pipelineRunId: string,
  _synthesis: string,
  _budget: BudgetTracker
): Promise<string | null> {
  const dateStr = formatDigestDate(new Date());
  const voiceConfig = DEFAULT_VOICE_CONFIG;

  const episode = await queries.createEpisode(db, {
    digestId,
    title: `AI Digest Podcast — ${dateStr}`,
    status: "generating",
    voiceConfig,
    podcastStages: {
      content_select: "pending",
      script_gen: "pending",
      quality_review: "pending",
      tts: "pending",
      assembly: "pending",
      upload: "pending",
    },
  });

  try {
    // Use the new job-based processor via a fake job
    await processPodcastJob({
      data: {
        episodeId: episode.id,
        digestId,
        targetDurationMinutes: voiceConfig.targetDurationMinutes,
      },
    } as Job<PodcastJobData>);
    return episode.id;
  } catch (error) {
    console.error("Podcast generation failed:", error);
    await queries.updateEpisodeStatus(db, episode.id, "failed");
    return null;
  }
}
