import type { Job } from "bullmq";
import { db, queries } from "@ai-digest/db";
import { runPipeline, defaultConfig, BudgetTracker } from "@ai-digest/agents";
import type { StageCallback } from "@ai-digest/agents";
import { processPodcast } from "./podcast";

interface PipelineJobData {
  triggerType: "scheduled" | "manual";
  enablePodcast?: boolean;
}

export async function processPipeline(job: Job<PipelineJobData>): Promise<void> {
  const { triggerType, enablePodcast = true } = job.data;

  console.log(`[Pipeline] Starting ${triggerType} pipeline run`);

  // Create stage tracking callbacks
  const callbacks: StageCallback = {
    onStageStart: async (stageName: string) => {
      console.log(`[Pipeline] Stage ${stageName}: running`);
    },
    onStageComplete: async (stageName: string, itemsProcessed: number) => {
      console.log(`[Pipeline] Stage ${stageName}: completed (${itemsProcessed} items)`);
    },
    onStageFail: async (stageName: string, error: unknown) => {
      console.error(`[Pipeline] Stage ${stageName}: failed`, error);
    },
  };

  const result = await runPipeline(db, defaultConfig, triggerType, callbacks);

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
        const episodeId = await processPodcast(
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
      // Podcast failure is non-fatal -- the pipeline itself succeeded
    }
  }
}
