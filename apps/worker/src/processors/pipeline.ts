import type { Job } from "bullmq";
import { db, queries } from "@ai-digest/db";
import { pipelineStages } from "@ai-digest/db";
import { runIngestion, runNormalization } from "@ai-digest/agents";
import { eq, and } from "drizzle-orm";
import type { StageName } from "@ai-digest/shared";

interface PipelineJobData {
  triggerType: "scheduled" | "manual";
}

const STAGES: readonly StageName[] = [
  "ingest",
  "normalize",
  "categorize",
  "score",
  "dedup",
  "synthesize",
  "output",
  "podcast",
  "newsletter",
] as const;

const DEFAULT_RETRY_COUNT = 3;
const BACKOFF_BASE_MS = 1000;

export async function processPipeline(job: Job<PipelineJobData>): Promise<void> {
  const { triggerType } = job.data;

  // Create pipeline run record
  const run = await queries.createPipelineRun(db, {
    triggerType,
    status: "running",
  });

  console.log(`[Pipeline] Started run ${run.id} (${triggerType})`);

  try {
    // Create stage records
    for (const stageName of STAGES) {
      await queries.createPipelineStage(db, {
        pipelineRunId: run.id,
        stageName,
        status: "pending",
      });
    }

    // Stage 1: Ingest
    await updateStageStatus(run.id, "ingest", "running");
    const rawItems = await withRetry(() => runIngestion(db), DEFAULT_RETRY_COUNT);
    await updateStageStatus(run.id, "ingest", "completed", rawItems.length);

    // Stage 2: Normalize
    await updateStageStatus(run.id, "normalize", "running");
    const { inserted } = await withRetry(
      () => runNormalization(db, rawItems, run.id),
      DEFAULT_RETRY_COUNT,
    );
    await updateStageStatus(run.id, "normalize", "completed", inserted);

    // Stages 3-9: Placeholder for AI analysis, podcast, newsletter
    // These will be implemented in Phase 3-5
    for (const stage of STAGES.slice(2)) {
      await updateStageStatus(run.id, stage, "skipped");
    }

    // Update run as completed
    await queries.updatePipelineRun(db, run.id, {
      status: "completed",
      itemsIngested: rawItems.length,
      completedAt: new Date(),
    });

    console.log(
      `[Pipeline] Run ${run.id} completed: ${rawItems.length} items ingested, ${inserted} normalized`,
    );
  } catch (error) {
    console.error(`[Pipeline] Run ${run.id} failed:`, error);
    await queries.updatePipelineRun(db, run.id, {
      status: "failed",
      completedAt: new Date(),
      errorDetails: error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { message: String(error) },
    });
    throw error;
  }
}

async function updateStageStatus(
  pipelineRunId: string,
  stageName: string,
  status: string,
  itemsProcessed?: number,
): Promise<void> {
  const stageRows = await db
    .select()
    .from(pipelineStages)
    .where(
      and(
        eq(pipelineStages.pipelineRunId, pipelineRunId),
        eq(pipelineStages.stageName, stageName),
      ),
    );

  const stage = stageRows[0];
  if (!stage) {
    console.warn(`[Pipeline] Stage ${stageName} not found for run ${pipelineRunId}`);
    return;
  }

  const updateData: Record<string, unknown> = { status };

  if (status === "running") {
    updateData.startedAt = new Date();
  }
  if (status === "completed" || status === "failed" || status === "skipped") {
    updateData.completedAt = new Date();
  }
  if (itemsProcessed !== undefined) {
    updateData.itemsProcessed = itemsProcessed;
  }

  await queries.updatePipelineStage(db, stage.id, updateData);

  console.log(
    `[Pipeline] Stage ${stageName}: ${status}${itemsProcessed !== undefined ? ` (${itemsProcessed} items)` : ""}`,
  );
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = BACKOFF_BASE_MS * Math.pow(2, attempt);
        console.warn(
          `[Pipeline] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}
