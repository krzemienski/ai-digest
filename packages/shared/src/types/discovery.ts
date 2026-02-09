export type DiscoveryStatus = "pending" | "running" | "completed" | "failed";

export interface DiscoveryCandidate {
  readonly name: string;
  readonly type: string; // rss | reddit | github | arxiv | hackernews | huggingface | producthunt
  readonly url: string;
  readonly description: string;
  readonly relevanceScore: number; // 0-100
  readonly config: Record<string, unknown>;
  readonly validated: boolean;
}

export interface DiscoveryRun {
  readonly id: string;
  readonly status: DiscoveryStatus;
  readonly topics: string[] | null;
  readonly sourceTypes: string[] | null;
  readonly maxSources: number;
  readonly candidates: DiscoveryCandidate[];
  readonly addedSourceIds: string[];
  readonly error: string | null;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly createdAt: string;
}
