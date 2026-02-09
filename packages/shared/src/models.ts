import type { ModelInfo } from "./types";

export const MODEL_REGISTRY: readonly ModelInfo[] = [
  {
    id: "claude-haiku-4-5-20251001",
    name: "Claude Haiku 4.5",
    tier: "fast",
    inputCostPer1M: 1.0,
    outputCostPer1M: 5.0,
    maxOutputTokens: 8192,
  },
  {
    id: "claude-sonnet-4-5-20250929",
    name: "Claude Sonnet 4.5",
    tier: "balanced",
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    maxOutputTokens: 8192,
  },
  {
    id: "claude-opus-4-6",
    name: "Claude Opus 4.6",
    tier: "premium",
    inputCostPer1M: 15.0,
    outputCostPer1M: 75.0,
    maxOutputTokens: 128000,
  },
] as const;

export function getModelById(modelId: string): ModelInfo | undefined {
  return MODEL_REGISTRY.find(m => m.id === modelId);
}

export function getDefaultModelId(): string {
  return "claude-haiku-4-5-20251001";
}
