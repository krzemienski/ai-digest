import Anthropic from "@anthropic-ai/sdk";
import { eq, isNull, and } from "drizzle-orm";
import type { Database } from "@ai-digest/db";
import { normalizedItems } from "@ai-digest/db";
import { BudgetTracker } from "../budget";
import {
  DEDUP_SYSTEM_PROMPT,
  buildDedupPrompt,
  type DedupInput,
  type DedupOutput,
} from "../prompts/dedup";

interface DedupResult {
  duplicatesFound: number;
  costUsd: number;
}

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

  if (scored.length < 2) {
    return { duplicatesFound: 0, costUsd: 0 };
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
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        system: DEDUP_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

      const textBlock = response.content.find(block => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        console.error("No text response from dedup call");
        continue;
      }

      const jsonStr = textBlock.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(jsonStr) as { results: DedupOutput[] } | DedupOutput[];
      const results = Array.isArray(parsed) ? parsed : parsed.results;

      for (const result of results) {
        if (result.confidence >= 0.7) {
          await db.update(normalizedItems)
            .set({ duplicateOf: result.originalId })
            .where(eq(normalizedItems.id, result.duplicateId));
          totalDuplicates = totalDuplicates + 1;
        }
      }

      // Haiku pricing: $1/M input, $5/M output
      const cost = (response.usage.input_tokens * 1 + response.usage.output_tokens * 5) / 1_000_000;
      totalCost = totalCost + cost;
      budget.addCost(cost);

      console.log(`Dedup cluster "${topic}": ${results.length} pairs found, ${totalDuplicates} marked, cost: $${cost.toFixed(4)}`);
    } catch (error) {
      console.error(`Dedup cluster "${topic}" failed:`, error);
    }
  }

  return { duplicatesFound: totalDuplicates, costUsd: totalCost };
}
