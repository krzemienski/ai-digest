import type { SynthesisStyle } from "./digest";

/** Complete configuration for the AI digest pipeline. */
export interface DigestConfig {
  /** Topic definitions for categorization */
  topics: TopicConfig[];
  /** Scoring weights and thresholds */
  scoring: ScoringConfig;
  /** Synthesis settings */
  synthesis: SynthesisConfig;
  /** Pipeline execution settings */
  pipeline: PipelineConfig;
}

/** Topic category definition for story classification. */
export interface TopicConfig {
  /** Display name of the topic */
  name: string;
  /** Keywords for matching (used in LLM categorization prompt) */
  keywords: string[];
  /** Relative importance weight */
  weight: number;
}

/** Configuration for scoring dimensions and composite calculation. */
export interface ScoringConfig {
  /** Weight for novelty score (0-1) */
  noveltyWeight: number;
  /** Weight for impact score (0-1) */
  impactWeight: number;
  /** Weight for relevance score (0-1) */
  relevanceWeight: number;
  /** Minimum composite score to include in digest */
  minScore: number;
}

/** Configuration for digest synthesis. */
export interface SynthesisConfig {
  /** Maximum number of items to include */
  maxItems: number;
  /** Narrative style for summary generation */
  style: SynthesisStyle;
}

/** Pipeline execution and output configuration. */
export interface PipelineConfig {
  /** Maximum spend in USD per pipeline run */
  maxBudgetUsd: number;
  /** Cron schedule expression for automatic runs */
  schedule: string;
  /** Whether to generate podcast episodes */
  enablePodcast: boolean;
  /** Whether to send email newsletters */
  enableNewsletter: boolean;
}
