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
  idle: "bg-cyber-overlay border-cyber-text-secondary",
  pending: "bg-cyber-overlay border-cyber-text-secondary",
  running: "bg-cyber-cyan/20 border-cyber-cyan animate-pulse",
  completed: "bg-cyber-green/20 border-cyber-green",
  failed: "bg-cyber-magenta/20 border-cyber-magenta",
  skipped: "bg-cyber-overlay border-cyber-text-secondary",
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  idle: "text-cyber-text-secondary",
  pending: "text-cyber-text-secondary",
  running: "text-cyber-cyan",
  completed: "text-cyber-green",
  failed: "text-cyber-magenta",
  skipped: "text-cyber-text-secondary",
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
      <p className="font-mono text-cyber-text-secondary text-sm">
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
              <div className="absolute left-[-16px] top-3 bottom-0 border-l-2 border-cyber-overlay" />
            )}

            {/* Dot */}
            <div
              className={`absolute left-[-20px] top-1 w-3 h-3 rounded-full border-2 ${getDotColor(stage.status)} ${
                active ? "ring-2 ring-cyber-cyan/40" : ""
              }`}
            />

            {/* Content */}
            <div
              className={`ml-2 ${active ? "bg-cyber-cyan/5 -mx-2 px-2 py-1 rounded" : ""}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`font-mono text-sm font-medium ${
                    active ? "text-cyber-cyan" : "text-cyber-text"
                  }`}
                >
                  {stage.name}
                </span>
                <span
                  className={`font-mono text-xs ${getTextColor(stage.status)}`}
                >
                  {stage.status}
                </span>
                {duration && (
                  <span className="font-mono text-xs text-cyber-text-secondary">
                    {duration}
                  </span>
                )}
              </div>

              {stage.error && (
                <p className="font-mono text-xs text-cyber-magenta mt-1 break-words">
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
