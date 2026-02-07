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

interface AssembleOptions {
  introPath?: string;
  outroPath?: string;
}

export interface AssembleResult {
  buffer: Buffer;
  durationSeconds: number;
}

export async function assembleEpisode(
  segments: TTSResult[],
  options?: AssembleOptions
): Promise<AssembleResult> {
  if (segments.length === 0) {
    throw new Error("No segments to assemble");
  }

  // Create temp directory for segment files
  const tempDir = await mkdtemp(join(tmpdir(), "podcast-"));
  const tempFiles: string[] = [];
  const outputPath = join(tempDir, "output.mp3");

  try {
    // Write segment buffers to temp files (sorted by order)
    const sorted = [...segments].sort((a, b) => a.order - b.order);

    for (const segment of sorted) {
      const segPath = join(
        tempDir,
        `seg-${String(segment.order).padStart(4, "0")}.mp3`
      );
      await writeFile(segPath, segment.audioBuffer);
      tempFiles.push(segPath);
    }

    // Add intro if provided
    if (options?.introPath) {
      tempFiles.unshift(options.introPath);
    }

    // Add outro if provided
    if (options?.outroPath) {
      tempFiles.push(options.outroPath);
    }

    // Create concat file list for ffmpeg
    const concatListPath = join(tempDir, "concat.txt");
    const concatContent = tempFiles.map((f) => `file '${f}'`).join("\n");
    await writeFile(concatListPath, concatContent);

    // Run ffmpeg concat
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(["-f", "concat", "-safe", "0"])
        .audioCodec("libmp3lame")
        .audioBitrate("128k")
        .audioFrequency(44100)
        .audioChannels(2)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .save(outputPath);
    });

    // Read output file
    const buffer = await readFile(outputPath);

    // Calculate duration from buffer size (MP3 128kbps = 16KB/s)
    const durationSeconds = Math.round(buffer.length / 16000);

    console.log(
      `Episode assembled: ${buffer.length} bytes, ~${durationSeconds}s, ${segments.length} segments`
    );

    return { buffer, durationSeconds };
  } finally {
    // Cleanup temp files
    const allTempFiles = [
      ...tempFiles,
      outputPath,
      join(tempDir, "concat.txt"),
    ];
    for (const file of allTempFiles) {
      try {
        await unlink(file);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
