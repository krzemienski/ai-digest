import type { SourceConfig } from "@ai-digest/shared";
import type { RawFetchResult } from "./types";

interface HNHit {
  objectID: string;
  title: string;
  url: string | null;
  author: string;
  points: number;
  num_comments: number;
  created_at: string;
  story_text: string | null;
}

interface HNSearchResponse {
  hits: HNHit[];
  nbHits: number;
}

export async function fetchHackerNews(
  config: NonNullable<SourceConfig["hackernews"]>,
): Promise<RawFetchResult[]> {
  const minPoints = config.minPoints ?? 50;
  const query = config.keywords.join(" ");
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=points>${minPoints}&hitsPerPage=30`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        `[HN] API error: ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const data = (await response.json()) as HNSearchResponse;

    return data.hits.map((hit) => ({
      source: "hackernews" as const,
      sourceId: hit.objectID,
      sourceUrl:
        hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
      title: hit.title,
      summary: hit.story_text ?? "",
      authors: [hit.author],
      publishedAt: new Date(hit.created_at),
      metadata: {
        points: hit.points,
        numComments: hit.num_comments,
        hnUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
      },
    }));
  } catch (error) {
    console.error("[HN] Failed to fetch:", error);
    return [];
  }
}
