"use client";

import { MODEL_REGISTRY } from "@ai-digest/shared";
import { Badge } from "@/components/ui/badge";

interface ModelSelectorProps {
  readonly value: string;
  readonly onChange: (modelId: string) => void;
  readonly disabled?: boolean;
}

const TIER_COLORS: Record<string, string> = {
  fast: "#10b981",
  balanced: "#3b82f6",
  premium: "#f59e0b",
};

const TIER_LABELS: Record<string, string> = {
  fast: "Fast",
  balanced: "Balanced",
  premium: "Premium",
};

function estimateCostHint(outputCostPer1M: number): string {
  const scriptTokens = 4000;
  const cost = (scriptTokens / 1_000_000) * outputCostPer1M;
  if (cost < 0.01) return "<$0.01";
  return `~$${cost.toFixed(2)}`;
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  return (
    <div>
      <label className="block text-xs text-text-secondary uppercase mb-2">
        AI Model
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {MODEL_REGISTRY.map((model) => {
          const isSelected = value === model.id;
          return (
            <button
              key={model.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(model.id)}
              className={`relative flex flex-col items-start p-3 rounded border transition-all text-left ${
                isSelected
                  ? "bg-accent/10 border-accent"
                  : "bg-bg border-surface-elevated hover:border-accent/50"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-text-primary">
                  {model.name}
                </span>
                <Badge color={TIER_COLORS[model.tier] ?? "#6b7280"}>
                  {TIER_LABELS[model.tier] ?? model.tier}
                </Badge>
              </div>
              <span className="text-xs text-text-secondary">
                Script: {estimateCostHint(model.outputCostPer1M)} per generation
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
