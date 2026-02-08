import type { VoiceConfig, SpeakerVoice } from "@ai-digest/shared";
import type { ScriptSegment } from "./script-parser";

export interface TTSResult {
  order: number;
  speaker: string;
  audioBuffer: Buffer;
  requestId: string;
  durationMs: number;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES
): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(url, options);

    if (response.ok) {
      return response;
    }

    if ((response.status === 429 || response.status >= 500) && attempt < retries - 1) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn(`TTS request failed (${response.status}), retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    const errorText = await response.text().catch(() => "unknown");
    throw new Error(`ElevenLabs TTS failed (${response.status}): ${errorText}`);
  }

  throw new Error("TTS retries exhausted");
}

export async function generateSegmentAudio(
  segment: ScriptSegment,
  voiceId: string,
  voiceSettings: { stability: number; similarityBoost: number; speed: number; style: number },
  previousRequestIds: string[]
): Promise<TTSResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY environment variable is required");
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: segment.text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: voiceSettings.stability,
        similarity_boost: voiceSettings.similarityBoost,
        style: voiceSettings.style,
      },
      previous_request_ids: previousRequestIds.slice(-3),
    }),
  });

  const requestId = response.headers.get("request-id") ?? `fallback-${Date.now()}`;
  const audioBuffer = Buffer.from(await response.arrayBuffer());

  // Estimate duration from buffer size (MP3 128kbps ~ 16KB/s)
  const estimatedDurationMs = Math.round((audioBuffer.length / 16000) * 1000);

  return {
    order: segment.order,
    speaker: segment.speaker,
    audioBuffer,
    requestId,
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
