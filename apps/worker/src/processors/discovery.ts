import { Job } from "bullmq";
import IORedis from "ioredis";
import { db, queries } from "@ai-digest/db";
import { runDiscoveryAgent } from "@ai-digest/agents";
import type { DiscoveryAgentConfig } from "@ai-digest/agents";
import { resolveApiKey } from "../lib/api-keys";

export interface DiscoveryJobData {
  readonly runId: string;
}

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

// Dedicated Redis connection for progress publishing (separate from BullMQ connection)
const publisherRedis = new IORedis(REDIS_URL);

function buildChannel(runId: string): string {
  return `discovery:${runId}`;
}

async function publishProgress(
  runId: string,
  message: string,
): Promise<void> {
  const channel = buildChannel(runId);
  const payload = JSON.stringify({
    type: "progress",
    runId,
    message,
    createdAt: new Date().toISOString(),
  });

  await publisherRedis
    .publish(channel, payload)
    .catch((err: unknown) => {
      console.warn("[Discovery] Redis publish failed (non-fatal):", err);
    });
}

async function publishComplete(
  runId: string,
  status: string,
  candidateCount: number,
  error?: string,
): Promise<void> {
  const channel = buildChannel(runId);
  const payload = JSON.stringify({
    type: "complete",
    runId,
    status,
    candidateCount,
    error: error ?? null,
    createdAt: new Date().toISOString(),
  });

  await publisherRedis
    .publish(channel, payload)
    .catch((err: unknown) => {
      console.warn("[Discovery] Redis complete publish failed (non-fatal):", err);
    });
}

export async function processDiscoveryJob(
  job: Job<DiscoveryJobData>,
): Promise<void> {
  const { runId } = job.data;

  // Fetch the discovery run from DB
  const run = await queries.getDiscoveryRun(db, runId);
  if (!run) {
    throw new Error(`Discovery run not found: ${runId}`);
  }

  // Mark as running
  await queries.updateDiscoveryRun(db, runId, {
    status: "running",
    startedAt: new Date(),
  });

  await publishProgress(runId, "Discovery job started");

  try {
    // Resolve Anthropic API key (DB first, then env fallback)
    const apiKey = await resolveApiKey("anthropic");

    const config: DiscoveryAgentConfig = {
      topics: run.topics ?? [],
      sourceTypes: run.sourceTypes ?? [],
      maxSources: run.maxSources ?? 10,
      apiKey,
      onProgress: (message: string) => {
        // Fire-and-forget progress updates to Redis
        void publishProgress(runId, message);
      },
    };

    await publishProgress(runId, `Starting discovery: topics=[${config.topics.join(", ")}], maxSources=${config.maxSources}`);

    const result = await runDiscoveryAgent(config);

    // On success: store candidates and mark completed
    await queries.updateDiscoveryRun(db, runId, {
      status: "completed",
      candidates: result.candidates as unknown[],
      completedAt: new Date(),
    });

    await publishProgress(
      runId,
      `Discovery completed: ${result.candidates.length} candidates found in ${Math.round(result.durationMs / 1000)}s`,
    );
    await publishComplete(runId, "completed", result.candidates.length);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);

    // On error: store error message and mark failed
    await queries.updateDiscoveryRun(db, runId, {
      status: "failed",
      error: errMsg,
      completedAt: new Date(),
    });

    await publishProgress(runId, `Discovery failed: ${errMsg}`);
    await publishComplete(runId, "failed", 0, errMsg);

    throw error;
  }
}
