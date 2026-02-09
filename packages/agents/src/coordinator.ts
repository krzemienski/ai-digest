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

/** Result of a complete pipeline execution. */
export interface PipelineResult {
  /** Pipeline run record with final status */
  run: PipelineRun;
  /** Created digest ID if successful */
  digestId: string | null;
  /** Created episode ID if podcast was generated */
  episodeId: string | null;
  /** Error message if pipeline failed */
  error: string | null;
}

/** Metrics tracked for a single pipeline stage. */
export interface StageTrackingData {
  /** Number of items processed in this stage */
  itemsProcessed: number;
  /** LLM model used (if applicable) */
  modelUsed?: string;
  /** Input tokens consumed (if applicable) */
  tokensInput?: number;
  /** Output tokens generated (if applicable) */
  tokensOutput?: number;
  /** Estimated cost in USD (if applicable) */
  costUsd?: number;
}

/** Callbacks for tracking pipeline stage progress. */
export interface StageCallback {
  onStageStart: (stageName: string) => Promise<void>;
  onStageComplete: (stageName: string, data: StageTrackingData) => Promise<void>;
  onStageFail: (stageName: string, error: unknown) => Promise<void>;
}

/** Factory function that creates stage callbacks for a specific pipeline run. */
export type StageCallbackFactory = (pipelineRunId: string) => StageCallback;

/**
 * Run the complete AI digest pipeline from ingestion to output.
 *
 * Executes 7 sequential stages:
 * 1. Ingest - Fetch stories from all configured sources
 * 2. Normalize - Deduplicate and standardize raw items
 * 3. Categorize - Assign topics using LLM classification
 * 4. Score - Rank items by novelty, impact, and relevance
 * 5. Dedup - Detect semantic duplicates using embeddings
 * 6. Synthesize - Generate executive summary of top stories
 * 7. Output - Create digest record and prepare for delivery
 *
 * Tracks token usage and cost across all LLM operations with budget enforcement.
 *
 * @param db - Database connection (Drizzle ORM)
 * @param config - Digest configuration including sources, topics, scoring weights
 * @param triggerType - How pipeline was initiated ("scheduled" or "manual")
 * @param callbackFactory - Optional factory for stage progress callbacks
 * @returns Pipeline result with digest ID and cost metrics
 * @throws {Error} Pipeline errors are caught and recorded in the result
 */
export async function runPipeline(
  db: Database,
  config: DigestConfig,
  triggerType: "scheduled" | "manual",
  callbackFactory?: StageCallbackFactory
): Promise<PipelineResult> {
  const budget = new BudgetTracker(config.pipeline.maxBudgetUsd);

  // Create pipeline run record
  const run = await queries.createPipelineRun(db, {
    triggerType,
    status: "running",
  });

  const callbacks = callbackFactory?.(run.id);

  let digestId: string | null = null;

  try {
    // Stage 1: Ingest
    await callbacks?.onStageStart("ingest");
    const rawItems = await runIngestion(db);
    await callbacks?.onStageComplete("ingest", { itemsProcessed: rawItems.length });

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
    await callbacks?.onStageComplete("normalize", { itemsProcessed: inserted });

    // Stage 3: Categorize
    await callbacks?.onStageStart("categorize");
    const categorizeResult = await runCategorize(db, run.id, config.topics, budget);
    await callbacks?.onStageComplete("categorize", {
      itemsProcessed: categorizeResult.categorized,
      modelUsed: categorizeResult.modelUsed,
      tokensInput: categorizeResult.tokensInput,
      tokensOutput: categorizeResult.tokensOutput,
      costUsd: categorizeResult.costUsd,
    });

    // Stage 4: Score
    await callbacks?.onStageStart("score");
    const scoreResult = await runScore(db, run.id, config.scoring, budget);
    await callbacks?.onStageComplete("score", {
      itemsProcessed: scoreResult.scored,
      modelUsed: scoreResult.modelUsed,
      tokensInput: scoreResult.tokensInput,
      tokensOutput: scoreResult.tokensOutput,
      costUsd: scoreResult.costUsd,
    });

    // Stage 5: Dedup
    await callbacks?.onStageStart("dedup");
    const dedupResult = await runDedup(db, run.id, budget);
    await callbacks?.onStageComplete("dedup", {
      itemsProcessed: dedupResult.duplicatesFound,
      modelUsed: dedupResult.modelUsed,
      tokensInput: dedupResult.tokensInput,
      tokensOutput: dedupResult.tokensOutput,
      costUsd: dedupResult.costUsd,
    });

    // Stage 6: Synthesize
    await callbacks?.onStageStart("synthesize");
    const synthesizeResult = await runSynthesize(
      db, run.id, config.synthesis, config.scoring, budget
    );
    await callbacks?.onStageComplete("synthesize", {
      itemsProcessed: synthesizeResult.itemCount,
      modelUsed: synthesizeResult.modelUsed,
      tokensInput: synthesizeResult.tokensInput,
      tokensOutput: synthesizeResult.tokensOutput,
      costUsd: synthesizeResult.costUsd,
    });

    // Stage 7: Output (create digest)
    await callbacks?.onStageStart("output");
    const outputResult = await runOutput(
      db, run.id, synthesizeResult.synthesis, config.synthesis.style, config.scoring, config.synthesis
    );
    digestId = outputResult.digestId;
    await callbacks?.onStageComplete("output", { itemsProcessed: outputResult.itemCount });

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
