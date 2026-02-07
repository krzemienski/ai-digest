import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import { processPipeline } from "./processors/pipeline";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

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

console.log("[Worker] Connected to Redis at", REDIS_URL);
console.log("[Worker] Pipeline processor registered");

export { pipelineQueue };
