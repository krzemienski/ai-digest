export interface NormalizedItem {
  id: string;
  source: SourceType;
  sourceId: string;
  sourceUrl: string;
  title: string;
  summary: string;
  content?: string;
  authors: string[];
  publishedAt: Date;
  fetchedAt: Date;
  categories: string[];
  metadata: Record<string, unknown>;
  relevanceScore?: number;
  noveltyScore?: number;
  impactScore?: number;
  compositeScore?: number;
  duplicateOf?: string | null;
}

export type SourceType = "rss" | "github" | "arxiv" | "hackernews" | "huggingface" | "reddit" | "producthunt";
