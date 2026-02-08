import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { Database } from "@ai-digest/db";
import { normalizedItems, eq } from "@ai-digest/db";
import type { TopicConfig } from "@ai-digest/shared";
import { BudgetTracker } from "../budget";
import {
  CATEGORIZE_SYSTEM_PROMPT,
  buildCategorizePrompt,
  type CategorizeInput,
} from "../prompts/categorize";
import { CategorizeResultSchema } from "../schemas/categorize.schema";

const BATCH_SIZE = 25;

interface CategorizeResult {
  categorized: number;
  costUsd: number;
  modelUsed: string;
  tokensInput: number;
  tokensOutput: number;
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
    return { categorized: 0, costUsd: 0, modelUsed: "claude-haiku-4-5-20251001", tokensInput: 0, tokensOutput: 0 };
  }

  const MODEL = "claude-haiku-4-5-20251001";
  let totalCategorized = 0;
  let totalCost = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

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
        model: MODEL,
        max_tokens: 4096,
        system: [{ type: "text", text: CATEGORIZE_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: userPrompt }],
        output_config: { format: zodOutputFormat(CategorizeResultSchema) },
      });

      const textBlock = response.content.find(block => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        console.error("No text response from categorize call");
        continue;
      }

      const parsed = CategorizeResultSchema.parse(JSON.parse(textBlock.text));
      const results = parsed.results;

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

      // Track cost (Haiku pricing: $1/M input, $5/M output)
      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;
      const cost = (inputTokens * 1 + outputTokens * 5) / 1_000_000;
      totalCost = totalCost + cost;
      totalInputTokens = totalInputTokens + inputTokens;
      totalOutputTokens = totalOutputTokens + outputTokens;
      budget.addCost(cost);

      console.log(`Categorized batch ${Math.floor(i / BATCH_SIZE) + 1}: ${results.length} items, cost: $${cost.toFixed(4)}`);
    } catch (error) {
      console.error(`Categorize batch failed:`, error);
      // Continue with next batch instead of failing entirely
    }
  }

  return { categorized: totalCategorized, costUsd: totalCost, modelUsed: MODEL, tokensInput: totalInputTokens, tokensOutput: totalOutputTokens };
}
