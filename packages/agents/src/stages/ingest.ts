import type { Database } from "@ai-digest/db";
import { sources, eq } from "@ai-digest/db";
import type { RawFetchResult } from "../fetchers/types";
import { fetchRss } from "../fetchers/rss";
import { fetchGithub } from "../fetchers/github";
import { fetchArxiv } from "../fetchers/arxiv";
import { fetchHackerNews } from "../fetchers/hackernews";
import { fetchHuggingFace } from "../fetchers/huggingface";
import { fetchReddit } from "../fetchers/reddit";
import { fetchProductHunt } from "../fetchers/producthunt";
import type { SourceConfig } from "@ai-digest/shared";

// ArXiv needs rate limiting — run it sequentially
const RATE_LIMITED_SOURCES = new Set(["arxiv"]);

export async function runIngestion(db: Database): Promise<RawFetchResult[]> {
  const enabledSources = await db.query.sources.findMany({
    where: eq(sources.enabled, true),
  });

  const parallelSources = enabledSources.filter(
    (s) => !RATE_LIMITED_SOURCES.has(s.type),
  );
  const sequentialSources = enabledSources.filter((s) =>
    RATE_LIMITED_SOURCES.has(s.type),
  );

  // Run parallel fetchers
  const parallelResults = await Promise.allSettled(
    parallelSources.map((source) => dispatchFetcher(source.type, source.config)),
  );

  const results: RawFetchResult[] = [];
  for (const result of parallelResults) {
    if (result.status === "fulfilled") {
      results.push(...result.value);
    } else {
      console.error("[Ingest] Parallel fetcher failed:", result.reason);
    }
  }

  // Run sequential (rate-limited) fetchers
  for (const source of sequentialSources) {
    try {
      const items = await dispatchFetcher(source.type, source.config);
      results.push(...items);
    } catch (error) {
      console.error(
        `[Ingest] Sequential fetcher ${source.type} failed:`,
        error,
      );
    }
  }

  console.log(
    `[Ingest] Fetched ${results.length} items from ${enabledSources.length} sources`,
  );
  return results;
}

function dispatchFetcher(
  type: string,
  config: SourceConfig,
): Promise<RawFetchResult[]> {
  switch (type) {
    case "rss":
      return fetchRss(config.rss!);
    case "github":
      return fetchGithub(config.github!);
    case "arxiv":
      return fetchArxiv(config.arxiv!);
    case "hackernews":
      return fetchHackerNews(config.hackernews!);
    case "huggingface":
      return fetchHuggingFace(config.huggingface!);
    case "reddit":
      return fetchReddit(config.reddit!);
    case "producthunt":
      return fetchProductHunt(config.producthunt!);
    default:
      console.warn(`[Ingest] Unknown source type: ${type}`);
      return Promise.resolve([]);
  }
}
