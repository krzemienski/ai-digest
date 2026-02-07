import type { SourceType } from "@ai-digest/shared";

export interface RawFetchResult {
  source: SourceType;
  sourceId: string;
  sourceUrl: string;
  title: string;
  summary: string;
  content?: string;
  authors: string[];
  publishedAt: Date;
  metadata: Record<string, unknown>;
}
