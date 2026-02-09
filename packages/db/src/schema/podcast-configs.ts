import { pgTable, uuid, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import type { VoiceConfig } from "@ai-digest/shared";

export const podcastConfigs = pgTable("podcast_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  model: text("model").notNull().default("claude-haiku-4-5-20251001"),
  targetDurationMinutes: integer("target_duration_minutes").notNull().default(10),
  style: text("style").notNull().default("professional"),
  customStylePrompt: text("custom_style_prompt"),
  voiceConfig: jsonb("voice_config").$type<VoiceConfig>(),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
