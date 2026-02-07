import Anthropic from "@anthropic-ai/sdk";
import { db, queries } from "@ai-digest/db";
import { transcripts, normalizedItems } from "@ai-digest/db";
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
  uploadToR2,
  buildEpisodeKey,
} from "@ai-digest/podcast";
import { eq, and, isNull, gte, desc } from "drizzle-orm";

// Default voice config
const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  speakers: [
    {
      role: "Host A",
      voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel (default ElevenLabs voice)
      settings: { stability: 0.5, similarityBoost: 0.75, speed: 1.0, style: 0.0 },
    },
    {
      role: "Host B",
      voiceId: "AZnzlk1XvdvUeBnXmlld", // Domi (default ElevenLabs voice)
      settings: { stability: 0.5, similarityBoost: 0.75, speed: 1.0, style: 0.0 },
    },
  ],
  audioFormat: "mp3_44100_128",
  targetDurationMinutes: 15,
};

export async function processPodcast(
  digestId: string,
  pipelineRunId: string,
  synthesis: string,
  budget: BudgetTracker
): Promise<string | null> {
  const dateStr = formatDigestDate(new Date());
  const voiceConfig = DEFAULT_VOICE_CONFIG;

  // Create episode record
  const episode = await queries.createEpisode(db, {
    digestId,
    title: `AI Digest Podcast — ${dateStr}`,
    status: "generating",
    voiceConfig,
  });

  try {
    // Fetch top items for podcast script context
    const topItems = await db.query.normalizedItems.findMany({
      where: and(
        eq(normalizedItems.pipelineRunId, pipelineRunId),
        isNull(normalizedItems.duplicateOf),
        gte(normalizedItems.compositeScore, 0.4)
      ),
      orderBy: [desc(normalizedItems.compositeScore)],
      limit: 15,
    });

    const podcastItems: PodcastTopicItem[] = topItems.map(item => ({
      title: item.title,
      summary: item.summary,
      source: item.source,
      topics: item.categories,
      compositeScore: item.compositeScore ?? 0,
    }));

    // Generate podcast script via Claude Opus
    const client = new Anthropic();
    const scriptPrompt = buildPodcastScriptPrompt({
      digestDate: dateStr,
      synthesis,
      items: podcastItems,
      targetDurationMinutes: voiceConfig.targetDurationMinutes,
    });

    const response = await client.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 8192,
      system: PODCAST_SCRIPT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: scriptPrompt }],
    });

    const textBlock = response.content.find(b => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from podcast script generation");
    }

    // Track Opus cost
    const scriptCost = (response.usage.input_tokens * 15 + response.usage.output_tokens * 75) / 1_000_000;
    budget.addCost(scriptCost);

    // Parse script
    const segments = parseScript(textBlock.text);
    const validation = validateSegments(segments);
    if (!validation.valid) {
      console.warn("Script validation warnings:", validation.errors);
    }

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
      episodeId: episode.id,
      segments: transcriptSegments,
      fullText,
    });

    // Generate TTS audio
    console.log(`Generating TTS for ${segments.length} segments...`);
    const ttsResults = await generateAllSegments(segments, voiceConfig);

    // Assemble final audio
    console.log("Assembling podcast audio...");
    const { buffer, durationSeconds } = await assembleEpisode(ttsResults);

    // Upload to R2
    const episodeKey = buildEpisodeKey(dateStr);
    const audioUrl = await uploadToR2(buffer, episodeKey, "audio/mpeg");

    // Update episode as ready
    await queries.updateEpisodeStatus(db, episode.id, "ready", {
      audioUrl,
      durationSeconds,
    });

    console.log(`Podcast ready: ${audioUrl} (${durationSeconds}s)`);
    return episode.id;
  } catch (error) {
    console.error("Podcast generation failed:", error);
    await queries.updateEpisodeStatus(db, episode.id, "failed");
    return null;
  }
}
