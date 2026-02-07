import Anthropic from "@anthropic-ai/sdk";
import type { Database } from "@ai-digest/db";
import { normalizedItems, eq, and, isNull, gte, desc } from "@ai-digest/db";
import type { SynthesisConfig, ScoringConfig } from "@ai-digest/shared";
import { formatDigestDate } from "@ai-digest/shared";
import { BudgetTracker } from "../budget";
import {
  getSynthesizeSystemPrompt,
  buildSynthesizePrompt,
  type SynthesizeInput,
} from "../prompts/synthesize";

interface SynthesizeResult {
  synthesis: string;
  topTopics: string[];
  itemCount: number;
  costUsd: number;
}

export async function runSynthesize(
  db: Database,
  pipelineRunId: string,
  synthesisConfig: SynthesisConfig,
  scoringConfig: ScoringConfig,
  budget: BudgetTracker
): Promise<SynthesizeResult> {
  const client = new Anthropic();

  // Select top items: scored, not duplicates, above minScore
  const topItems = await db.query.normalizedItems.findMany({
    where: and(
      eq(normalizedItems.pipelineRunId, pipelineRunId),
      isNull(normalizedItems.duplicateOf),
      gte(normalizedItems.compositeScore, scoringConfig.minScore)
    ),
    orderBy: [desc(normalizedItems.compositeScore)],
    limit: synthesisConfig.maxItems,
  });

  if (topItems.length === 0) {
    return { synthesis: "No items met the quality threshold for today's digest.", topTopics: [], itemCount: 0, costUsd: 0 };
  }

  if (budget.isOverBudget) {
    return { synthesis: "Budget exceeded before synthesis stage.", topTopics: [], itemCount: 0, costUsd: 0 };
  }

  const inputs: SynthesizeInput[] = topItems.map(item => ({
    itemId: item.id,
    title: item.title,
    summary: item.summary,
    source: item.source,
    topics: item.categories,
    compositeScore: item.compositeScore ?? 0,
  }));

  const dateStr = formatDigestDate(new Date());
  const systemPrompt = getSynthesizeSystemPrompt(synthesisConfig.style);
  const userPrompt = buildSynthesizePrompt(inputs, dateStr);

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find(block => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { synthesis: "Failed to generate synthesis.", topTopics: [], itemCount: 0, costUsd: 0 };
    }

    // Collect unique topics from top items
    const allTopics: string[] = [];
    for (const item of topItems) {
      for (const topic of item.categories) {
        if (!allTopics.includes(topic)) {
          allTopics.push(topic);
        }
      }
    }

    // Opus pricing: $15/M input, $75/M output
    const cost = (response.usage.input_tokens * 15 + response.usage.output_tokens * 75) / 1_000_000;
    budget.addCost(cost);

    console.log(`Synthesis complete: ${topItems.length} items, ${allTopics.length} topics, cost: $${cost.toFixed(4)}`);

    return {
      synthesis: textBlock.text,
      topTopics: allTopics,
      itemCount: topItems.length,
      costUsd: cost,
    };
  } catch (error) {
    console.error("Synthesis failed:", error);
    return { synthesis: "Synthesis generation failed.", topTopics: [], itemCount: 0, costUsd: 0 };
  }
}
