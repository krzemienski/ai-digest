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

export function createLogEmitter(episodeId: string): LogEmitter {
  return {
    async emit(stage, severity, message, metadata) {
      await queries.insertLog(db, {
        episodeId,
        stage,
        severity,
        message,
        metadata: metadata ?? null,
      });
    },

    async emitStageUpdate(_stage, _status, _startedAt, _completedAt) {
      // No-op: stage updates were Redis-only for real-time SSE push.
      // The DB polling SSE stream reads from podcast_logs instead.
    },

    async emitComplete(_status, _audioUrl, _durationSeconds, _costUsd) {
      // No-op: completion signals were Redis-only.
      // The SSE stream detects completion by checking episode status.
    },
  };
}
