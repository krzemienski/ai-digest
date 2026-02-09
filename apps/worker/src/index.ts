import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import { db, queries } from "@ai-digest/db";
import { processPipeline } from "./processors/pipeline";
import { processPodcastJob } from "./processors/podcast";
import { processDiscoveryJob } from "./processors/discovery";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const DEFAULT_CRON_PATTERN = "0 6 * * *";
const CONFIG_KEY_SCHEDULE = "pipeline.schedule";
const SCHEDULE_POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const CRON_JOB_NAME = "daily-digest";

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

// Pipeline queue
const pipelineQueue = new Queue("pipeline", { connection });

// Pipeline worker
const pipelineWorker = new Worker("pipeline", processPipeline, {
  connection,
  concurrency: 1, // Only one pipeline run at a time
});

pipelineWorker.on("completed", (job) => {
  console.log(`[Worker] Pipeline job ${job.id} completed`);
});

pipelineWorker.on("failed", (job, error) => {
  console.error(`[Worker] Pipeline job ${job?.id} failed:`, error.message);
});

// Podcast queue & worker
const podcastQueue = new Queue("podcast", { connection });
const podcastWorker = new Worker("podcast", processPodcastJob, {
  connection,
  concurrency: 1,
});

podcastWorker.on("completed", (job) => {
  console.log(`[Worker] Podcast job ${job.id} completed`);
});

podcastWorker.on("failed", (job, error) => {
  console.error(`[Worker] Podcast job ${job?.id} failed:`, error.message);
});

// Discovery queue & worker
const discoveryQueue = new Queue("discovery", { connection });
const discoveryWorker = new Worker("discovery", processDiscoveryJob, {
  connection,
  concurrency: 1,
});

discoveryWorker.on("completed", (job) => {
  console.log(`[Worker] Discovery job ${job.id} completed`);
});

discoveryWorker.on("failed", (job, error) => {
  console.error(`[Worker] Discovery job ${job?.id} failed:`, error.message);
});

// --- Cron scheduling ---

let currentCronPattern: string = DEFAULT_CRON_PATTERN;

async function readScheduleFromConfig(): Promise<string> {
  try {
    const value = await queries.getConfig(db, CONFIG_KEY_SCHEDULE);
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
    return DEFAULT_CRON_PATTERN;
  } catch (error) {
    console.error("[Worker] Failed to read schedule config:", error);
    return DEFAULT_CRON_PATTERN;
  }
}

async function removeExistingSchedule(pattern: string): Promise<void> {
  try {
    await pipelineQueue.removeRepeatable(CRON_JOB_NAME, { pattern });
  } catch {
    // Repeatable job may not exist yet -- safe to ignore
  }
}

async function applySchedule(pattern: string): Promise<void> {
  await pipelineQueue.add(
    CRON_JOB_NAME,
    { trigger: "cron" },
    { repeat: { pattern } }
  );
  console.log(`[Worker] Scheduled daily pipeline at ${pattern}`);
}

async function initScheduler(): Promise<void> {
  // Clear any stale repeatable jobs for daily-digest
  const existingJobs = await pipelineQueue.getRepeatableJobs();
  for (const job of existingJobs) {
    if (job.name === CRON_JOB_NAME) {
      await pipelineQueue.removeRepeatableByKey(job.key);
    }
  }

  const pattern = await readScheduleFromConfig();
  currentCronPattern = pattern;
  await applySchedule(pattern);
}

async function pollScheduleChanges(): Promise<void> {
  try {
    const pattern = await readScheduleFromConfig();
    if (pattern !== currentCronPattern) {
      console.log(
        `[Worker] Schedule changed from "${currentCronPattern}" to "${pattern}"`
      );
      // Remove old repeatable job before adding new one
      await removeExistingSchedule(currentCronPattern);
      currentCronPattern = pattern;
      await applySchedule(pattern);
    }
  } catch (error) {
    console.error("[Worker] Error polling schedule config:", error);
  }
}

// Initialize cron scheduler and start polling for config changes
initScheduler().catch((error) => {
  console.error("[Worker] Failed to initialize scheduler:", error);
  // Fall back to default schedule
  applySchedule(DEFAULT_CRON_PATTERN).catch(() => {});
});

const schedulePoller = setInterval(pollScheduleChanges, SCHEDULE_POLL_INTERVAL_MS);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("[Worker] Shutting down...");
  clearInterval(schedulePoller);
  await pipelineWorker.close();
  await podcastWorker.close();
  await discoveryWorker.close();
  await pipelineQueue.close();
  await podcastQueue.close();
  await discoveryQueue.close();
  connection.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("[Worker] Shutting down...");
  clearInterval(schedulePoller);
  await pipelineWorker.close();
  await podcastWorker.close();
  await discoveryWorker.close();
  await pipelineQueue.close();
  await podcastQueue.close();
  await discoveryQueue.close();
  connection.disconnect();
  process.exit(0);
});

console.log("[Worker] Connected to Redis at", REDIS_URL);
console.log("[Worker] Pipeline, podcast, and discovery processors registered");

export { pipelineQueue, podcastQueue, discoveryQueue };
