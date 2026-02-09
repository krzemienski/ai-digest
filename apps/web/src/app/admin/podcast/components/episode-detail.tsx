"use client";

import { useState, useEffect, useCallback } from "react";
import { ScriptViewer } from "./script-viewer";
import { CostBreakdown } from "./cost-breakdown";
import { LogViewer } from "./log-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StreamLogEntry } from "../hooks/use-log-stream";

interface QualityScore {
  readonly attempt: number;
  readonly scores: Record<string, number>;
  readonly overall: number;
  readonly passed: boolean;
}

interface CostBreakdownData {
  readonly anthropicCost?: number;
  readonly elevenlabsCost?: number;
  readonly ttsCharacters?: number;
  readonly totalCost?: number;
}

interface EpisodeData {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly audioUrl: string | null;
  readonly durationSeconds: number | null;
  readonly targetDurationMinutes: number | null;
  readonly model: string | null;
  readonly style: string | null;
  readonly customStylePrompt: string | null;
  readonly costUsd: number | null;
  readonly costBreakdown: CostBreakdownData | null;
  readonly configSnapshot: Record<string, unknown> | null;
  readonly promptsUsed: Record<string, unknown> | null;
  readonly qualityScores: readonly QualityScore[] | null;
  readonly podcastStages: Record<string, unknown> | null;
  readonly scriptPreview: string | null;
  readonly createdAt: string;
}

interface TranscriptData {
  readonly segments: readonly {
    readonly speaker: string;
    readonly text: string;
    readonly estimatedDurationSeconds?: number;
  }[];
}

interface LogData {
  readonly stage: string;
  readonly severity: string;
  readonly message: string;
  readonly metadata: Record<string, unknown> | null;
  readonly createdAt: string;
}

interface EpisodeDetailResponse {
  readonly success: boolean;
  readonly data?: {
    readonly episode: EpisodeData;
    readonly transcript: TranscriptData | null;
    readonly logs: readonly LogData[];
  };
  readonly error?: string;
}

interface EpisodeDetailProps {
  readonly episodeId: string;
  readonly onReplay?: (configSnapshot: Record<string, unknown>) => void;
}

