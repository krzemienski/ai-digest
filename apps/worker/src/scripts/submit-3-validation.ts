/**
 * Submit 3 validation podcast generation jobs with distinct configurations.
 * Run: cd apps/worker && npx tsx src/scripts/submit-3-validation.ts
 */
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { db, queries } from "@ai-digest/db";
import { digests, desc } from "@ai-digest/db";
import type { PodcastJobData } from "../processors/podcast";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const connection = new IORedis(REDIS_URL);
const podcastQueue = new Queue<PodcastJobData>("podcast", { connection });

interface ValidationConfig {
  label: string;
  style: string;
  targetDurationMinutes: number;
  voiceConfig: {
    speakers: {
      role: string;
      voiceId: string;
      settings: {
        stability: number;
        similarityBoost: number;
        speed: number;
        style: number;
      };
    }[];
    audioFormat: string;
    targetDurationMinutes: number;
  };
}

const CONFIGS: readonly ValidationConfig[] = [
  {
    label: "Gen 1: Professional, 30 min, Brian + Sarah (default voices)",
    style: "professional",
    targetDurationMinutes: 30,
    voiceConfig: {
      speakers: [
        {
          role: "host_a",
          voiceId: "nPczCjzI2devNBz1zQrb", // Brian
          settings: { stability: 0.70, similarityBoost: 0.75, speed: 1.0, style: 0.30 },
        },
        {
          role: "host_b",
          voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah
          settings: { stability: 0.60, similarityBoost: 0.70, speed: 1.0, style: 0.40 },
        },
      ],
      audioFormat: "mp3_44100_128",
      targetDurationMinutes: 30,
    },
  },
  {
    label: "Gen 2: Casual, 30 min, Drew + Charlotte",
    style: "casual",
    targetDurationMinutes: 30,
    voiceConfig: {
      speakers: [
        {
          role: "host_a",
          voiceId: "29vD33N1CtxCmqQRPOHJ", // Drew
          settings: { stability: 0.55, similarityBoost: 0.80, speed: 1.05, style: 0.50 },
        },
        {
          role: "host_b",
          voiceId: "XB0fDUnXU5powFXDhCwa", // Charlotte
          settings: { stability: 0.50, similarityBoost: 0.75, speed: 1.05, style: 0.55 },
        },
      ],
      audioFormat: "mp3_44100_128",
      targetDurationMinutes: 30,
    },
  },
  {
    label: "Gen 3: Technical, 30 min, Chris + Lily",
    style: "technical",
    targetDurationMinutes: 30,
    voiceConfig: {
      speakers: [
        {
          role: "host_a",
          voiceId: "iP95p4xoKVk53GoZ742B", // Chris
          settings: { stability: 0.75, similarityBoost: 0.70, speed: 0.95, style: 0.20 },
        },
        {
          role: "host_b",
          voiceId: "pFZP5JQG7iQjIQuC4Bku", // Lily
          settings: { stability: 0.65, similarityBoost: 0.75, speed: 0.95, style: 0.25 },
        },
      ],
      audioFormat: "mp3_44100_128",
      targetDurationMinutes: 30,
    },
  },
];

async function main() {
  // Find latest digest
  const latestDigest = await db.select().from(digests).orderBy(desc(digests.createdAt)).limit(1);
  const digest = latestDigest[0];
  if (!digest) {
    console.error("No digests found");
    process.exit(1);
  }
  console.log(`Using digest: ${digest.id} (${digest.digestDate})`);

  const model = "claude-haiku-4-5-20251001";

  for (const config of CONFIGS) {
    console.log(`\nSubmitting: ${config.label}`);

    // Create episode
    const episode = await queries.createEpisode(db, {
      digestId: digest.id,
      title: `AI Digest — Validation ${config.style} ${new Date().toISOString().slice(0, 10)}`,
      status: "pending",
      targetDurationMinutes: config.targetDurationMinutes,
      model,
      style: config.style,
      voiceConfig: config.voiceConfig,
      podcastStages: {
        content_select: "pending",
        script_gen: "pending",
        quality_review: "pending",
        tts: "pending",
        assembly: "pending",
        upload: "pending",
      },
    });
    console.log(`  Episode created: ${episode.id}`);

    // Submit job
    const job = await podcastQueue.add("generate", {
      episodeId: episode.id,
      digestId: digest.id,
      targetDurationMinutes: config.targetDurationMinutes,
      model,
      voiceConfig: config.voiceConfig,
      style: config.style,
    });
    console.log(`  Job submitted: ${job.id}`);
  }

  console.log("\n3 validation jobs submitted. Monitor at http://localhost:3000/admin/podcast");
  await connection.quit();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
