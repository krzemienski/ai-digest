"use client";

import { useState } from "react";

interface SourceHealthProps {
  readonly consecutiveErrors: number;
  readonly lastFetchAt: string | null;
  readonly lastFetchError: string | null;
}

function getHealthLevel(consecutiveErrors: number): "healthy" | "degraded" | "failing" {
  if (consecutiveErrors === 0) return "healthy";
  if (consecutiveErrors <= 2) return "degraded";
  return "failing";
}

const DOT_CLASSES: Record<ReturnType<typeof getHealthLevel>, string> = {
  healthy: "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]",
  degraded: "bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.6)]",
  failing: "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]",
};

const LABEL: Record<ReturnType<typeof getHealthLevel>, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  failing: "Failing",
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return "just now";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function SourceHealth({ consecutiveErrors, lastFetchAt, lastFetchError }: SourceHealthProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const level = getHealthLevel(consecutiveErrors);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${DOT_CLASSES[level]}`}
        aria-label={LABEL[level]}
      />

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-surface-elevated border border-surface-elevated/60 rounded-lg px-3 py-2 text-xs text-text-primary shadow-lg min-w-[180px]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${DOT_CLASSES[level]}`} />
              <span className="font-medium">{LABEL[level]}</span>
            </div>

            <div className="space-y-1 text-text-secondary">
              <div>
                <span className="text-text-secondary/70">Last fetch: </span>
                {lastFetchAt ? formatRelativeTime(lastFetchAt) : "never"}
              </div>

              <div>
                <span className="text-text-secondary/70">Errors: </span>
                {consecutiveErrors}
              </div>

              {lastFetchError && (
                <div className="mt-1 pt-1 border-t border-surface-elevated/40">
                  <span className="text-red-400 break-words line-clamp-3">
                    {lastFetchError}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
