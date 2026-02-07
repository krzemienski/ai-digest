import type { Database } from "@ai-digest/db";
import { queries } from "@ai-digest/db";
import type { DigestConfig, PipelineRun } from "@ai-digest/shared";
import { BudgetTracker } from "./budget";
import { runIngestion } from "./stages/ingest";
import { runNormalization } from "./stages/normalize";
import { runCategorize } from "./stages/categorize";
import { runScore } from "./stages/score";
import { runDedup } from "./stages/dedup";
import { runSynthesize } from "./stages/synthesize";
import { runOutput } from "./stages/output";

export interface PipelineResult {
  run: PipelineRun;
  digestId: string | null;
  episodeId: string | null;
  error: string | null;
}

export interface StageCallback {
  onStageStart: (stageName: string) => Promise<void>;
  onStageComplete: (stageName: string, itemsProcessed: number) => Promise<void>;
  onStageFail: (stageName: string, error: unknown) => Promise<void>;
}

export async function runPipeline(
  db: Database,
  config: DigestConfig,
  triggerType: "scheduled" | "manual",
  callbacks?: StageCallback
): Promise<PipelineResult> {
  const budget = new BudgetTracker(config.pipeline.maxBudgetUsd);

  // Create pipeline run record
  const run = await queries.createPipelineRun(db, {
    triggerType,
    status: "running",
  });

  let digestId: string | null = null;

  try {
    // Stage 1: Ingest
    await callbacks?.onStageStart("ingest");
    const rawItems = await runIngestion(db);
    await callbacks?.onStageComplete("ingest", rawItems.length);

    if (rawItems.length === 0) {
      await queries.updatePipelineRun(db, run.id, {
        status: "completed",
        itemsIngested: 0,
        completedAt: new Date(),
      });
      return {
        run: { ...run, status: "completed", itemsIngested: 0, stages: [] } as unknown as PipelineRun,
        digestId: null,
        episodeId: null,
        error: null,
      };
    }

    // Stage 2: Normalize
    await callbacks?.onStageStart("normalize");
    const { inserted } = await runNormalization(db, rawItems, run.id);
    await callbacks?.onStageComplete("normalize", inserted);

    // Stage 3: Categorize
    await callbacks?.onStageStart("categorize");
    const categorizeResult = await runCategorize(db, run.id, config.topics, budget);
    await callbacks?.onStageComplete("categorize", categorizeResult.categorized);

    // Stage 4: Score
    await callbacks?.onStageStart("score");
    const scoreResult = await runScore(db, run.id, config.scoring, budget);
    await callbacks?.onStageComplete("score", scoreResult.scored);

    // Stage 5: Dedup
    await callbacks?.onStageStart("dedup");
    const dedupResult = await runDedup(db, run.id, budget);
    await callbacks?.onStageComplete("dedup", dedupResult.duplicatesFound);

    // Stage 6: Synthesize
    await callbacks?.onStageStart("synthesize");
    const synthesizeResult = await runSynthesize(
      db, run.id, config.synthesis, config.scoring, budget
    );
    await callbacks?.onStageComplete("synthesize", synthesizeResult.itemCount);

    // Stage 7: Output (create digest)
    await callbacks?.onStageStart("output");
    const outputResult = await runOutput(
      db, run.id, synthesizeResult.synthesis, config.synthesis.style, config.scoring, config.synthesis
    );
    digestId = outputResult.digestId;
    await callbacks?.onStageComplete("output", outputResult.itemCount);

    // Update run as completed
    const totalCost = budget.totalSpent;
    await queries.updatePipelineRun(db, run.id, {
      status: "completed",
      itemsIngested: rawItems.length,
      itemsScored: scoreResult.scored,
      itemsDeduped: dedupResult.duplicatesFound,
      costUsd: totalCost,
      completedAt: new Date(),
    });

    console.log(
      `[Coordinator] Pipeline completed: ${rawItems.length} ingested, ${scoreResult.scored} scored, ${dedupResult.duplicatesFound} deduped, cost: $${totalCost.toFixed(4)}`
    );

    return {
      run: { ...run, status: "completed", stages: [] } as unknown as PipelineRun,
      digestId,
      episodeId: null,
      error: null,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Coordinator] Pipeline failed:", error);

    await queries.updatePipelineRun(db, run.id, {
      status: "failed",
      costUsd: budget.totalSpent,
      completedAt: new Date(),
      errorDetails: error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { message: String(error) },
    });

    return {
      run: { ...run, status: "failed", stages: [] } as unknown as PipelineRun,
      digestId,
      episodeId: null,
      error: errorMsg,
    };
  }
}
