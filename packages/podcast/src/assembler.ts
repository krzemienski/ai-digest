import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { writeFile, unlink, mkdtemp, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import type { TTSResult } from "./tts";

// Set ffmpeg path from installer (static method exists at runtime but not in types)
(ffmpeg as unknown as { setFfmpegPath: (path: string) => void }).setFfmpegPath(
  ffmpegPath.path
);

const SILENCE_DURATION_MS = 400;
const TARGET_LUFS = -16;

interface AssembleOptions {
  introPath?: string;
  outroPath?: string;
}

export interface AssembleResult {
  buffer: Buffer;
  durationSeconds: number;
}

async function generateSilence(tempDir: string, durationMs: number): Promise<string> {
  const silencePath = join(tempDir, `silence-${durationMs}ms.mp3`);
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input("anullsrc=r=44100:cl=mono")
      .inputFormat("lavfi")
      .duration(durationMs / 1000)
      .audioCodec("libmp3lame")
      .audioBitrate("128k")
      .audioFrequency(44100)
      .audioChannels(1)
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .save(silencePath);
  });
  return silencePath;
}

export async function assembleEpisode(
  segments: TTSResult[],
  options?: AssembleOptions
): Promise<AssembleResult> {
  if (segments.length === 0) {
    throw new Error("No segments to assemble");
  }

  const tempDir = await mkdtemp(join(tmpdir(), "podcast-"));
  const tempFiles: string[] = [];
  const concatOutputPath = join(tempDir, "concat.mp3");
  const outputPath = join(tempDir, "output.mp3");

  try {
    // Write segment buffers to temp files (sorted by order)
    const sorted = [...segments].sort((a, b) => a.order - b.order);

    // Generate silence file for speaker transitions
    const silencePath = await generateSilence(tempDir, SILENCE_DURATION_MS);
    tempFiles.push(silencePath);

    // Build concat list with silence between different speakers
    const concatEntries: string[] = [];

    // Add intro if provided
    if (options?.introPath) {
      concatEntries.push(`file '${options.introPath}'`);
      concatEntries.push(`file '${silencePath}'`);
    }

    for (let i = 0; i < sorted.length; i++) {
      const segment = sorted[i]!;
      const segPath = join(tempDir, `seg-${String(segment.order).padStart(4, "0")}.mp3`);
      await writeFile(segPath, segment.audioBuffer);
      tempFiles.push(segPath);
      concatEntries.push(`file '${segPath}'`);

      // Add silence between different speakers
      const next = sorted[i + 1];
      if (next && next.speaker !== segment.speaker) {
        concatEntries.push(`file '${silencePath}'`);
      }
    }

    // Add outro if provided
    if (options?.outroPath) {
      concatEntries.push(`file '${silencePath}'`);
      concatEntries.push(`file '${options.outroPath}'`);
    }

    // Write concat file
    const concatListPath = join(tempDir, "concat.txt");
    await writeFile(concatListPath, concatEntries.join("\n"));
    tempFiles.push(concatListPath);

    // Step 1: Concat all segments
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(["-f", "concat", "-safe", "0"])
        .audioCodec("libmp3lame")
        .audioBitrate("128k")
        .audioFrequency(44100)
        .audioChannels(1) // Mono for speech
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .save(concatOutputPath);
    });
    tempFiles.push(concatOutputPath);

    // Step 2: Apply EBU R128 loudness normalization + ID3 metadata
    const dateStr = new Date().toISOString().split("T")[0] as string;
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(concatOutputPath)
        .audioFilters({ filter: "loudnorm", options: `I=${TARGET_LUFS}:TP=-1.5:LRA=11` })
        .audioCodec("libmp3lame")
        .audioBitrate("128k")
        .audioFrequency(44100)
        .audioChannels(1)
        .outputOptions([
          "-id3v2_version", "3",
          "-metadata", `title=AI Digest - ${dateStr}`,
          "-metadata", "artist=AI Digest Podcast",
          "-metadata", "genre=Technology",
          "-metadata", `date=${dateStr}`,
        ])
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .save(outputPath);
    });

    // Read output file
    const buffer = await readFile(outputPath);
    tempFiles.push(outputPath);

    // Calculate duration from buffer size (MP3 128kbps mono = 16KB/s)
    const durationSeconds = Math.round(buffer.length / 16000);

    console.log(
      `Episode assembled: ${buffer.length} bytes, ~${durationSeconds}s, ${segments.length} segments, normalized to ${TARGET_LUFS} LUFS`
    );

    return { buffer, durationSeconds };
  } finally {
    // Cleanup temp files
    for (const file of tempFiles) {
      try {
        await unlink(file);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
