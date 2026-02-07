import type { SynthesisStyle } from "./digest";

export interface DigestConfig {
  topics: TopicConfig[];
  scoring: ScoringConfig;
  synthesis: SynthesisConfig;
  pipeline: PipelineConfig;
}

export interface TopicConfig {
  name: string;
  keywords: string[];
  weight: number;
}

export interface ScoringConfig {
  noveltyWeight: number;
  impactWeight: number;
  relevanceWeight: number;
  minScore: number;
}

export interface SynthesisConfig {
  maxItems: number;
  style: SynthesisStyle;
}

export interface PipelineConfig {
  maxBudgetUsd: number;
  schedule: string;
  enablePodcast: boolean;
  enableNewsletter: boolean;
}
