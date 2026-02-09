import { pgTable, uuid, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const discoveryRuns = pgTable("discovery_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: text("status").notNull().default("pending"), // pending | running | completed | failed
  topics: text("topics").array(),
  sourceTypes: text("source_types").array(),
  maxSources: integer("max_sources").default(10),
  candidates: jsonb("candidates").default([]),
  addedSourceIds: text("added_source_ids").array().default([]),
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
