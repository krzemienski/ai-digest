import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { Database } from "@ai-digest/db";
import { normalizedItems, eq, isNull, and } from "@ai-digest/db";
import { BudgetTracker } from "../budget";
import {
  DEDUP_SYSTEM_PROMPT,
  buildDedupPrompt,
  type DedupInput,
} from "../prompts/dedup";
import { DedupResultSchema } from "../schemas/dedup.schema";

/** Result metrics from deduplication stage. */
interface DedupResult {
  /** Number of duplicate pairs found and marked */
  duplicatesFound: number;
  /** Total cost in USD */
  costUsd: number;
  /** Model used for deduplication */
  modelUsed: string;
  /** Input tokens consumed */
  tokensInput: number;
  /** Output tokens generated */
  tokensOutput: number;
}

/**
 * Detect and mark semantic duplicates using LLM-based clustering within topic groups.
 *
 * Groups items by primary topic category, then uses Claude Haiku to identify duplicate
 * pairs with confidence scores. Only marks duplicates with ≥70% confidence.
 *
 * @param db - Database connection
 * @param pipelineRunId - ID of the current pipeline run
 * @param budget - Budget tracker for cost enforcement
 * @returns Deduplication metrics including duplicate count and token usage
 */
export async function runDedup(
  db: Database,
  pipelineRunId: string,
  budget: BudgetTracker
): Promise<DedupResult> {
  const client = new Anthropic();

  // Fetch scored items that are not already marked as duplicates
  const items = await db.query.normalizedItems.findMany({
    where: and(
      eq(normalizedItems.pipelineRunId, pipelineRunId),
      isNull(normalizedItems.duplicateOf)
    ),
  });

  // Only dedup items that have been scored
  const scored = items.filter(item => item.compositeScore !== null);

  const MODEL = "claude-haiku-4-5-20251001";

  if (scored.length < 2) {
    return { duplicatesFound: 0, costUsd: 0, modelUsed: MODEL, tokensInput: 0, tokensOutput: 0 };
  }

  // Group by primary topic (first category)
  const clusters: Record<string, typeof scored> = {};
  for (const item of scored) {
    const topic = item.categories[0] ?? "General AI";
    const existing = clusters[topic] ?? [];
    clusters[topic] = [...existing, item];
  }

  let totalDuplicates = 0;
  let totalCost = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (const [topic, clusterItems] of Object.entries(clusters)) {
    // Skip clusters with only 1 item - no possible duplicates
    if (clusterItems.length < 2) continue;

    if (budget.isOverBudget) {
      console.log("Budget exceeded, stopping dedup");
      break;
    }

    const inputs: DedupInput[] = clusterItems.map(item => ({
      itemId: item.id,
      title: item.title,
      summary: item.summary,
      source: item.source,
      compositeScore: item.compositeScore ?? 0,
    }));

    const userPrompt = buildDedupPrompt(inputs);

    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: [{ type: "text", text: DEDUP_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: userPrompt }],
        output_config: { format: zodOutputFormat(DedupResultSchema) },
      });

      const textBlock = response.content.find(block => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        console.error("No text response from dedup call");
        continue;
      }

      const parsed = DedupResultSchema.parse(JSON.parse(textBlock.text));
      const results = parsed.results;

      for (const result of results) {
        if (result.confidence >= 0.7) {
          await db.update(normalizedItems)
            .set({ duplicateOf: result.originalId })
            .where(eq(normalizedItems.id, result.duplicateId));
          totalDuplicates = totalDuplicates + 1;
        }
      }

      // Haiku 4.5 pricing: $1/M input, $5/M output
      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;
      const cost = (inputTokens * 1 + outputTokens * 5) / 1_000_000;
      totalCost = totalCost + cost;
      totalInputTokens = totalInputTokens + inputTokens;
      totalOutputTokens = totalOutputTokens + outputTokens;
      budget.addCost(cost);

      console.log(`Dedup cluster "${topic}": ${results.length} pairs found, ${totalDuplicates} marked, cost: $${cost.toFixed(4)}`);
    } catch (error) {
      console.error(`Dedup cluster "${topic}" failed:`, error);
    }
  }

  return { duplicatesFound: totalDuplicates, costUsd: totalCost, modelUsed: MODEL, tokensInput: totalInputTokens, tokensOutput: totalOutputTokens };
}
