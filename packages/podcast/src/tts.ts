import type { Readable } from "node:stream";
import type { VoiceConfig, SpeakerVoice } from "@ai-digest/shared";
import type { ScriptSegment } from "./script-parser";

export interface TTSResult {
  order: number;
  speaker: string;
  audioBuffer: Buffer;
  requestId: string;
  durationMs: number;
}

async function collectStream(readable: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(Buffer.from(chunk as Uint8Array));
  }
  return Buffer.concat(chunks);
}

export async function generateSegmentAudio(
  segment: ScriptSegment,
  voiceId: string,
  voiceSettings: { stability: number; similarityBoost: number; speed: number; style: number },
  previousRequestIds: string[]
): Promise<TTSResult> {
  const { ElevenLabsClient } = await import("elevenlabs");
  const client = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });

  const audioStream = await client.textToSpeech.convert(voiceId, {
    text: segment.text,
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability: voiceSettings.stability,
      similarity_boost: voiceSettings.similarityBoost,
      style: voiceSettings.style,
    },
    previous_request_ids: previousRequestIds.slice(-3), // API supports up to 3
  });

  const audioBuffer = await collectStream(audioStream);

  // Estimate duration from buffer size (MP3 128kbps ~ 16KB/s)
  const estimatedDurationMs = Math.round((audioBuffer.length / 16000) * 1000);

  return {
    order: segment.order,
    speaker: segment.speaker,
    audioBuffer,
    requestId: `seg-${segment.order}-${Date.now()}`,
    durationMs: estimatedDurationMs,
  };
}

export async function generateAllSegments(
  segments: ScriptSegment[],
  voiceConfig: VoiceConfig
): Promise<TTSResult[]> {
  const results: TTSResult[] = [];
  const requestIdsBySpeaker: Record<string, string[]> = {};

  // Map speakers to voice config by role
  const speakerVoiceMap: Record<string, SpeakerVoice> = {};
  for (const voice of voiceConfig.speakers) {
    speakerVoiceMap[voice.role] = voice;
  }

  // Process segments sequentially for cross-segment continuity
  for (const segment of segments) {
    const speakerVoice = speakerVoiceMap[segment.speaker];
    if (!speakerVoice) {
      console.warn(
        `No voice configured for speaker "${segment.speaker}", skipping segment ${segment.order}`
      );
      continue;
    }

    const previousIds = requestIdsBySpeaker[segment.speaker] ?? [];

    try {
      const result = await generateSegmentAudio(
        segment,
        speakerVoice.voiceId,
        speakerVoice.settings,
        previousIds
      );

      results.push(result);

      // Track request IDs per speaker for continuity
      const updatedIds = [...previousIds, result.requestId];
      requestIdsBySpeaker[segment.speaker] = updatedIds;

      console.log(
        `TTS segment ${segment.order} (${segment.speaker}): ${result.audioBuffer.length} bytes, ~${Math.round(result.durationMs / 1000)}s`
      );
    } catch (error) {
      console.error(`TTS failed for segment ${segment.order}:`, error);
      throw error;
    }
  }

  return results;
}
