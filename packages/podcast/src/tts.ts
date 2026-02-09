import type { VoiceConfig, SpeakerVoice } from "@ai-digest/shared";
import type { ScriptSegment } from "./script-parser";

/** Result of a single TTS segment generation containing audio data and metadata. */
export interface TTSResult {
  /** Segment order number for sequencing */
  order: number;
  /** Speaker identifier (e.g., "Host A", "Host B") */
  speaker: string;
  /** MP3 audio data */
  audioBuffer: Buffer;
  /** ElevenLabs request ID for continuity tracking */
  requestId: string;
  /** Estimated duration in milliseconds */
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

/**
 * Generate audio for a single script segment using ElevenLabs TTS API.
 *
 * Uses eleven_multilingual_v2 model with MP3 output at 44.1kHz/128kbps.
 * Includes automatic retry logic for rate limits and server errors.
 *
 * @param segment - Script segment containing speaker and text
 * @param voiceId - ElevenLabs voice ID
 * @param voiceSettings - Voice tuning parameters (stability, similarity, speed, style)
 * @param previousRequestIds - Recent request IDs for cross-segment voice continuity
 * @param apiKey - ElevenLabs API key (falls back to ELEVENLABS_API_KEY env var)
 * @returns Audio buffer and metadata including estimated duration
 * @throws {Error} When API key is missing or TTS request fails after retries
 */
export async function generateSegmentAudio(
  segment: ScriptSegment,
  voiceId: string,
  voiceSettings: { stability: number; similarityBoost: number; speed: number; style: number },
  previousRequestIds: string[],
  apiKey?: string
): Promise<TTSResult> {
  const resolvedKey = apiKey ?? process.env.ELEVENLABS_API_KEY;
  if (!resolvedKey) {
    throw new Error("ElevenLabs API key is required. Pass it explicitly or set ELEVENLABS_API_KEY env var.");
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      "xi-api-key": resolvedKey,
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

/**
 * Generate TTS audio for all script segments sequentially to maintain voice continuity.
 *
 * Processes segments in order, tracking request IDs per speaker to maintain natural
 * prosody across the conversation. Automatically maps display names ("Host A") to
 * voice configurations.
 *
 * @param segments - Ordered array of script segments to convert to audio
 * @param voiceConfig - Voice configuration mapping speakers to ElevenLabs voices
 * @returns Array of TTS results in segment order
 * @throws {Error} When TTS generation fails for any segment
 */
export async function generateAllSegments(
  segments: ScriptSegment[],
  voiceConfig: VoiceConfig
): Promise<TTSResult[]> {
  const results: TTSResult[] = [];
  const requestIdsBySpeaker: Record<string, string[]> = {};

  // Map speakers to voice config by role
  // Also map display names ("Host A") to roles ("host_a") for LLM-generated scripts
  const speakerVoiceMap: Record<string, SpeakerVoice> = {};
  for (const voice of voiceConfig.speakers) {
    speakerVoiceMap[voice.role] = voice;
    // Normalize: "host_a" → also match "Host A" (display name from prompt)
    const displayName = voice.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    speakerVoiceMap[displayName] = voice;
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
