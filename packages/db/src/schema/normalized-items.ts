import { pgTable, text, timestamp, jsonb, real, uuid, index } from "drizzle-orm/pg-core";

export const normalizedItems = pgTable("normalized_items", {
  id: text("id").primaryKey(), // deterministic hash: source + sourceId
  source: text("source").notNull(),
  sourceId: text("source_id").notNull(),
  sourceUrl: text("source_url").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content"),
  authors: text("authors").array().notNull().default([]),
  publishedAt: timestamp("published_at").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  categories: text("categories").array().notNull().default([]),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  relevanceScore: real("relevance_score"),
  noveltyScore: real("novelty_score"),
  impactScore: real("impact_score"),
  compositeScore: real("composite_score"),
  duplicateOf: text("duplicate_of"),
  pipelineRunId: uuid("pipeline_run_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_items_composite_score").on(table.compositeScore),
  index("idx_items_source").on(table.source),
  index("idx_items_published").on(table.publishedAt),
  index("idx_items_pipeline_run").on(table.pipelineRunId),
]);
