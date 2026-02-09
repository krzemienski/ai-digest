"use client";

interface CostData {
  readonly anthropicCost?: number;
  readonly elevenlabsCost?: number;
  readonly totalCost: number;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly ttsCharacters?: number;
}

interface CostBreakdownProps {
  readonly cost: CostData;
}

function getCostColor(total: number): string {
  if (total < 0.5) return "text-success";
  if (total < 2.0) return "text-yellow-400";
  return "text-destructive";
}

function formatTokens(n: number | undefined): string {
  if (!n) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function CostBreakdown({ cost }: CostBreakdownProps) {
  return (
    <div className="bg-bg border border-surface-elevated rounded-lg p-4">
      <div className="text-xs text-text-secondary uppercase mb-3">
        Cost Breakdown
      </div>
      <div className="space-y-2">
        {cost.anthropicCost !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              Anthropic
              {(cost.inputTokens !== undefined || cost.outputTokens !== undefined) && (
                <span className="text-text-secondary/60 ml-1 text-xs font-mono">
                  ({formatTokens(cost.inputTokens)} in / {formatTokens(cost.outputTokens)} out)
                </span>
              )}
            </span>
            <span className="text-text-primary font-mono">
              ${cost.anthropicCost.toFixed(3)}
            </span>
          </div>
        )}

        {cost.elevenlabsCost !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              ElevenLabs
              {cost.ttsCharacters !== undefined && (
                <span className="text-text-secondary/60 ml-1 text-xs font-mono">
                  ({cost.ttsCharacters.toLocaleString()} chars)
                </span>
              )}
            </span>
            <span className="text-text-primary font-mono">
              ${cost.elevenlabsCost.toFixed(3)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm font-medium border-t border-surface-elevated pt-2 mt-2">
          <span className="text-text-primary">Total</span>
          <span className={`font-mono ${getCostColor(cost.totalCost)}`}>
            ${cost.totalCost.toFixed(3)}
          </span>
        </div>
      </div>
    </div>
  );
}
