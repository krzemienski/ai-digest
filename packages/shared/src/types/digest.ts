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
  sourceBreakdown: Record<SourceType, number>;
  dateRange: { from: string; to: string };
}

export type SynthesisStyle = "brief" | "detailed" | "editorial";
