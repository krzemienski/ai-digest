import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
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
import { SynthesizeResultSchema } from "../schemas/synthesize.schema";

interface SynthesizeResult {
  synthesis: string;
  topTopics: string[];
  itemCount: number;
  costUsd: number;
  modelUsed: string;
  tokensInput: number;
  tokensOutput: number;
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

  const MODEL = "claude-sonnet-4-5-20250929";

  if (topItems.length === 0) {
    return { synthesis: "No items met the quality threshold for today's digest.", topTopics: [], itemCount: 0, costUsd: 0, modelUsed: MODEL, tokensInput: 0, tokensOutput: 0 };
  }

  if (budget.isOverBudget) {
    return { synthesis: "Budget exceeded before synthesis stage.", topTopics: [], itemCount: 0, costUsd: 0, modelUsed: MODEL, tokensInput: 0, tokensOutput: 0 };
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
      model: MODEL,
      max_tokens: 4096,
      system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userPrompt }],
      output_config: { format: zodOutputFormat(SynthesizeResultSchema) },
    });

    const textBlock = response.content.find(block => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { synthesis: "Failed to generate synthesis.", topTopics: [], itemCount: 0, costUsd: 0, modelUsed: MODEL, tokensInput: 0, tokensOutput: 0 };
    }

    const parsed = SynthesizeResultSchema.parse(JSON.parse(textBlock.text));

    // Sonnet 4.5 pricing: $3/M input, $15/M output
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const cost = (inputTokens * 3 + outputTokens * 15) / 1_000_000;
    budget.addCost(cost);

    console.log(`Synthesis complete: ${topItems.length} items, ${parsed.topTopics.length} topics, cost: $${cost.toFixed(4)}`);

    return {
      synthesis: parsed.synthesis,
      topTopics: parsed.topTopics,
      itemCount: parsed.itemCount,
      costUsd: cost,
      modelUsed: MODEL,
      tokensInput: inputTokens,
      tokensOutput: outputTokens,
    };
  } catch (error) {
    console.error("Synthesis failed:", error);
    return { synthesis: "Synthesis generation failed.", topTopics: [], itemCount: 0, costUsd: 0, modelUsed: MODEL, tokensInput: 0, tokensOutput: 0 };
  }
}
