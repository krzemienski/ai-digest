export interface PipelineRun {
  id: string;
  status: "running" | "completed" | "failed" | "partial";
  triggerType: "scheduled" | "manual";
  startedAt: string;
  completedAt: string | null;
  itemsIngested: number;
  itemsScored: number;
  itemsDeduped: number;
  costUsd: number;
  stages: PipelineStage[];
}

export type StageName = "ingest" | "normalize" | "categorize" | "score" | "dedup" | "synthesize" | "output" | "podcast" | "newsletter";

export interface PipelineStage {
  id: string;
  stageName: StageName;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startedAt: string | null;
  completedAt: string | null;
  itemsProcessed: number;
  retryCount: number;
  errorDetails: unknown | null;
}
