import Anthropic from "@anthropic-ai/sdk";
import { db, queries, episodes, transcripts, normalizedItems, eq, and, isNull, gte, lte, desc } from "@ai-digest/db";
import type { VoiceConfig, TranscriptSegment, PodcastGenerationConfig, QualityScoreAttempt, PodcastStyle } from "@ai-digest/shared";
import { formatDigestDate } from "@ai-digest/shared";
import {
  PODCAST_SCRIPT_SYSTEM_PROMPT,
  buildPodcastScriptPrompt,
  buildStyledSystemPrompt,
  getModelById,
  getDefaultModelId,
  BudgetTracker,
  type PodcastTopicItem,
} from "@ai-digest/agents";
// Type-only imports are erased at compile time — no runtime module loading
import type { ScriptSegment } from "@ai-digest/podcast";

// Lazy runtime import: @ai-digest/podcast barrel re-exports assembler which
// imports fluent-ffmpeg + @ffmpeg-installer/ffmpeg at module load time.
// Those fail during Next.js build "Collecting page data" because the ffmpeg
// binary isn't found. Dynamic import() defers loading to runtime.
async function getPodcastModules() {
  const podcast = await import("@ai-digest/podcast");
  return {
    parseScript: podcast.parseScript,
    validateSegments: podcast.validateSegments,
    generateSegmentAudio: podcast.generateSegmentAudio,
    assembleEpisode: podcast.assembleEpisode,
    uploadToS3: podcast.uploadToS3,
    buildEpisodeKey: podcast.buildEpisodeKey,
  };
}
import { createLogEmitter, type LogEmitter } from "./log-emitter";
import { resolveApiKey } from "./api-keys";

export interface PodcastJobData {
  episodeId: string;
  digestId?: string | null;
  targetDurationMinutes: number;
  model?: string;
  voiceConfig?: VoiceConfig;
  style?: string;
  customStylePrompt?: string;
  dateRange?: { start: string; end: string };
}

type PodcastStage = "content_select" | "script_gen" | "quality_review" | "tts" | "assembly" | "upload";

