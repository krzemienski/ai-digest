"use client";

import type { PodcastStage } from "@ai-digest/shared";
import type { StageState } from "../hooks/use-log-stream";

interface StageProgressProps {
  readonly stages: Record<PodcastStage, StageState>;
}

const STAGE_ORDER: readonly {
  readonly key: PodcastStage;
  readonly label: string;
  readonly shortLabel: string;
}[] = [
  { key: "content_select", label: "Content Selection", shortLabel: "Content" },
  { key: "script_gen", label: "Script Generation", shortLabel: "Script" },
  { key: "quality_review", label: "Quality Review", shortLabel: "Review" },
  { key: "tts", label: "Text-to-Speech", shortLabel: "TTS" },
  { key: "assembly", label: "Audio Assembly", shortLabel: "Assembly" },
  { key: "upload", label: "Upload", shortLabel: "Upload" },
];

function formatDuration(startedAt: string | null, completedAt: string | null): string | null {
  if (!startedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const seconds = (end - start) / 1000;

  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

function StageIndicator({ stage }: { readonly stage: StageState }) {
  switch (stage.status) {
    case "pending":
      return (
        <div className="w-8 h-8 rounded-full border-2 border-text-secondary/30 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-text-secondary/30" />
        </div>
      );
    case "running":
      return (
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      );
    case "done":
      return (
        <div className="w-8 h-8 rounded-full bg-success/20 border-2 border-success flex items-center justify-center text-success text-sm font-bold">
          ✓
        </div>
      );
    case "failed":
      return (
        <div className="w-8 h-8 rounded-full bg-destructive/20 border-2 border-destructive flex items-center justify-center text-destructive text-sm font-bold">
          ✕
        </div>
      );
  }
}

export function StageProgress({ stages }: StageProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-1">
        {STAGE_ORDER.map(({ key, shortLabel }, index) => {
          const stage = stages[key];
          const duration = formatDuration(stage.startedAt, stage.completedAt);
          const isLast = index === STAGE_ORDER.length - 1;

          return (
            <div key={key} className="flex items-start flex-1 min-w-0">
              <div className="flex flex-col items-center">
                <StageIndicator stage={stage} />
                <span
                  className={`text-xs mt-1 text-center ${
                    stage.status === "running"
                      ? "text-accent font-medium"
                      : stage.status === "done"
                        ? "text-success"
                        : stage.status === "failed"
                          ? "text-destructive"
                          : "text-text-secondary"
                  }`}
                >
                  {shortLabel}
                </span>
                {duration && (
                  <span className="text-xs text-text-secondary/70 font-mono">
                    {duration}
                  </span>
                )}
              </div>
              {!isLast && (
                <div className="flex-1 h-0.5 bg-surface-elevated mt-4 mx-1" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
