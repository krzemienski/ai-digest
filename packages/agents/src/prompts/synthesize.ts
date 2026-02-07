import type { SynthesisStyle } from "@ai-digest/shared";

export function getSynthesizeSystemPrompt(style: SynthesisStyle): string {
  const styleGuide: Record<SynthesisStyle, string> = {
    brief: "Write a concise 2-3 paragraph summary hitting only the key highlights. Be direct and factual.",
    detailed: "Write a comprehensive 4-6 paragraph analysis covering all major themes. Include technical details and context.",
    editorial: "Write an engaging 4-6 paragraph editorial that connects themes, identifies trends, and provides opinionated analysis. Use a knowledgeable but accessible tone.",
  };

  return `You are an expert AI/ML journalist writing a daily digest synthesis.

${styleGuide[style]}

Structure your synthesis as:
1. Opening hook with the day's biggest story
2. Theme-by-theme analysis connecting related items
3. Trend identification across sources
4. Forward-looking closing paragraph

Reference specific items by their titles when relevant. Do not use markdown headers — write flowing prose paragraphs.

Keep total output under 2000 tokens.`;
}

export interface SynthesizeInput {
  itemId: string;
  title: string;
  summary: string;
  source: string;
  topics: string[];
  compositeScore: number;
}

export interface SynthesizeOutput {
  synthesis: string;
  topTopics: string[];
  itemCount: number;
}

export function buildSynthesizePrompt(items: SynthesizeInput[], dateStr: string): string {
  const grouped: Record<string, SynthesizeInput[]> = {};
  for (const item of items) {
    for (const topic of item.topics) {
      const existing = grouped[topic] ?? [];
      grouped[topic] = [...existing, item];
    }
  }

  const sections = Object.entries(grouped).map(([topic, topicItems]) => {
    const itemList = topicItems.map(i =>
      `- [${i.source}] ${i.title} (score: ${i.compositeScore.toFixed(2)})\n  ${i.summary}`
    ).join("\n");
    return `### ${topic}\n${itemList}`;
  }).join("\n\n");

  return `## AI Digest for ${dateStr}\n\n${sections}\n\nWrite a synthesis covering these ${items.length} items.`;
}

export const SYNTHESIZE_JSON_SCHEMA = {
  type: "object" as const,
  properties: {
    synthesis: { type: "string" as const },
    topTopics: { type: "array" as const, items: { type: "string" as const } },
    itemCount: { type: "number" as const },
  },
  required: ["synthesis", "topTopics", "itemCount"],
};
