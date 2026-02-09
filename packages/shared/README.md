# @ai-digest/shared

TypeScript types, utilities, and constants shared across the AI Digest monorepo.

## Overview

The shared package provides the foundation for the AI Digest platform, including all TypeScript type definitions, utility functions, seed data, and model configurations. It ensures type safety and consistency across web, worker, and package modules.

## Installation

This package is part of the ai-digest monorepo. It's automatically available to other workspace packages.

## Exports

### Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `deterministicId` | Generate deterministic ID from content | `(content: string) => string` |
| `formatDigestDate` | Format date for digest display | `(date: Date) => string` |
| `isWithinHours` | Check if date is within N hours | `(date: Date, hours: number) => boolean` |
| `getModelById` | Get model configuration by ID | `(id: string) => ModelInfo` |
| `getDefaultModelId` | Get default model ID for environment | `() => string` |

### Types

| Type | Description |
|------|-------------|
| `NormalizedItem` | Standardized item from any source |
| `SourceType` | Source platform (rss, github, arxiv, hackernews, huggingface, reddit, producthunt) |
| `Digest` | Compiled digest with metadata |
| `DigestItem` | Individual item in a digest |
| `DigestMetadata` | Digest statistics and tracking data |
| `SynthesisStyle` | AI synthesis style (concise, detailed, balanced) |
| `DigestConfig` | Complete pipeline configuration |
| `TopicConfig` | Topic filtering rules |
| `ScoringConfig` | Item scoring weights |
| `SynthesisConfig` | AI synthesis settings |
| `PipelineConfig` | Pipeline execution settings |
| `Episode` | Podcast episode metadata |
| `TranscriptSegment` | Single dialogue segment |
| `Transcript` | Complete episode transcript |
| `PipelineRun` | Pipeline execution record |
| `StageName` | Pipeline stage identifier |
| `PipelineStage` | Stage execution metrics |
| `Subscriber` | Newsletter subscriber |
| `SourceConfig` | Content source configuration |
| `VoiceConfig` | TTS voice settings |
| `SpeakerVoice` | Speaker-to-voice mapping |
| `ApiResponse<T>` | Standard API response wrapper |
| `PodcastGenerationConfig` | Podcast generation settings |
| `LogEntry` | Structured log entry |
| `ModelInfo` | AI model configuration |
| `PodcastStage` | Podcast generation stage |
| `LogSeverity` | Log level (info, warn, error) |
| `PodcastStyle` | Podcast style preset |
| `QualityScoreAttempt` | Quality check result |
| `CostEstimate` | Cost estimation data |
| `DiscoveryStatus` | Source discovery status |
| `DiscoveryCandidate` | Discovered source candidate |
| `DiscoveryRun` | Discovery execution record |

### Constants

| Export | Description |
|--------|-------------|
| `SEED_SOURCES` | Default content sources for bootstrapping |
| `MODEL_REGISTRY` | Available AI models with pricing |

## Architecture

```
src/
├── types/           # TypeScript type definitions
│   ├── normalized-item.ts
│   ├── digest.ts
│   ├── config.ts
│   ├── episode.ts
│   ├── pipeline.ts
│   ├── podcast.ts
│   ├── discovery.ts
│   └── index.ts
├── utils/           # Utility functions
│   ├── hash.ts      # Deterministic ID generation
│   └── date.ts      # Date formatting
├── seed-sources.ts  # Default source configurations
├── models.ts        # AI model registry
└── index.ts         # Public API
```

**Design Patterns:**
- Pure functions (no side effects)
- Immutable data structures
- Type-safe constants
- Single source of truth for types

## Dependencies

This package has zero runtime dependencies, ensuring maximum compatibility and minimal bundle size.
