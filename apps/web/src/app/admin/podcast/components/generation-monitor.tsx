"use client";

import { useState, useEffect, useCallback } from "react";
import { useLogStream } from "../hooks/use-log-stream";
import { StageProgress } from "./stage-progress";
import { LogViewer } from "./log-viewer";
import { ScriptViewer } from "./script-viewer";
import { CostBreakdown } from "./cost-breakdown";

interface EpisodeDetail {
  readonly episode: {
    readonly id: string;
    readonly title: string;
    readonly status: string;
    readonly audioUrl: string | null;
    readonly durationSeconds: number | null;
    readonly costUsd: number | null;
    readonly model: string | null;
    readonly style: string | null;
    readonly qualityScores: unknown;
    readonly promptsUsed: unknown;
  };
  readonly transcript: {
    readonly segments: readonly {
      readonly speaker: string;
      readonly text: string;
      readonly estimatedDurationSeconds?: number;
    }[];
  } | null;
}

interface EpisodeDetailResponse {
  readonly success: boolean;
  readonly data?: EpisodeDetail;
  readonly error?: string;
}

interface GenerationMonitorProps {
  readonly episodeId: string;
  readonly onReset?: () => void;
}

export function GenerationMonitor({ episodeId, onReset }: GenerationMonitorProps) {
  const { logs, stages, isComplete, completionData, error: streamError } = useLogStream(episodeId);
  const [episodeDetail, setEpisodeDetail] = useState<EpisodeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch full episode detail on completion
  useEffect(() => {
    if (!isComplete) return;

    const fetchDetail = async () => {
      setDetailLoading(true);
      try {
        const res = await fetch(`/api/admin/podcast/episode/${episodeId}`, {
          credentials: "include",
        });
        const data = (await res.json()) as EpisodeDetailResponse;
        if (data.success && data.data) {
          setEpisodeDetail(data.data);
        }
      } catch {
        // Silent — logs already show completion status
      } finally {
        setDetailLoading(false);
      }
    };
    void fetchDetail();
  }, [isComplete, episodeId]);

  const isFailed = completionData?.status === "failed";
  const audioUrl = completionData?.audioUrl ?? episodeDetail?.episode.audioUrl ?? null;
  const costUsd = completionData?.costUsd ?? episodeDetail?.episode.costUsd ?? null;
  const durationSeconds = completionData?.durationSeconds ?? episodeDetail?.episode.durationSeconds ?? null;

  const handleNewGeneration = useCallback(() => {
    if (onReset) onReset();
  }, [onReset]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-text-secondary uppercase">
          {isComplete
            ? isFailed
              ? "Generation Failed"
              : "Generation Complete"
            : "Generating..."}
        </div>
        {isComplete && onReset && (
          <button
            type="button"
            onClick={handleNewGeneration}
            className="text-xs text-accent hover:underline"
          >
            New Generation
          </button>
        )}
      </div>

      {/* Stage Progress */}
      <StageProgress stages={stages} />

      {/* Stream Error */}
      {streamError && (
        <div className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded p-3">
          Stream error: {streamError}
        </div>
      )}

      {/* Log Viewer */}
      <LogViewer logs={logs} maxHeight={isComplete ? "250px" : "400px"} />

      {/* Completion Results */}
      {isComplete && !isFailed && (
        <div className="space-y-4">
          {/* Audio Player */}
          {audioUrl && (
            <div className="bg-bg border border-surface-elevated rounded-lg p-4">
              <div className="text-xs text-text-secondary uppercase mb-2">
                Audio {durationSeconds ? `(${Math.round(durationSeconds / 60)}m ${Math.round(durationSeconds % 60)}s)` : ""}
              </div>
              <audio controls src={audioUrl} className="w-full" />
            </div>
          )}

          {/* Cost Breakdown */}
          {costUsd !== null && (
            <CostBreakdown
              cost={{ totalCost: costUsd }}
            />
          )}

          {/* Script Viewer */}
          {detailLoading && (
            <div className="text-sm text-text-secondary animate-pulse p-4">
              Loading transcript...
            </div>
          )}
          {episodeDetail?.transcript?.segments && episodeDetail.transcript.segments.length > 0 && (
            <ScriptViewer segments={episodeDetail.transcript.segments} />
          )}
        </div>
      )}

      {/* Failure Details */}
      {isComplete && isFailed && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
          <div className="text-sm text-destructive font-medium mb-1">
            Generation failed
          </div>
          <div className="text-xs text-text-secondary">
            Check the logs above for error details. You can start a new generation with different settings.
          </div>
        </div>
      )}
    </div>
  );
}
