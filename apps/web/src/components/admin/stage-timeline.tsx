interface StageData {
  readonly name: string;
  readonly status: string;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly error?: string | null;
}

interface StageTimelineProps {
  readonly stages: readonly StageData[];
}

const STATUS_DOT_COLORS: Record<string, string> = {
  idle: "bg-surface-elevated border-text-secondary",
  pending: "bg-surface-elevated border-text-secondary",
  running: "bg-accent/20 border-accent animate-pulse",
  completed: "bg-success/20 border-success",
  failed: "bg-destructive/20 border-destructive",
  skipped: "bg-surface-elevated border-text-secondary",
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  idle: "text-text-secondary",
  pending: "text-text-secondary",
  running: "text-accent",
  completed: "text-success",
  failed: "text-destructive",
  skipped: "text-text-secondary",
};

function getDotColor(status: string): string {
  return STATUS_DOT_COLORS[status] ?? (STATUS_DOT_COLORS["pending"] as string);
}

function getTextColor(status: string): string {
  return STATUS_TEXT_COLORS[status] ?? (STATUS_TEXT_COLORS["pending"] as string);
}

function formatStageDuration(
  startedAt: string | null,
  completedAt: string | null
): string {
  if (!startedAt || !completedAt) return "";
  const diffMs =
    new Date(completedAt).getTime() - new Date(startedAt).getTime();
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${String(minutes)}m ${String(seconds)}s`;
  return `${String(seconds)}s`;
}

function isActiveStage(status: string): boolean {
  return status === "running";
}

export function StageTimeline({ stages }: StageTimelineProps) {
  if (stages.length === 0) {
    return (
      <p className="text-text-secondary text-sm">
        No stage data available.
      </p>
    );
  }

  return (
    <div className="relative pl-6">
      {stages.map((stage, idx) => {
        const isLast = idx === stages.length - 1;
        const active = isActiveStage(stage.status);
        const duration = formatStageDuration(stage.startedAt, stage.completedAt);

        return (
          <div key={`stage-${String(idx)}`} className="relative pb-6 last:pb-0">
            {/* Connecting line */}
            {!isLast && (
              <div className="absolute left-[-16px] top-3 bottom-0 border-l-2 border-surface-elevated" />
            )}

            {/* Dot */}
            <div
              className={`absolute left-[-20px] top-1 w-3 h-3 rounded-full border-2 ${getDotColor(stage.status)} ${
                active ? "ring-2 ring-accent/40" : ""
              }`}
            />

            {/* Content */}
            <div
              className={`ml-2 ${active ? "bg-accent/5 -mx-2 px-2 py-1 rounded" : ""}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-medium ${
                    active ? "text-accent" : "text-text-primary"
                  }`}
                >
                  {stage.name}
                </span>
                <span
                  className={`text-xs ${getTextColor(stage.status)}`}
                >
                  {stage.status}
                </span>
                {duration && (
                  <span className="text-xs text-text-secondary">
                    {duration}
                  </span>
                )}
              </div>

              {stage.error && (
                <p className="text-xs text-destructive mt-1 break-words">
                  {String(stage.error)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
