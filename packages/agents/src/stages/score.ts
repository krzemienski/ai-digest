import Anthropic from "@anthropic-ai/sdk";
import type { Database } from "@ai-digest/db";
import { normalizedItems, eq } from "@ai-digest/db";
import type { ScoringConfig } from "@ai-digest/shared";
import { BudgetTracker } from "../budget";
import {
  SCORE_SYSTEM_PROMPT,
  buildScorePrompt,
  type ScoreInput,
  type ScoreOutput,
} from "../prompts/score";

const BATCH_SIZE = 25;

interface ScoreResult {
  scored: number;
  costUsd: number;
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
    return { scored: 0, costUsd: 0 };
  }

  let totalScored = 0;
  let totalCost = 0;

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
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SCORE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

      const textBlock = response.content.find(block => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        console.error("No text response from score call");
        continue;
      }

      const jsonStr = textBlock.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(jsonStr) as { results: ScoreOutput[] } | ScoreOutput[];
      const results = Array.isArray(parsed) ? parsed : parsed.results;

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

      // Sonnet pricing: $3/M input, $15/M output
      const cost = (response.usage.input_tokens * 3 + response.usage.output_tokens * 15) / 1_000_000;
      totalCost = totalCost + cost;
      budget.addCost(cost);

      console.log(`Scored batch ${Math.floor(i / BATCH_SIZE) + 1}: ${results.length} items, cost: $${cost.toFixed(4)}`);
    } catch (error) {
      console.error(`Score batch failed:`, error);
    }
  }

  return { scored: totalScored, costUsd: totalCost };
}
