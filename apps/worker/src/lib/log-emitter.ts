import type { Redis } from "ioredis";
import { db, queries } from "@ai-digest/db";
import type { PodcastStage, LogSeverity } from "@ai-digest/shared";

export interface LogEmitter {
  readonly emit: (
    stage: PodcastStage,
    severity: LogSeverity,
    message: string,
    metadata?: Record<string, unknown>
  ) => Promise<void>;
  readonly emitStageUpdate: (
    stage: PodcastStage,
    status: string,
    startedAt?: Date,
    completedAt?: Date
  ) => Promise<void>;
  readonly emitComplete: (
    status: string,
    audioUrl?: string,
    durationSeconds?: number,
    costUsd?: number
  ) => Promise<void>;
}

export function createLogEmitter(redis: Redis, episodeId: string): LogEmitter {
  const channel = `podcast:${episodeId}:logs`;

  return {
    async emit(stage, severity, message, metadata) {
      const entry = {
        episodeId,
        stage,
        severity,
        message,
        metadata: metadata ?? null,
      };

      const redisPayload = JSON.stringify({
        ...entry,
        type: "log",
        createdAt: new Date().toISOString(),
      });

      // Parallel: persist to DB + publish to Redis
      // DB is source of truth; Redis failure is non-fatal
      const dbPromise = queries.insertLog(db, entry);
      const redisPromise = redis
        .publish(channel, redisPayload)
        .catch((err: unknown) => {
          console.warn(`[LogEmitter] Redis publish failed (non-fatal):`, err);
        });

      await Promise.all([dbPromise, redisPromise]);
    },

    async emitStageUpdate(stage, status, startedAt, completedAt) {
      const payload = JSON.stringify({
        type: "stage_update",
        episodeId,
        stage,
        status,
        startedAt: startedAt?.toISOString() ?? null,
        completedAt: completedAt?.toISOString() ?? null,
        createdAt: new Date().toISOString(),
      });

      await redis
        .publish(channel, payload)
        .catch((err: unknown) => {
          console.warn(`[LogEmitter] Redis stage_update publish failed (non-fatal):`, err);
        });
    },

    async emitComplete(status, audioUrl, durationSeconds, costUsd) {
      const payload = JSON.stringify({
        type: "complete",
        episodeId,
        status,
        audioUrl: audioUrl ?? null,
        durationSeconds: durationSeconds ?? null,
        costUsd: costUsd ?? null,
        createdAt: new Date().toISOString(),
      });

      await redis
        .publish(channel, payload)
        .catch((err: unknown) => {
          console.warn(`[LogEmitter] Redis complete publish failed (non-fatal):`, err);
        });
    },
  };
}