// Duration config: how many stories to include
const STORY_COUNT_MAP: Record<number, number> = {
  5: 3,
  10: 5,
  15: 7,
  20: 9,
  25: 12,
  30: 15,
  45: 20,
  60: 25,
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

/** Format a date range as "Feb 1-7, 2026" or "Jan 28 - Feb 3, 2026" for display in prompts */
function formatDateRange(start: Date, end: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const sMonth = months[start.getUTCMonth()] as string;
  const eMonth = months[end.getUTCMonth()] as string;
  const sDay = start.getUTCDate();
  const eDay = end.getUTCDate();
  const eYear = end.getUTCFullYear();

  if (sMonth === eMonth && start.getUTCFullYear() === end.getUTCFullYear()) {
    return `${sMonth} ${sDay}-${eDay}, ${eYear}`;
  }
  return `${sMonth} ${sDay} - ${eMonth} ${eDay}, ${eYear}`;
}

async function updateStage(
  episodeId: string,
  stage: PodcastStage,
  status: string,
  log?: LogEmitter
): Promise<void> {
  const episode = await db.query.episodes.findFirst({
    where: eq(episodes.id, episodeId),
  });
  if (!episode) return;

  const stages = (episode.podcastStages as Record<string, string>) ?? {};
  const updatedStages = { ...stages, [stage]: status };
  await db.update(episodes).set({ podcastStages: updatedStages }).where(eq(episodes.id, episodeId));

  if (log) {
    const startedAt = status === "running" ? new Date() : undefined;
    const completedAt = status === "done" || status === "warn" ? new Date() : undefined;
    await log.emitStageUpdate(stage, status, startedAt, completedAt);
  }
}

function computeCost(
  inputTokens: number,
  outputTokens: number,
  modelId: string
): number {
  const model = getModelById(modelId);
  if (!model) {
    // Fallback to Haiku pricing
    return (inputTokens * 1 + outputTokens * 5) / 1_000_000;
  }
  return (inputTokens * model.inputCostPer1M + outputTokens * model.outputCostPer1M) / 1_000_000;
}

export async function processPodcastInline(data: PodcastJobData): Promise<void> {
  const { parseScript, validateSegments, generateSegmentAudio, assembleEpisode, uploadToS3, buildEpisodeKey } = await getPodcastModules();
  const { episodeId, digestId, targetDurationMinutes, dateRange } = data;
  const modelId = data.model ?? getDefaultModelId();
  const voiceConfig: VoiceConfig = {
    ...(data.voiceConfig ?? DEFAULT_VOICE_CONFIG),
    targetDurationMinutes,
  };
  const style = (data.style ?? "professional") as PodcastStyle;
  const customStylePrompt = data.customStylePrompt ?? null;

  const dateStr = dateRange
    ? formatDateRange(new Date(dateRange.start), new Date(dateRange.end))
    : formatDigestDate(new Date());
  const storyCount = STORY_COUNT_MAP[targetDurationMinutes] ?? 5;
  const budget = new BudgetTracker(5);
  const log = createLogEmitter(episodeId);

  // Build config snapshot for replay
  const configSnapshot: PodcastGenerationConfig = {
    digestId: digestId ?? null,
    dateRange: dateRange ? { start: dateRange.start, end: dateRange.end } : null,
    targetDurationMinutes: targetDurationMinutes as 5 | 10 | 15 | 20 | 25 | 30 | 45 | 60,
    model: modelId,
    voiceConfig,
    style,
    customStylePrompt,
  };

  // Store config snapshot on episode at job start
  await queries.updateEpisodeStatus(db, episodeId, "generating", {
    model: modelId,
    style,
    customStylePrompt,
    configSnapshot,
  });

  await log.emit("content_select", "info", `Starting podcast generation: model=${modelId}, style=${style}, duration=${targetDurationMinutes}min`, {
    config: configSnapshot,
  });

  try {
    // Stage 1: Content Selection
    const contentStartTime = Date.now();
    await updateStage(episodeId, "content_select", "running", log);

    const topItems = dateRange
      ? await db.query.normalizedItems.findMany({
          where: and(
            isNull(normalizedItems.duplicateOf),
            gte(normalizedItems.compositeScore, 0.3),
            gte(normalizedItems.publishedAt, new Date(dateRange.start)),
            lte(normalizedItems.publishedAt, new Date(dateRange.end))
          ),
          orderBy: [desc(normalizedItems.compositeScore)],
          limit: storyCount,
        })
      : await db.query.normalizedItems.findMany({
          where: and(
            isNull(normalizedItems.duplicateOf),
            gte(normalizedItems.compositeScore, 0.3)
          ),
          orderBy: [desc(normalizedItems.compositeScore)],
          limit: storyCount,
        });

    if (topItems.length === 0) {
      await log.emit("content_select", "error", "No scored items found for podcast content");
      throw new Error("No scored items found for podcast content");
    }

    const podcastItems: PodcastTopicItem[] = topItems.map(item => ({
      title: item.title,
      summary: item.summary,
      source: item.source,
      topics: item.categories,
      compositeScore: item.compositeScore ?? 0,
    }));

    await log.emit("content_select", "info", `Selected ${podcastItems.length} stories`, {
      stories: podcastItems.map(item => ({ title: item.title, source: item.source, score: item.compositeScore })),
      elapsedMs: Date.now() - contentStartTime,
    });

    await updateStage(episodeId, "content_select", "done", log);

    // Stage 2: Script Generation
    // Agent SDK disabled on Vercel — always use classic single-call mode
    const scriptStartTime = Date.now();
    await updateStage(episodeId, "script_gen", "running", log);

    const client = new Anthropic();
    const baseSystemPrompt = PODCAST_SCRIPT_SYSTEM_PROMPT;
    const systemPrompt = buildStyledSystemPrompt(baseSystemPrompt, style, customStylePrompt);

    const scriptPrompt = buildPodcastScriptPrompt({
      digestDate: dateStr,
      synthesis: `Top ${podcastItems.length} AI stories for ${dateStr}`,
      items: podcastItems,
      targetDurationMinutes,
    });

    await log.emit("script_gen", "info", "Sending script generation request", {
      mode: "classic",
      model: modelId,
      systemPromptLength: systemPrompt.length,
      userPromptLength: scriptPrompt.length,
    });

    const scriptResponse = await client.messages.create({
      model: modelId,
      max_tokens: 16384,
      system: systemPrompt,
      messages: [{ role: "user", content: scriptPrompt }],
    });

    const textBlock = scriptResponse.content.find(b => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      await log.emit("script_gen", "error", "No text response from script generation");
      throw new Error("No text response from script generation");
    }

    const scriptCost = computeCost(scriptResponse.usage.input_tokens, scriptResponse.usage.output_tokens, modelId);
    budget.addCost(scriptCost);

    const segments: ScriptSegment[] = parseScript(textBlock.text);
    const validation = validateSegments(segments);
    if (!validation.valid) {
      await log.emit("script_gen", "warn", "Script validation warnings", { errors: validation.errors });
    }

    const preview = segments.slice(0, 3).map(s => `${s.speaker}: ${s.text.slice(0, 100)}...`).join("\n");
    await queries.updateEpisodeStatus(db, episodeId, "generating", {
      scriptPreview: preview,
      promptsUsed: { systemPrompt, userPrompt: scriptPrompt },
    });

    await log.emit("script_gen", "info", `Script generated: ${segments.length} segments`, {
      segmentCount: segments.length,
      inputTokens: scriptResponse.usage.input_tokens,
      outputTokens: scriptResponse.usage.output_tokens,
      cost: scriptCost,
      elapsedMs: Date.now() - scriptStartTime,
    });

    await updateStage(episodeId, "script_gen", "done", log);

    // Stage 3: Quality Review
    const reviewStartTime = Date.now();
    await updateStage(episodeId, "quality_review", "running", log);

    const MAX_REVIEW_ATTEMPTS = 3;
    const PASS_THRESHOLD = 7;
    let reviewPassed = false;
    const qualityScores: QualityScoreAttempt[] = [];

    for (let attempt = 0; attempt < MAX_REVIEW_ATTEMPTS; attempt++) {
      const reviewResponse = await client.messages.create({
        model: modelId,
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
          const review = JSON.parse(cleaned) as {
            overallScore: number;
            passed: boolean;
            naturalness?: number;
            coverage?: number;
            accuracy?: number;
            engagement?: number;
            pacing?: number;
            transitions?: number;
            feedback?: string;
          };
          const reviewCost = computeCost(reviewResponse.usage.input_tokens, reviewResponse.usage.output_tokens, modelId);
          budget.addCost(reviewCost);

          const scoreAttempt: QualityScoreAttempt = {
            attempt: attempt + 1,
            scores: {
              naturalness: review.naturalness ?? 0,
              coverage: review.coverage ?? 0,
              accuracy: review.accuracy ?? 0,
              engagement: review.engagement ?? 0,
              pacing: review.pacing ?? 0,
              transitions: review.transitions ?? 0,
            },
            overall: review.overallScore,
            passed: review.overallScore >= PASS_THRESHOLD,
          };
          qualityScores.push(scoreAttempt);

          await log.emit("quality_review", "info", `Attempt ${attempt + 1}: score ${review.overallScore}/10`, {
            attempt: attempt + 1,
            scores: scoreAttempt.scores,
            overall: review.overallScore,
            passed: scoreAttempt.passed,
            feedback: review.feedback ?? null,
            cost: reviewCost,
          });

          if (review.overallScore >= PASS_THRESHOLD) {
            reviewPassed = true;
            break;
          }
        } catch {
          await log.emit("quality_review", "warn", `Failed to parse quality review on attempt ${attempt + 1}`);
        }
      }
    }

    // Store quality scores on episode
    await queries.updateEpisodeStatus(db, episodeId, "generating", {
      qualityScores,
    });

    if (!reviewPassed) {
      await log.emit("quality_review", "warn", "Quality review did not pass after max attempts, proceeding anyway", {
        attempts: qualityScores.length,
        elapsedMs: Date.now() - reviewStartTime,
      });
    }

    await updateStage(episodeId, "quality_review", reviewPassed ? "done" : "warn", log);

    // Stage 4: TTS (segment-by-segment with logging)
    const ttsStartTime = Date.now();
    await updateStage(episodeId, "tts", "running", log);

    // Resolve ElevenLabs API key: DB first, then env fallback
    const elevenLabsKey = await resolveApiKey("elevenlabs");

    await log.emit("tts", "info", `Starting TTS for ${segments.length} segments`);

    const ttsResults: Array<{ order: number; speaker: string; audioBuffer: Buffer; requestId: string; durationMs: number }> = [];
    const requestIdsBySpeaker: Record<string, string[]> = {};
    const speakerVoiceMap: Record<string, (typeof voiceConfig.speakers)[number]> = {};
    for (const voice of voiceConfig.speakers) {
      speakerVoiceMap[voice.role] = voice;
      // Also map display names ("Host A") to roles ("host_a") for LLM-generated scripts
      const displayName = voice.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      speakerVoiceMap[displayName] = voice;
    }

    let ttsTotalCharacters = 0;

    for (const segment of segments) {
      const speakerVoice = speakerVoiceMap[segment.speaker];
      if (!speakerVoice) {
        await log.emit("tts", "warn", `No voice configured for speaker "${segment.speaker}", skipping segment ${segment.order}`);
        continue;
      }

      const previousIds = requestIdsBySpeaker[segment.speaker] ?? [];
      const segStartTime = Date.now();

      try {
        const result = await generateSegmentAudio(
          segment,
          speakerVoice.voiceId,
          speakerVoice.settings,
          previousIds,
          elevenLabsKey
        );

        ttsResults.push(result);
        ttsTotalCharacters += segment.text.length;

        const updatedIds = [...previousIds, result.requestId];
        requestIdsBySpeaker[segment.speaker] = updatedIds;

        await log.emit("tts", "info", `Segment ${segment.order} of ${segments.length} (${segment.speaker}, ${segment.text.length} chars) — ${(result.durationMs / 1000).toFixed(1)}s`, {
          segmentOrder: segment.order,
          totalSegments: segments.length,
          speaker: segment.speaker,
          characters: segment.text.length,
          durationMs: result.durationMs,
          audioBytes: result.audioBuffer.length,
          elapsedMs: Date.now() - segStartTime,
        });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        await log.emit("tts", "error", `TTS failed for segment ${segment.order}: ${errMsg}`, {
          segmentOrder: segment.order,
          speaker: segment.speaker,
        });
        throw error;
      }
    }

    const ttsCost = (ttsTotalCharacters / 1000) * 0.30;
    budget.addCost(ttsCost);

    // Track cost split for transparency dashboard
    const anthropicCost = budget.totalSpent - ttsCost;

    await log.emit("tts", "info", `TTS complete: ${ttsResults.length} segments, ${ttsTotalCharacters} chars`, {
      segmentCount: ttsResults.length,
      totalCharacters: ttsTotalCharacters,
      cost: ttsCost,
      elapsedMs: Date.now() - ttsStartTime,
    });

    await updateStage(episodeId, "tts", "done", log);

    // Stage 5: Assembly
    const assemblyStartTime = Date.now();
    await updateStage(episodeId, "assembly", "running", log);

    await log.emit("assembly", "info", "Starting audio concatenation");

    const { buffer, durationSeconds } = await assembleEpisode(ttsResults);

    await log.emit("assembly", "info", `Assembly complete: ${durationSeconds}s, ${buffer.length} bytes`, {
      durationSeconds,
      audioBytes: buffer.length,
      elapsedMs: Date.now() - assemblyStartTime,
    });

    await updateStage(episodeId, "assembly", "done", log);

    // Stage 6: Upload
    const uploadStartTime = Date.now();
    await updateStage(episodeId, "upload", "running", log);

    const episodeKey = buildEpisodeKey(dateStr);
    await log.emit("upload", "info", `Uploading to S3: ${episodeKey}`);

    const audioUrl = await uploadToS3(buffer, episodeKey, "audio/mpeg");

    await log.emit("upload", "info", `Upload complete: ${audioUrl}`, {
      s3Key: episodeKey,
      contentType: "audio/mpeg",
      fileSize: buffer.length,
      elapsedMs: Date.now() - uploadStartTime,
    });

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

    // Delete any existing transcript from a prior failed run before inserting
    await db.delete(transcripts).where(eq(transcripts.episodeId, episodeId));
    await db.insert(transcripts).values({
      episodeId,
      segments: transcriptSegments,
      fullText,
    });

    // Calculate total cost
    const totalCost = budget.totalSpent;

    // Merge cost breakdown into existing promptsUsed
    const currentEpisode = await db.query.episodes.findFirst({ where: eq(episodes.id, episodeId) });
    const existingPrompts = (currentEpisode?.promptsUsed as Record<string, unknown>) ?? {};
    const promptsWithCosts = {
      ...existingPrompts,
      costBreakdown: {
        anthropicCost,
        elevenlabsCost: ttsCost,
        ttsCharacters: ttsTotalCharacters,
        totalCost,
      },
    };

    // Update episode as ready with final data
    await queries.updateEpisodeStatus(db, episodeId, "ready", {
      audioUrl,
      durationSeconds,
      costUsd: totalCost,
      promptsUsed: promptsWithCosts,
    });

    await updateStage(episodeId, "upload", "done", log);

    await log.emit("upload", "info", `Podcast generation complete`, {
      audioUrl,
      durationSeconds,
      totalCost,
      model: modelId,
      style,
    });

    await log.emitComplete("ready", audioUrl, durationSeconds, totalCost);

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    await log.emit("upload", "error", `Generation failed: ${errMsg}`, {
      error: errMsg,
    });
    await log.emitComplete("failed");
    await queries.updateEpisodeStatus(db, episodeId, "failed");
    throw error;
  }
}

// Legacy export for pipeline processor — creates the episode then runs inline
export async function processPodcastFromPipeline(
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
    await processPodcastInline({
      episodeId: episode.id,
      digestId,
      targetDurationMinutes: voiceConfig.targetDurationMinutes,
    });
    return episode.id;
  } catch (error) {
    console.error("Podcast generation failed:", error);
    await queries.updateEpisodeStatus(db, episode.id, "failed");
    return null;
  }
}
