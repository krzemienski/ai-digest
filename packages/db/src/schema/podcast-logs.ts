import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { episodes } from "./episodes";

export const podcastLogs = pgTable("podcast_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  episodeId: uuid("episode_id").notNull().references(() => episodes.id),
  stage: text("stage").notNull(),
  severity: text("severity").notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("podcast_logs_episode_id_idx").on(table.episodeId),
  index("podcast_logs_created_at_idx").on(table.createdAt),
]);
