import type { VoiceConfig } from "./voice";

/** Podcast generation pipeline stages. */
export type PodcastStage = "content_select" | "script_gen" | "quality_review" | "tts" | "assembly" | "upload";

/** Log message severity levels. */
export type LogSeverity = "info" | "warn" | "error";

/** Podcast dialogue style presets. */
export type PodcastStyle = "professional" | "casual" | "technical" | "news_brief" | "custom";

/** Configuration for podcast episode generation. */
export interface PodcastGenerationConfig {
  readonly digestId: string | null;
  readonly dateRange: { readonly start: string; readonly end: string } | null;
  readonly targetDurationMinutes: 5 | 10 | 15 | 20 | 25 | 30 | 45 | 60;
  readonly model: string;
  readonly voiceConfig: VoiceConfig;
  readonly style: PodcastStyle;
  readonly customStylePrompt: string | null;
}

export interface LogEntry {
  readonly id: string;
  readonly episodeId: string;
  readonly stage: PodcastStage;
  readonly severity: LogSeverity;
  readonly message: string;
  readonly metadata: Record<string, unknown> | null;
  readonly createdAt: string;
}

export interface ModelInfo {
  readonly id: string;
  readonly name: string;
  readonly tier: "fast" | "balanced" | "premium";
  readonly inputCostPer1M: number;
  readonly outputCostPer1M: number;
  readonly maxOutputTokens: number;
}

export interface QualityScoreAttempt {
  readonly attempt: number;
  readonly scores: Record<string, number>;
  readonly overall: number;
  readonly passed: boolean;
}

export interface CostEstimate {
  readonly anthropic: {
    readonly inputTokens: number;
    readonly outputTokens: number;
    readonly cost: number;
  };
  readonly elevenlabs: {
    readonly characters: number;
    readonly cost: number;
  };
  readonly total: number;
}
