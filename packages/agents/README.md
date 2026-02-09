# @ai-digest/agents

AI-powered content pipeline orchestrating 7 source fetchers and 7 processing stages.

## Overview

The agents package implements the complete content ingestion and processing pipeline for AI Digest. It coordinates fetching from multiple sources (RSS, GitHub, ArXiv, Hacker News, HuggingFace, Reddit, Product Hunt), normalizes items, categorizes with AI, scores by relevance, deduplicates, synthesizes summaries, and outputs digests with optional podcast generation.

## Installation

This package is part of the ai-digest monorepo. It's automatically available to other workspace packages.

## Exports

### Pipeline Orchestration

| Function | Description | Parameters |
|----------|-------------|------------|
| `runPipeline` | Execute complete AI pipeline | `(db, config, triggerType, callbackFactory?) => Promise<PipelineResult>` |

### Pipeline Stages

| Function | Description | Parameters |
|----------|-------------|------------|
| `runIngestion` | Fetch from all configured sources | `(db, config, budget, callbacks?) => Promise<number>` |
| `runNormalization` | Normalize items to common schema | `(db, config, budget, callbacks?) => Promise<number>` |
| `runCategorize` | AI categorization into topics | `(db, config, budget, callbacks?) => Promise<number>` |
| `runScore` | Score items by relevance | `(db, config, budget, callbacks?) => Promise<number>` |
| `runDedup` | Remove duplicate content | `(db, config, budget, callbacks?) => Promise<number>` |
| `runSynthesize` | AI-generated summaries | `(db, config, budget, callbacks?) => Promise<Digest>` |
| `runOutput` | Generate newsletter/podcast | `(db, config, digest, budget, callbacks?) => Promise<string | null>` |

### Source Discovery

| Function | Description | Parameters |
|----------|-------------|------------|
| `runDiscoveryAgent` | AI agent to find new sources | `(config) => Promise<DiscoveryResult>` |
| `probeRssFeeds` | Validate RSS feed candidates | `(urls) => Promise<RssProbeResult[]>` |
| `validateSourceUrl` | Check if URL is valid source | `(url, type) => Promise<boolean>` |

### Budget Management

| Function | Description | Parameters |
|----------|-------------|------------|
| `BudgetTracker` | Track API costs during pipeline | Class constructor `(maxBudgetUsd)` |
| `estimateGenerationCost` | Estimate generation cost | `(config) => Promise<CostEstimate>` |

### Prompt Builders

| Function | Description | Parameters |
|----------|-------------|------------|
| `buildPodcastScriptPrompt` | Build podcast script prompt | `(topics, duration, digestDate, style?) => string` |
| `buildAgentSystemPrompt` | Build agent system prompt | `(targetMinutes, style, customPrompt?) => string` |
| `buildToolLoopSystemPrompt` | Build tool loop system prompt | `(targetMinutes, style, customPrompt?) => string` |
| `buildStyledSystemPrompt` | Apply style preset | `(basePrompt, style) => string` |

### Configuration

| Export | Description |
|--------|-------------|
| `defaultConfig` | Default pipeline configuration |
| `MODEL_REGISTRY` | Available AI models |
| `STYLE_PRESETS` | Podcast style presets |
| `CHARS_PER_SECOND` | TTS rate constant (15.0) |

### Types

| Type | Description |
|------|-------------|
| `PipelineResult` | Pipeline execution result |
| `StageCallback` | Stage event callbacks |
| `StageTrackingData` | Stage metrics |
| `StageCallbackFactory` | Callback factory |
| `PodcastScriptInput` | Podcast script input |
| `PodcastTopicItem` | Topic for podcast |
| `PodcastScriptSegment` | Dialogue segment |
| `PodcastScriptOutput` | Generated script |
| `QualityReviewOutput` | Quality check result |
| `DiscoveryAgentConfig` | Discovery config |
| `DiscoveryResult` | Discovery result |

### Schemas

| Schema | Description |
|--------|-------------|
| `PodcastScriptSchema` | Zod schema for podcast scripts |
| `QualityReviewSchema` | Zod schema for quality reviews |
| `PODCAST_SCRIPT_JSON_SCHEMA` | JSON schema for Anthropic API |

## Architecture

```
src/
├── fetchers/            # Source-specific fetchers
│   ├── rss.ts           # Generic RSS feeds
│   ├── github.ts        # GitHub trending
│   ├── arxiv.ts         # Research papers
│   ├── hackernews.ts    # Hacker News
│   ├── huggingface.ts   # ML models/datasets
│   ├── reddit.ts        # Reddit posts
│   ├── producthunt.ts   # Product Hunt
│   └── types.ts         # Fetcher interfaces
├── stages/              # Pipeline stages
│   ├── ingest.ts        # Fetch from sources
│   ├── normalize.ts     # Normalize to common schema
│   ├── categorize.ts    # AI categorization
│   ├── score.ts         # Relevance scoring
│   ├── dedup.ts         # Deduplication
│   ├── synthesize.ts    # AI summaries
│   └── output.ts        # Newsletter/podcast generation
├── discovery/           # Source discovery agent
│   ├── agent.ts         # AI discovery agent
│   ├── validators.ts    # Source validation
│   └── index.ts
├── prompts/             # AI prompt templates
│   ├── podcast-script.ts
│   └── podcast-agent.ts
├── schemas/             # Zod schemas
│   ├── podcast-script.schema.ts
│   ├── quality-review.schema.ts
│   ├── categorize.schema.ts
│   └── synthesize.schema.ts
├── coordinator.ts       # Pipeline orchestrator
├── budget.ts            # Cost tracking
├── config.ts            # Default configuration
├── models.ts            # AI model registry
└── index.ts             # Public API
```

**Design Patterns:**
- Pipeline pattern (7 sequential stages)
- Strategy pattern (pluggable fetchers)
- Observer pattern (stage callbacks)
- Budget guard pattern (cost limits)
- Tool loop pattern (iterative podcast generation)

## Dependencies

| Package | Purpose |
|---------|---------|
| `@ai-digest/db` | Database access |
| `@ai-digest/shared` | Shared types |
| `@anthropic-ai/sdk` | Claude AI API |
| `drizzle-orm` | Database queries |
| `fast-xml-parser` | XML parsing |
| `rss-parser` | RSS feed parsing |
| `zod` | Schema validation |

## Pipeline Flow

```
1. INGESTION    → Fetch from 7 sources → Raw items in DB
2. NORMALIZE    → Transform to common schema → Normalized items
3. CATEGORIZE   → AI categorization → Topics assigned
4. SCORE        → Relevance scoring → Scores computed
5. DEDUP        → Remove duplicates → Unique items
6. SYNTHESIZE   → AI summaries → Digest created
7. OUTPUT       → Generate newsletter/podcast → Episode created
```

## Budget Tracking

The `BudgetTracker` enforces cost limits across all AI operations:
- Tracks input/output tokens
- Calculates costs using model pricing
- Throws error when budget exceeded
- Supports cache read/creation tokens

## Source Fetchers

All fetchers implement the `Fetcher` interface:
```typescript
interface Fetcher {
  fetch(config: SourceConfig): Promise<RawItem[]>
}
```

Each fetcher handles source-specific APIs and transforms to a common `RawItem` schema.
