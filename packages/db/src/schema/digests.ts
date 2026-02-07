import { pgTable, uuid, text, date, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import type { DigestMetadata } from "@ai-digest/shared";
import { normalizedItems } from "./normalized-items";

export const digests = pgTable("digests", {
  id: uuid("id").defaultRandom().primaryKey(),
  digestDate: date("digest_date").notNull().unique(),
  synthesis: text("synthesis").notNull(),
  synthesisStyle: text("synthesis_style").notNull(),
  itemCount: integer("item_count").notNull(),
  metadata: jsonb("metadata").$type<DigestMetadata>(),
  pipelineRunId: uuid("pipeline_run_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const digestItems = pgTable("digest_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  digestId: uuid("digest_id").notNull().references(() => digests.id),
  normalizedItemId: text("normalized_item_id").notNull().references(() => normalizedItems.id),
  rank: integer("rank").notNull(),
  section: text("section").notNull(),
}, (table) => [
  index("idx_digest_items_digest").on(table.digestId),
]);
