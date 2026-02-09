"use client";

interface ScriptSegment {
  readonly speaker: string;
  readonly text: string;
  readonly estimatedDurationSeconds?: number;
}

interface ScriptViewerProps {
  readonly segments: readonly ScriptSegment[];
}

const SPEAKER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  host_a: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
  host_b: { bg: "bg-accent/10", text: "text-accent", border: "border-accent/30" },
};

function getSpeakerStyle(speaker: string) {
  const normalized = speaker.toLowerCase().replace(/\s+/g, "_");
  return SPEAKER_COLORS[normalized] ?? { bg: "bg-surface-elevated", text: "text-text-secondary", border: "border-surface-elevated" };
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function ScriptViewer({ segments }: ScriptViewerProps) {
  const totalDuration = segments.reduce(
    (sum, s) => sum + (s.estimatedDurationSeconds ?? 0),
    0
  );

  return (
    <div className="bg-bg border border-surface-elevated rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-elevated">
        <span className="text-xs text-text-secondary uppercase">
          Full Script ({segments.length} segments)
        </span>
        {totalDuration > 0 && (
          <span className="text-xs text-text-secondary">
            ~{formatDuration(totalDuration)} total
          </span>
        )}
      </div>
      <div className="max-h-[500px] overflow-y-auto divide-y divide-surface-elevated/30">
        {segments.map((segment, index) => {
          const style = getSpeakerStyle(segment.speaker);
          return (
            <div key={index} className="px-3 py-2.5">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text} border ${style.border}`}
                >
                  {segment.speaker.replace(/_/g, " ")}
                </span>
                {segment.estimatedDurationSeconds !== undefined && segment.estimatedDurationSeconds > 0 && (
                  <span className="text-xs text-text-secondary/60 font-mono">
                    {formatDuration(segment.estimatedDurationSeconds)}
                  </span>
                )}
                <span className="text-xs text-text-secondary/40">
                  #{index + 1}
                </span>
              </div>
              <p className="text-sm text-text-primary leading-relaxed">
                {segment.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
