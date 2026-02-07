export const DEDUP_SYSTEM_PROMPT = `You are a deduplication expert. Given a cluster of AI/ML news items that may cover the same story, identify which items are duplicates.

Two items are duplicates if they cover the SAME specific event, announcement, or finding, even if from different sources or worded differently.

Items covering the same general topic but about different specific events are NOT duplicates.

For each duplicate found, indicate which item it duplicates (prefer keeping the higher-quality, more detailed version).

Return a JSON array of duplicate pairs.`;

export interface DedupInput {
  itemId: string;
  title: string;
  summary: string;
  source: string;
  compositeScore: number;
}

export interface DedupOutput {
  duplicateId: string;
  originalId: string;
  confidence: number;
}

export function buildDedupPrompt(items: DedupInput[]): string {
  const itemList = items.map(item =>
    `[${item.itemId}] (${item.source}, score: ${item.compositeScore.toFixed(2)}) ${item.title}\n${item.summary}`
  ).join("\n\n");

  return `## Items to Check for Duplicates\n${itemList}\n\nIdentify duplicate pairs. For each duplicate, the originalId should be the higher-scored version. Return JSON array of {duplicateId, originalId, confidence}.`;
}

export const DEDUP_JSON_SCHEMA = {
  type: "object" as const,
  properties: {
    results: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          duplicateId: { type: "string" as const },
          originalId: { type: "string" as const },
          confidence: { type: "number" as const },
        },
        required: ["duplicateId", "originalId", "confidence"],
      },
    },
  },
  required: ["results"],
};
