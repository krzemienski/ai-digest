import Parser from "rss-parser";
import type { SourceConfig } from "@ai-digest/shared";
import type { RawFetchResult } from "./types";

const parser = new Parser({ timeout: 5000 });

export async function fetchReddit(
  config: NonNullable<SourceConfig["reddit"]>,
): Promise<RawFetchResult[]> {
  const results: RawFetchResult[] = [];

  for (const subreddit of config.subreddits) {
    const url = `https://www.reddit.com/r/${subreddit}/hot.rss`;
    try {
      const feed = await parser.parseURL(url);
      for (const item of feed.items ?? []) {
        results.push({
          source: "reddit" as const,
          sourceId: item.guid ?? item.link ?? "",
          sourceUrl: item.link ?? "",
          title: item.title ?? "",
          summary: item.contentSnippet ?? item.content ?? "",
          content: item.content,
          authors: item.creator ? [item.creator] : [],
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          metadata: {
            subreddit,
            feedTitle: feed.title,
          },
        });
      }
    } catch (error) {
      console.error(`[Reddit] Failed to fetch r/${subreddit}:`, error);
    }
  }

  return results;
}
