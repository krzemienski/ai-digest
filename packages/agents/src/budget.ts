import type { CostEstimate } from "@ai-digest/shared";
import { getModelById, getDefaultModelId } from "./models";

export class BudgetTracker {
  private spent = 0;
  private readonly maxBudget: number;

  constructor(maxBudgetUsd: number) {
    this.maxBudget = maxBudgetUsd;
  }

  get totalSpent(): number {
    return this.spent;
  }

  get remaining(): number {
    return this.maxBudget - this.spent;
  }

  get isOverBudget(): boolean {
    return this.spent >= this.maxBudget;
  }

  addCost(usd: number): void {
    this.spent = this.spent + usd;
  }

  canAfford(estimatedCostUsd: number): boolean {
    return this.spent + estimatedCostUsd <= this.maxBudget;
  }

  reset(): void {
    this.spent = 0;
  }
}

const STORY_COUNT_MAP: Readonly<Record<number, number>> = {
  5: 3,
  10: 5,
  15: 7,
  20: 9,
  25: 12,
  30: 15,
  45: 20,
  60: 25,
};

const ELEVENLABS_COST_PER_1K_CHARS = 0.30;

export function estimateGenerationCost(modelId: string, targetDurationMinutes: number): CostEstimate {
  const model = getModelById(modelId) ?? getModelById(getDefaultModelId())!;
  const storyCount = STORY_COUNT_MAP[targetDurationMinutes] ?? 5;

  // For 25+ min episodes, the Agent SDK runs multiple turns (each with input/output tokens)
  // Short episodes (5-20 min) use a single API call
  const isAgentMode = targetDurationMinutes >= 25;

  // Agent mode: ~20-35 turns, each with accumulated context
  // Single mode: 1 call with system prompt + user prompt
  const agentTurns = isAgentMode ? Math.round(targetDurationMinutes * 0.8) : 1;
  const avgInputPerTurn = isAgentMode
    ? 2000 + (300 * storyCount) // system prompt + stories + accumulated context
    : 800 + (200 * storyCount) + 500;
  const inputTokens = avgInputPerTurn * agentTurns;

  // Output: ~150 words/min * 1.3 tokens/word for the script content
  // Agent mode adds overhead for reasoning and tool calls per turn
  const scriptOutputTokens = Math.round(targetDurationMinutes * 150 * 1.3);
  const agentOverhead = isAgentMode ? agentTurns * 300 : 0; // reasoning per turn
  const reviewTokens = isAgentMode ? 0 : 500 * 2; // single mode has separate review
  const outputTokens = scriptOutputTokens + agentOverhead + reviewTokens;

  const anthropicCost = (inputTokens / 1_000_000) * model.inputCostPer1M
    + (outputTokens / 1_000_000) * model.outputCostPer1M;

  // ElevenLabs: ~150 words/min * 5 chars/word
  const characters = targetDurationMinutes * 150 * 5;
  const elevenLabsCost = (characters / 1000) * ELEVENLABS_COST_PER_1K_CHARS;

  return {
    anthropic: {
      inputTokens,
      outputTokens,
      cost: Math.round(anthropicCost * 10000) / 10000,
    },
    elevenlabs: {
      characters,
      cost: Math.round(elevenLabsCost * 10000) / 10000,
    },
    total: Math.round((anthropicCost + elevenLabsCost) * 10000) / 10000,
  };
}
