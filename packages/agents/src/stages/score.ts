import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { Database } from "@ai-digest/db";
import { normalizedItems, eq } from "@ai-digest/db";
import type { ScoringConfig } from "@ai-digest/shared";
import { BudgetTracker } from "../budget";
import {
  SCORE_SYSTEM_PROMPT,
  buildScorePrompt,
  type ScoreInput,
} from "../prompts/score";
import { ScoreResultSchema } from "../schemas/score.schema";

const BATCH_SIZE = 25;

interface ScoreResult {
  scored: number;
  costUsd: number;
  modelUsed: string;
  tokensInput: number;
  tokensOutput: number;
}

export async function runScore(
  db: Database,
  pipelineRunId: string,
  scoringConfig: ScoringConfig,
  budget: BudgetTracker
): Promise<ScoreResult> {
  const client = new Anthropic();

  // Fetch categorized items that haven't been scored yet
  const items = await db.query.normalizedItems.findMany({
    where: eq(normalizedItems.pipelineRunId, pipelineRunId),
  });

  const unscored = items.filter(item =>
    item.categories.length > 0 && item.compositeScore === null
  );

  if (unscored.length === 0) {
    return { scored: 0, costUsd: 0, modelUsed: "claude-sonnet-4-5-20250929", tokensInput: 0, tokensOutput: 0 };
  }

  const MODEL = "claude-sonnet-4-5-20250929";
  let totalScored = 0;
  let totalCost = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let i = 0; i < unscored.length; i += BATCH_SIZE) {
    if (budget.isOverBudget) {
      console.log("Budget exceeded, stopping scoring");
      break;
    }

    const batch = unscored.slice(i, i + BATCH_SIZE);
    const inputs: ScoreInput[] = batch.map(item => ({
      itemId: item.id,
      title: item.title,
      summary: item.summary,
      source: item.source,
      categories: item.categories,
    }));

    const userPrompt = buildScorePrompt(inputs);

    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: [{ type: "text", text: SCORE_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: userPrompt }],
        output_config: { format: zodOutputFormat(ScoreResultSchema) },
      });

      const textBlock = response.content.find(block => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        console.error("No text response from score call");
        continue;
      }

      const parsed = ScoreResultSchema.parse(JSON.parse(textBlock.text));
      const results = parsed.results;

      for (const result of results) {
        const matchingItem = batch.find(item => item.id === result.itemId);
        if (matchingItem) {
          // Calculate composite score from configurable weights
          const compositeScore =
            result.relevanceScore * scoringConfig.relevanceWeight +
            result.noveltyScore * scoringConfig.noveltyWeight +
            result.impactScore * scoringConfig.impactWeight;

          await db.update(normalizedItems)
            .set({
              relevanceScore: result.relevanceScore,
              noveltyScore: result.noveltyScore,
              impactScore: result.impactScore,
              compositeScore,
            })
            .where(eq(normalizedItems.id, result.itemId));
          totalScored = totalScored + 1;
        }
      }

      // Sonnet 4.5 pricing: $3/M input, $15/M output
      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;
      const cost = (inputTokens * 3 + outputTokens * 15) / 1_000_000;
      totalCost = totalCost + cost;
      totalInputTokens = totalInputTokens + inputTokens;
      totalOutputTokens = totalOutputTokens + outputTokens;
      budget.addCost(cost);

      console.log(`Scored batch ${Math.floor(i / BATCH_SIZE) + 1}: ${results.length} items, cost: $${cost.toFixed(4)}`);
    } catch (error) {
      console.error(`Score batch failed:`, error);
    }
  }

  return { scored: totalScored, costUsd: totalCost, modelUsed: MODEL, tokensInput: totalInputTokens, tokensOutput: totalOutputTokens };
}
