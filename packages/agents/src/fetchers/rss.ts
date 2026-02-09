import Parser from "rss-parser";
import type { SourceConfig } from "@ai-digest/shared";
import type { RawFetchResult } from "./types";

const parser = new Parser({
  timeout: 5000,
});

export async function fetchRss(
  config: NonNullable<SourceConfig["rss"]>,
): Promise<RawFetchResult[]> {
  try {
    const feed = await parser.parseURL(config.url);
    return (feed.items ?? []).map((item) => ({
      source: "rss" as const,
      sourceId: item.guid ?? item.link ?? item.title ?? "",
      sourceUrl: item.link ?? "",
      title: item.title ?? "",
      summary: item.contentSnippet ?? item.content ?? "",
      content: item.content,
      authors: item.creator ? [typeof item.creator === "string" ? item.creator : String(item.creator)] : [],
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      metadata: {
        feedTitle: feed.title,
        feedUrl: config.url,
        categories: item.categories ?? [],
      },
    }));
  } catch (error) {
    console.error(`[RSS] Failed to fetch ${config.url}:`, error);
    return [];
  }
}
