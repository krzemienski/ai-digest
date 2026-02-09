/**
 * Temporary script to run the pipeline against the production Supabase DB.
 * Run from apps/web/: DATABASE_URL=<prod_url> ANTHROPIC_API_KEY=<key> npx tsx _run-pipeline-prod.ts
 */

import { db, queries } from "@ai-digest/db";
import { runPipeline, defaultConfig } from "@ai-digest/agents";
import type { StageCallbackFactory, StageTrackingData } from "@ai-digest/agents";

const stageCallbackFactory: StageCallbackFactory = (pipelineRunId: string) => {
  const stageIds = new Map<string, string>();

  return {
    onStageStart: async (stageName: string) => {
      console.log(`[Pipeline] Stage ${stageName}: running (${new Date().toISOString()})`);
      const stage = await queries.createPipelineStage(db, {
        pipelineRunId,
        stageName,
        status: "running",
        startedAt: new Date(),
      });
      stageIds.set(stageName, stage.id);
    },
    onStageComplete: async (stageName: string, data: StageTrackingData) => {
      console.log(`[Pipeline] Stage ${stageName}: completed (${data.itemsProcessed} items, ${new Date().toISOString()})`);
      const stageId = stageIds.get(stageName);
      if (stageId) {
        await queries.updatePipelineStage(db, stageId, {
          status: "completed",
          completedAt: new Date(),
          itemsProcessed: data.itemsProcessed,
          modelUsed: data.modelUsed ?? null,
          tokensInput: data.tokensInput ?? null,
          tokensOutput: data.tokensOutput ?? null,
          costUsd: data.costUsd ?? null,
        });
      }
    },
    onStageFail: async (stageName: string, error: unknown) => {
      console.error(`[Pipeline] Stage ${stageName}: failed`, error);
      const stageId = stageIds.get(stageName);
      if (stageId) {
        await queries.updatePipelineStage(db, stageId, {
          status: "failed",
          completedAt: new Date(),
          errorDetails: error instanceof Error
            ? { message: error.message, stack: error.stack }
            : { message: String(error) },
        });
      }
    },
  };
};

async function main() {
  console.log("[Pipeline] Running against production DB...");
  console.log("[Pipeline] DATABASE_URL:", process.env.DATABASE_URL?.slice(0, 40) + "...");

  const start = Date.now();
  const result = await runPipeline(db, defaultConfig, "manual", stageCallbackFactory);

  if (result.error) {
    console.error("[Pipeline] Failed:", result.error);
    process.exit(1);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[Pipeline] Complete in ${elapsed}s`);
  console.log(`[Pipeline] Digest: ${result.digestId ?? "none"}`);
  console.log(`[Pipeline] Run ID: ${result.run.id}`);
  console.log(`[Pipeline] Items ingested: ${result.run.itemsIngested}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("[Pipeline] Fatal error:", err);
  process.exit(1);
});
