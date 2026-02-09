import type { TTSResult } from "./tts";

/**
 * Lightweight MP3 assembler for serverless environments (no ffmpeg dependency).
 *
 * Works by directly concatenating MP3 buffers — valid because:
 * - All segments are CBR 128kbps / 44.1kHz from ElevenLabs
 * - MP3 is a frame-based format; concatenation produces a valid stream
 * - Decoders resync at frame boundaries automatically
 *
 * Trade-offs vs full assembler:
 * - No silence injection between speakers (smooth but abrupt transitions)
 * - No EBU R128 loudness normalization (ElevenLabs output is already well-normalized)
 * - No ID3 metadata tags
 */

/** Result of podcast episode assembly. */
export interface AssembleResult {
  /** Complete MP3 audio buffer ready for upload */
  buffer: Buffer;
  /** Estimated total duration in seconds */
  durationSeconds: number;
}

/**
 * Assemble a complete podcast episode from TTS segments via direct MP3 concatenation.
 *
 * This is a serverless-compatible assembler that works without ffmpeg by directly
 * concatenating MP3 buffers. Valid because all ElevenLabs segments are CBR 128kbps/44.1kHz
 * and MP3 decoders automatically resync at frame boundaries.
 *
 * Trade-offs vs full ffmpeg-based assembly:
 * - No silence injection between speakers
 * - No EBU R128 loudness normalization (ElevenLabs output is pre-normalized)
 * - No ID3 metadata tags
 *
 * @param segments - Ordered array of TTS results to concatenate
 * @returns Combined MP3 buffer and estimated duration
 * @throws {Error} When segments array is empty
 */
export async function assembleEpisodeLite(
  segments: TTSResult[],
): Promise<AssembleResult> {
  if (segments.length === 0) {
    throw new Error("No segments to assemble");
  }

  const sorted = [...segments].sort((a, b) => a.order - b.order);

  // Concatenate all MP3 buffers in order
  const buffers: Buffer[] = [];
  for (const segment of sorted) {
    buffers.push(segment.audioBuffer);
  }

  const buffer = Buffer.concat(buffers);

  // Estimate duration: MP3 128kbps mono = 16,000 bytes/second
  const durationSeconds = Math.round(buffer.length / 16000);

  console.log(
    `Episode assembled (lite): ${buffer.length} bytes, ~${durationSeconds}s, ${segments.length} segments`
  );

  return { buffer, durationSeconds };
}
