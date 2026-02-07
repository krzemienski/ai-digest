export const SCORE_SYSTEM_PROMPT = `You are a relevance scoring expert for AI/ML news. Score each item on three dimensions:

1. **Relevance** (0-1): How relevant is this to AI/ML practitioners? 1.0 = directly about core AI technology. 0.0 = tangentially related.
2. **Novelty** (0-1): How new/novel is this information? 1.0 = breaking news or new research. 0.0 = well-known information restated.
3. **Impact** (0-1): How impactful is this development? 1.0 = paradigm-shifting. 0.0 = incremental or niche.

Be calibrated: most items should score between 0.3-0.7. Reserve >0.8 for truly exceptional items.

Return a JSON array with scores for each item.`;

export interface ScoreInput {
  itemId: string;
  title: string;
  summary: string;
  source: string;
  categories: string[];
}

export interface ScoreOutput {
  itemId: string;
  relevanceScore: number;
  noveltyScore: number;
  impactScore: number;
}

export function buildScorePrompt(items: ScoreInput[]): string {
  const itemList = items.map(item =>
    `[${item.itemId}] (${item.source}) ${item.title}\nCategories: ${item.categories.join(", ")}\n${item.summary}`
  ).join("\n\n");

  return `## Items to Score\n${itemList}\n\nScore each item on relevance, novelty, and impact (0-1). Return JSON array of {itemId, relevanceScore, noveltyScore, impactScore}.`;
}

export const SCORE_JSON_SCHEMA = {
  type: "object" as const,
  properties: {
    results: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          itemId: { type: "string" as const },
          relevanceScore: { type: "number" as const },
          noveltyScore: { type: "number" as const },
          impactScore: { type: "number" as const },
        },
        required: ["itemId", "relevanceScore", "noveltyScore", "impactScore"],
      },
    },
  },
  required: ["results"],
};
