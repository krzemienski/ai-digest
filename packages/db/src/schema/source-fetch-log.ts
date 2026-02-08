import { pgTable, uuid, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { sources } from "./sources";

export const sourceFetchLog = pgTable("source_fetch_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceId: uuid("source_id").notNull().references(() => sources.id, { onDelete: "cascade" }),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  itemCount: integer("item_count").notNull().default(0),
  error: text("error"),
  durationMs: integer("duration_ms"),
}, (table) => [
  index("idx_fetch_log_source").on(table.sourceId),
  index("idx_fetch_log_fetched_at").on(table.fetchedAt),
]);
