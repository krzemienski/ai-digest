import { pgTable, uuid, text, timestamp, integer, real, jsonb, index } from "drizzle-orm/pg-core";

export const pipelineRuns = pgTable("pipeline_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: text("status").notNull().default("running"),
  triggerType: text("trigger_type").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  itemsIngested: integer("items_ingested").default(0),
  itemsScored: integer("items_scored").default(0),
  itemsDeduped: integer("items_deduped").default(0),
  costUsd: real("cost_usd").default(0),
  errorDetails: jsonb("error_details"),
});

export const pipelineStages = pgTable("pipeline_stages", {
  id: uuid("id").defaultRandom().primaryKey(),
  pipelineRunId: uuid("pipeline_run_id").notNull().references(() => pipelineRuns.id),
  stageName: text("stage_name").notNull(),
  status: text("status").notNull().default("pending"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  itemsProcessed: integer("items_processed").default(0),
  retryCount: integer("retry_count").default(0),
  errorDetails: jsonb("error_details"),
  modelUsed: text("model_used"),
  tokensInput: integer("tokens_input"),
  tokensOutput: integer("tokens_output"),
  costUsd: real("cost_usd"),
}, (table) => [
  index("idx_stages_run").on(table.pipelineRunId),
]);
