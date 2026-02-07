import type { NormalizedItem, SourceType } from "./normalized-item";

export interface Digest {
  id: string;
  digestDate: string;
  synthesis: string;
  synthesisStyle: SynthesisStyle;
  itemCount: number;
  items: DigestItem[];
  metadata: DigestMetadata;
}

export interface DigestItem {
  id: string;
  normalizedItemId: string;
  rank: number;
  section: string;
  item: NormalizedItem;
}

export interface DigestMetadata {
  topTopics: string[];
  sourceBreakdown: Record<string, number>;
  dateRange: { start: string; end: string };
}

export type SynthesisStyle = "brief" | "detailed" | "editorial";
