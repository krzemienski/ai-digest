import type { TopicConfig } from "@ai-digest/shared";

export const CATEGORIZE_SYSTEM_PROMPT = `You are a content classification expert. Given a batch of AI/ML news items, classify each into one or more topic categories.

For each item, analyze the title, summary, and content to determine which topics it belongs to.

Return a JSON array where each element has:
- itemId: the item's unique ID
- topics: array of topic names that match this item

Only assign topics from the provided list. An item can belong to multiple topics.
If an item doesn't match any topic, assign it to "General AI".`;

export interface CategorizeInput {
  itemId: string;
  title: string;
  summary: string;
  content?: string;
}

export interface CategorizeOutput {
  itemId: string;
  topics: string[];
}

export function buildCategorizePrompt(items: CategorizeInput[], topics: TopicConfig[]): string {
  const topicList = topics.map(t => `- ${t.name}: keywords [${t.keywords.join(", ")}]`).join("\n");
  const itemList = items.map(item =>
    `[${item.itemId}] ${item.title}\n${item.summary}${item.content ? `\n${item.content.slice(0, 500)}` : ""}`
  ).join("\n\n");

  return `## Available Topics\n${topicList}\n\n## Items to Classify\n${itemList}\n\nClassify each item. Return JSON array of {itemId, topics[]}.`;
}

export const CATEGORIZE_JSON_SCHEMA = {
  type: "object" as const,
  properties: {
    results: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          itemId: { type: "string" as const },
          topics: { type: "array" as const, items: { type: "string" as const } },
        },
        required: ["itemId", "topics"],
      },
    },
  },
  required: ["results"],
};
