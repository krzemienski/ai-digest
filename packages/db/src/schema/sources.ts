import { pgTable, uuid, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import type { SourceConfig } from "@ai-digest/shared";

export const sources = pgTable("sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull(), // "rss" | "github" | "arxiv" | "hackernews" | "huggingface" | "reddit" | "producthunt"
  name: text("name").notNull(),
  config: jsonb("config").notNull().$type<SourceConfig>(),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