export function EpisodeDetail({ episodeId, onReplay }: EpisodeDetailProps) {
  const [episode, setEpisode] = useState<EpisodeData | null>(null);
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [logs, setLogs] = useState<readonly LogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expandable sections
  const [showPrompts, setShowPrompts] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/admin/podcast/episode/${episodeId}`, {
          credentials: "include",
        });
        const data = (await res.json()) as EpisodeDetailResponse;

        if (data.success && data.data) {
          setEpisode(data.data.episode);
          setTranscript(data.data.transcript);
          setLogs(data.data.logs);
        } else {
          setError(data.error ?? "Failed to load episode");
        }
      } catch {
        setError("Network error: could not load episode details");
      } finally {
        setLoading(false);
      }
    };

    void fetchDetail();
  }, [episodeId]);

  const handleReplay = useCallback(() => {
    if (episode?.configSnapshot && onReplay) {
      onReplay(episode.configSnapshot);
    }
  }, [episode, onReplay]);

  if (loading) {
    return (
      <div className="bg-surface border border-surface-elevated rounded-lg p-6 animate-pulse space-y-3">
        <div className="h-5 w-60 bg-surface-elevated rounded" />
        <div className="h-20 bg-surface-elevated rounded" />
        <div className="h-40 bg-surface-elevated rounded" />
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="bg-surface border border-surface-elevated rounded-lg p-6 text-sm text-destructive">
        {error ?? "Episode not found"}
      </div>
    );
  }

  const modelShort = episode.model
    ? episode.model.split("-").slice(1, 3).join(" ")
    : "Default";
  const styleLabel = episode.style?.replace(/_/g, " ") ?? "default";

  return (
    <div className="bg-surface border border-surface-elevated rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-elevated">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-text-primary">{episode.title}</h3>
          <Badge
            color={
              episode.status === "ready"
                ? "#10b981"
                : episode.status === "failed"
                  ? "#ef4444"
                  : "#3b82f6"
            }
          >
            {episode.status}
          </Badge>
        </div>
        <div className="text-xs text-text-secondary mt-1">
          <span className="capitalize">{modelShort}</span>
          {" | "}
          <span className="capitalize">{styleLabel}</span>
          {" | "}
          <span>{episode.targetDurationMinutes ?? "?"}min target</span>
          {episode.durationSeconds && (
            <>
              {" | "}
              <span>
                {Math.floor(episode.durationSeconds / 60)}m{" "}
                {Math.round(episode.durationSeconds % 60)}s actual
              </span>
            </>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Audio Player */}
        {episode.audioUrl && (
          <div>
            <div className="text-xs text-text-secondary uppercase mb-1">Audio</div>
            <audio controls src={episode.audioUrl} className="w-full" />
          </div>
        )}

        {/* Cost */}
        {episode.costUsd !== null && (
          <CostBreakdown cost={{
            totalCost: episode.costUsd,
            anthropicCost: episode.costBreakdown?.anthropicCost,
            elevenlabsCost: episode.costBreakdown?.elevenlabsCost,
            ttsCharacters: episode.costBreakdown?.ttsCharacters,
          }} />
        )}

        {/* Quality Scores */}
        {episode.qualityScores && Array.isArray(episode.qualityScores) && episode.qualityScores.length > 0 && (
          <div className="bg-bg border border-surface-elevated rounded-lg p-3">
            <div className="text-xs text-text-secondary uppercase mb-2">
              Quality Scores
            </div>
            {(episode.qualityScores as readonly QualityScore[]).map((attempt) => (
              <div key={attempt.attempt} className="mb-2 last:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-text-secondary">
                    Attempt {attempt.attempt}
                  </span>
                  <Badge color={attempt.passed ? "#10b981" : "#ef4444"}>
                    {attempt.passed ? "Pass" : "Fail"}
                  </Badge>
                  <span className="text-xs font-mono text-text-primary ml-auto">
                    {attempt.overall.toFixed(1)}/10
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(attempt.scores).map(([key, value]) => (
                    <span
                      key={key}
                      className="text-xs text-text-secondary bg-surface-elevated px-2 py-0.5 rounded"
                    >
                      {key}: {typeof value === "number" ? value.toFixed(1) : String(value)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Prompts (expandable) */}
        {episode.promptsUsed && (
          <div>
            <button
              type="button"
              onClick={() => setShowPrompts((p) => !p)}
              className="text-xs text-accent hover:underline"
            >
              {showPrompts ? "Hide Prompts" : "Show Prompts"}
            </button>
            {showPrompts && (
              <div className="mt-2 space-y-2">
                {Object.entries(episode.promptsUsed).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-bg border border-surface-elevated rounded p-2"
                  >
                    <div className="text-[10px] text-text-secondary uppercase mb-1">
                      {key.replace(/_/g, " ")}
                    </div>
                    <pre className="text-xs text-text-primary whitespace-pre-wrap break-words max-h-40 overflow-y-auto font-mono">
                      {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Script */}
        {transcript?.segments && transcript.segments.length > 0 && (
          <ScriptViewer segments={transcript.segments} />
        )}

        {/* Logs (expandable) */}
        {logs.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowLogs((p) => !p)}
              className="text-xs text-accent hover:underline"
            >
              {showLogs ? "Hide Pipeline Logs" : `Show Pipeline Logs (${logs.length})`}
            </button>
            {showLogs && (
              <div className="mt-2">
                <LogViewer
                  logs={logs.map((l) => ({
                    ...l,
                    stage: l.stage as StreamLogEntry["stage"],
                    severity: l.severity as StreamLogEntry["severity"],
                  }))}
                  maxHeight="300px"
                />
              </div>
            )}
          </div>
        )}

        {/* Replay Button */}
        {episode.configSnapshot && onReplay && (
          <Button
            variant="primary"
            size="lg"
            onClick={handleReplay}
            className="w-full"
          >
            Recreate with These Settings
          </Button>
        )}
      </div>
    </div>
  );
}
