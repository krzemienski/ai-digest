import { db, queries } from "@ai-digest/db";
import { runPipeline, defaultConfig, BudgetTracker } from "@ai-digest/agents";
import type { StageCallbackFactory, StageTrackingData } from "@ai-digest/agents";
import { processPodcastFromPipeline } from "./podcast";
import { processNewsletter } from "./newsletter";

interface PipelineInput {
  triggerType: "scheduled" | "manual";
  enablePodcast?: boolean;
  enableNewsletter?: boolean;
}

const stageCallbackFactory: StageCallbackFactory = (pipelineRunId: string) => {
  const stageIds = new Map<string, string>();

  return {
    onStageStart: async (stageName: string) => {
      console.log(`[Pipeline] Stage ${stageName}: running`);
      const stage = await queries.createPipelineStage(db, {
        pipelineRunId,
        stageName,
        status: "running",
        startedAt: new Date(),
      });
      stageIds.set(stageName, stage.id);
    },
    onStageComplete: async (stageName: string, data: StageTrackingData) => {
      console.log(`[Pipeline] Stage ${stageName}: completed (${data.itemsProcessed} items)`);
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

export async function processPipeline(input: PipelineInput): Promise<void> {
  const { triggerType, enablePodcast = true, enableNewsletter = true } = input;

  console.log(`[Pipeline] Starting ${triggerType} pipeline run`);

  const result = await runPipeline(db, defaultConfig, triggerType, stageCallbackFactory);

  if (result.error) {
    throw new Error(`Pipeline failed: ${result.error}`);
  }

  console.log(`[Pipeline] Run completed. Digest: ${result.digestId ?? "none"}`);

  // Podcast stage: run after pipeline completes if digest was created
  if (enablePodcast && result.digestId) {
    console.log("[Pipeline] Starting podcast generation...");
    try {
      const digest = await queries.getDigestById(db, result.digestId);
      if (digest) {
        const podcastBudget = new BudgetTracker(defaultConfig.pipeline.maxBudgetUsd);
        const episodeId = await processPodcastFromPipeline(
          result.digestId,
          digest.pipelineRunId ?? result.run.id,
          digest.synthesis,
          podcastBudget
        );
        console.log(`[Pipeline] Podcast ${episodeId ? "ready" : "skipped/failed"}: ${episodeId ?? "none"}`);
      } else {
        console.warn("[Pipeline] Digest not found for podcast generation, skipping");
      }
    } catch (error) {
      console.error("[Pipeline] Podcast generation failed (non-fatal):", error);
    }
  }

  // Newsletter stage: send after pipeline completes
  if (enableNewsletter && result.digestId) {
    console.log("[Pipeline] Starting newsletter delivery...");
    try {
      const newsletterResult = await processNewsletter(result.digestId);
      if (newsletterResult) {
        console.log(
          `[Pipeline] Newsletter delivered: ${newsletterResult.sent} sent, ${newsletterResult.failed} failed`
        );
      } else {
        console.log("[Pipeline] Newsletter skipped (no subscribers or digest not found)");
      }
    } catch (error) {
      console.error("[Pipeline] Newsletter delivery failed (non-fatal):", error);
    }
  }
}
