export interface SourceConfig {
  rss?: { url: string; ttlMinutes?: number };
  github?: { query: string; minStars?: number; createdAfterDays?: number };
  arxiv?: { categories: string[]; maxResults?: number };
  hackernews?: { keywords: string[]; minPoints?: number };
  huggingface?: { tasks?: string[]; minDownloads?: number };
  reddit?: { subreddits: string[] };
  producthunt?: { topic?: string };
}
