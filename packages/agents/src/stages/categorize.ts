import Anthropic from "@anthropic-ai/sdk";
import type { Database } from "@ai-digest/db";
import { normalizedItems, eq } from "@ai-digest/db";
import type { TopicConfig } from "@ai-digest/shared";
import { BudgetTracker } from "../budget";
import {
  CATEGORIZE_SYSTEM_PROMPT,
  buildCategorizePrompt,
  type CategorizeInput,
  type CategorizeOutput,
} from "../prompts/categorize";

const BATCH_SIZE = 25;

interface CategorizeResult {
  categorized: number;
  costUsd: number;
}

export async function runCategorize(
  db: Database,
  pipelineRunId: string,
  topics: TopicConfig[],
  budget: BudgetTracker
): Promise<CategorizeResult> {
  const client = new Anthropic();

  // Fetch items for this pipeline run that haven't been categorized yet
  const items = await db.query.normalizedItems.findMany({
    where: eq(normalizedItems.pipelineRunId, pipelineRunId),
  });

  const uncategorized = items.filter(item => item.categories.length === 0);

  if (uncategorized.length === 0) {
    return { categorized: 0, costUsd: 0 };
  }

  let totalCategorized = 0;
  let totalCost = 0;

  // Process in batches
  for (let i = 0; i < uncategorized.length; i += BATCH_SIZE) {
    if (budget.isOverBudget) {
      console.log("Budget exceeded, stopping categorization");
      break;
    }

    const batch = uncategorized.slice(i, i + BATCH_SIZE);
    const inputs: CategorizeInput[] = batch.map(item => ({
      itemId: item.id,
      title: item.title,
      summary: item.summary,
      content: item.content ?? undefined,
    }));

    const userPrompt = buildCategorizePrompt(inputs, topics);

    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: CATEGORIZE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

      // Extract text content
      const textBlock = response.content.find(block => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        console.error("No text response from categorize call");
        continue;
      }

      // Parse JSON from response (may be wrapped in ```json blocks)
      const jsonStr = textBlock.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(jsonStr) as { results: CategorizeOutput[] } | CategorizeOutput[];
      const results = Array.isArray(parsed) ? parsed : parsed.results;

      // Update items in DB
      for (const result of results) {
        const matchingItem = batch.find(item => item.id === result.itemId);
        if (matchingItem && result.topics.length > 0) {
          await db.update(normalizedItems)
            .set({ categories: result.topics })
            .where(eq(normalizedItems.id, result.itemId));
          totalCategorized = totalCategorized + 1;
        }
      }

      // Track cost (approximate: input + output tokens)
      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;
      // Sonnet pricing: $3/M input, $15/M output
      const cost = (inputTokens * 3 + outputTokens * 15) / 1_000_000;
      totalCost = totalCost + cost;
      budget.addCost(cost);

      console.log(`Categorized batch ${Math.floor(i / BATCH_SIZE) + 1}: ${results.length} items, cost: $${cost.toFixed(4)}`);
    } catch (error) {
      console.error(`Categorize batch failed:`, error);
      // Continue with next batch instead of failing entirely
    }
  }

  return { categorized: totalCategorized, costUsd: totalCost };
}
