import { pgTable, uuid, text, integer, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import type { VoiceConfig, TranscriptSegment, PodcastGenerationConfig, QualityScoreAttempt } from "@ai-digest/shared";
import { digests } from "./digests";

export const episodes = pgTable("episodes", {
  id: uuid("id").defaultRandom().primaryKey(),
  digestId: uuid("digest_id").notNull().references(() => digests.id),
  title: text("title").notNull(),
  audioUrl: text("audio_url"),
  durationSeconds: integer("duration_seconds"),
  audioFormat: text("audio_format").default("mp3_44100_128"),
  voiceConfig: jsonb("voice_config").$type<VoiceConfig>(),
  status: text("status").notNull().default("pending"),
  targetDurationMinutes: integer("target_duration_minutes").default(10),
  podcastStages: jsonb("podcast_stages"),
  scriptPreview: text("script_preview"),
  // New columns for transparency dashboard
  model: text("model"),
  style: text("style"),
  customStylePrompt: text("custom_style_prompt"),
  costUsd: real("cost_usd"),
  configSnapshot: jsonb("config_snapshot").$type<PodcastGenerationConfig>(),
  promptsUsed: jsonb("prompts_used").$type<Record<string, unknown>>(),
  qualityScores: jsonb("quality_scores").$type<QualityScoreAttempt[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transcripts = pgTable("transcripts", {
  id: uuid("id").defaultRandom().primaryKey(),
  episodeId: uuid("episode_id").notNull().references(() => episodes.id).unique(),
  segments: jsonb("segments").notNull().$type<TranscriptSegment[]>(),
  fullText: text("full_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
