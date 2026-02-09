"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { PodcastStage, LogSeverity } from "@ai-digest/shared";

export interface StreamLogEntry {
  readonly stage: PodcastStage;
  readonly severity: LogSeverity;
  readonly message: string;
  readonly metadata: Record<string, unknown> | null;
  readonly createdAt: string;
}

export type StageStatus = "pending" | "running" | "done" | "failed";

export interface StageState {
  readonly status: StageStatus;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
}

const INITIAL_STAGES: Record<PodcastStage, StageState> = {
  content_select: { status: "pending", startedAt: null, completedAt: null },
  script_gen: { status: "pending", startedAt: null, completedAt: null },
  quality_review: { status: "pending", startedAt: null, completedAt: null },
  tts: { status: "pending", startedAt: null, completedAt: null },
  assembly: { status: "pending", startedAt: null, completedAt: null },
  upload: { status: "pending", startedAt: null, completedAt: null },
};

interface CompletePayload {
  readonly status: string;
  readonly audioUrl: string | null;
  readonly durationSeconds: number | null;
  readonly costUsd: number | null;
}

interface UseLogStreamResult {
  readonly logs: readonly StreamLogEntry[];
  readonly stages: Record<PodcastStage, StageState>;
  readonly isComplete: boolean;
  readonly completionData: CompletePayload | null;
  readonly error: string | null;
  readonly clearLogs: () => void;
}

export function useLogStream(episodeId: string | null): UseLogStreamResult {
  const [logs, setLogs] = useState<readonly StreamLogEntry[]>([]);
  const [stages, setStages] = useState<Record<PodcastStage, StageState>>(INITIAL_STAGES);
  const [isComplete, setIsComplete] = useState(false);
  const [completionData, setCompletionData] = useState<CompletePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setStages(INITIAL_STAGES);
    setIsComplete(false);
    setCompletionData(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!episodeId) return;

    // Reset state for new episode
    setLogs([]);
    setStages(INITIAL_STAGES);
    setIsComplete(false);
    setCompletionData(null);
    setError(null);

    const es = new EventSource(`/api/admin/podcast/stream?episodeId=${episodeId}`);
    eventSourceRef.current = es;

    es.addEventListener("log", (event) => {
      try {
        const data = JSON.parse(event.data as string) as StreamLogEntry;
        setLogs((prev) => [...prev, data]);
      } catch {
        // Ignore malformed events
      }
    });

    es.addEventListener("stage_update", (event) => {
      try {
        const data = JSON.parse(event.data as string) as {
          readonly stage: PodcastStage;
          readonly status: string;
          readonly startedAt: string | null;
          readonly completedAt: string | null;
        };
        setStages((prev) => ({
          ...prev,
          [data.stage]: {
            status: data.status as StageStatus,
            startedAt: data.startedAt,
            completedAt: data.completedAt,
          },
        }));
      } catch {
        // Ignore malformed events
      }
    });

    es.addEventListener("complete", (event) => {
      try {
        const data = JSON.parse(event.data as string) as CompletePayload;
        setIsComplete(true);
        setCompletionData(data);
      } catch {
        // Ignore malformed events
      }
    });

    es.addEventListener("backfill_complete", () => {
      // Backfill done, real-time stream continues
    });

    es.addEventListener("error", (event) => {
      if (es.readyState === EventSource.CLOSED) {
        setError("Stream connection closed");
      } else {
        try {
          const data = JSON.parse((event as MessageEvent).data as string) as { readonly error: string };
          setError(data.error);
        } catch {
          // Browser-level EventSource error (reconnecting)
        }
      }
    });

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [episodeId]);

  return { logs, stages, isComplete, completionData, error, clearLogs };
}
