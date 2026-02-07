import type { Job } from "bullmq";
import { db } from "@ai-digest/db";
import { runPipeline, defaultConfig } from "@ai-digest/agents";
import type { StageCallback } from "@ai-digest/agents";

interface PipelineJobData {
  triggerType: "scheduled" | "manual";
}

export async function processPipeline(job: Job<PipelineJobData>): Promise<void> {
  const { triggerType } = job.data;

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
}
