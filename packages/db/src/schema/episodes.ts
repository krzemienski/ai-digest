import { pgTable, uuid, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import type { VoiceConfig, TranscriptSegment } from "@ai-digest/shared";
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transcripts = pgTable("transcripts", {
  id: uuid("id").defaultRandom().primaryKey(),
  episodeId: uuid("episode_id").notNull().references(() => episodes.id).unique(),
  segments: jsonb("segments").notNull().$type<TranscriptSegment[]>(),
  fullText: text("full_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
