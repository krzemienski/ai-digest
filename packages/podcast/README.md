# @ai-digest/podcast

AI-powered podcast generation with tool loop script generation, TTS synthesis, audio assembly, and cloud storage.

## Overview

The podcast package implements the complete podcast production pipeline for AI Digest. It uses an iterative tool loop with Claude AI to generate accurate-duration scripts (96-103% accuracy), synthesizes dialogue with ElevenLabs TTS, assembles multi-track audio with ffmpeg, and uploads to Cloudflare R2/AWS S3.

## Installation

This package is part of the ai-digest monorepo. It's automatically available to other workspace packages.

## Exports

### Script Generation

| Function | Description | Parameters |
|----------|-------------|------------|
| `generateScriptWithTools` | Generate script with tool loop (96-103% duration accuracy) | `(options: ScriptGeneratorOptions) => Promise<ScriptGeneratorResult>` |
| `parseScript` | Parse script text into segments | `(text: string) => ScriptSegment[]` |
| `estimateTotalDuration` | Estimate total duration from segments | `(segments: ScriptSegment[]) => number` |
| `validateSegments` | Validate segment structure | `(segments: ScriptSegment[]) => boolean` |

### Audio Generation

| Function | Description | Parameters |
|----------|-------------|------------|
| `generateSegmentAudio` | Generate TTS audio for one segment | `(segment: ScriptSegment, voice: string) => Promise<TTSResult>` |
| `generateAllSegments` | Generate TTS for all segments | `(segments: ScriptSegment[], voiceMap) => Promise<TTSResult[]>` |

### Audio Assembly

| Function | Description | Parameters |
|----------|-------------|------------|
| `assembleEpisode` | Assemble multi-track episode with music | `(segments, outputPath, musicPath?) => Promise<AssembleResult>` |
| `assembleEpisodeLite` | Assemble episode (no music, faster) | `(segments, outputPath) => Promise<AssembleResult>` |

### Cloud Upload

| Function | Description | Parameters |
|----------|-------------|------------|
| `uploadToS3` | Upload to AWS S3 | `(filePath, bucket, key) => Promise<string>` |
| `uploadToR2` | Upload to Cloudflare R2 | `(filePath, bucket, key) => Promise<string>` |
| `buildEpisodeKey` | Generate S3/R2 key for episode | `(episodeId: string) => string` |

### Types

| Type | Description |
|------|-------------|
| `ScriptGeneratorOptions` | Script generation configuration |
| `ScriptGeneratorResult` | Script generation result with cost tracking |
| `ScriptSegment` | Parsed dialogue segment |
| `TTSResult` | TTS generation result |
| `AssembleResult` | Audio assembly result |

## Architecture

```
src/
├── script-generator.ts  # Tool loop script generation
├── script-parser.ts     # Script parsing and validation
├── tts.ts               # ElevenLabs TTS synthesis
├── assembler.ts         # ffmpeg multi-track assembly
├── assembler-lite.ts    # Simple concatenation (no music)
├── r2-upload.ts         # S3/R2 upload utilities
└── index.ts             # Public API
```

**Design Patterns:**
- Tool loop pattern (iterative refinement)
- Streaming assembly (low memory usage)
- Retry with exponential backoff (TTS)
- Progress callbacks for UI updates

## Tool Loop Script Generation

The script generator uses 4 tools for iterative generation:

| Tool | Description |
|------|-------------|
| `get_stories` | Retrieve available stories for the episode |
| `save_section` | Save a section of dialogue (returns cumulative duration) |
| `get_progress` | Check cumulative duration and remaining seconds |
| `finalize_script` | Complete the episode and receive final segments |

**Key Features:**
- 96-103% duration accuracy (target 5min → 309s, 15min → 865s, 30min → 1740s)
- Real-time duration feedback after each section
- Max 30 turns (configurable)
- Cost tracking (input/output/cache tokens)
- Progress callbacks for UI updates

**Example:**
```typescript
const result = await generateScriptWithTools({
  stories: topicItems,
  targetDurationMinutes: 15,
  model: 'claude-3-5-sonnet-20241022',
  style: 'conversational',
  digestDate: '2026-02-09',
  onProgress: (stage, message, meta) => {
    console.log(`[${stage}] ${message}`, meta);
  },
});

console.log(`Generated ${result.segments.length} segments`);
console.log(`Duration: ${result.totalDuration}s (${result.totalCharacters} chars)`);
console.log(`Cost: $${result.cost.estimatedCostUsd.toFixed(4)}`);
```

## TTS Synthesis

Uses ElevenLabs API with:
- Voice cloning support
- Streaming generation
- Automatic retries
- Rate ~15 chars/second

**Voices:**
- Host A: Configurable (default: ElevenLabs voice ID)
- Host B: Configurable (default: ElevenLabs voice ID)

## Audio Assembly

Uses `fluent-ffmpeg` to:
1. Concatenate all dialogue segments
2. Mix background music (optional)
3. Apply audio normalization
4. Generate final MP3

**Two modes:**
- `assembleEpisode`: Multi-track with music, slower
- `assembleEpisodeLite`: Simple concatenation, faster

## Cloud Upload

Supports both AWS S3 and Cloudflare R2:
- Automatic content type detection
- Public-read ACL
- Presigned URLs
- Episode key format: `episodes/{episodeId}.mp3`

## Dependencies

| Package | Purpose |
|---------|---------|
| `fluent-ffmpeg` | Audio processing |
| `@ffmpeg-installer/ffmpeg` | ffmpeg binary |
| `@aws-sdk/client-s3` | S3/R2 client |
| `@anthropic-ai/sdk` | Claude AI API |
| `@ai-digest/shared` | Shared types |
| `@ai-digest/agents` | Prompt builders |

## Configuration

Environment variables:
- `ANTHROPIC_API_KEY` - Claude API key (required)
- `ELEVENLABS_API_KEY` - ElevenLabs API key (required)
- `R2_ACCOUNT_ID` - Cloudflare R2 account ID (optional)
- `R2_ACCESS_KEY_ID` - R2 access key (optional)
- `R2_SECRET_ACCESS_KEY` - R2 secret key (optional)
- `AWS_ACCESS_KEY_ID` - AWS access key (optional)
- `AWS_SECRET_ACCESS_KEY` - AWS secret key (optional)

## Performance

**Script Generation:**
- 5min target: 8-12 turns, ~$0.02-0.05
- 15min target: 12-18 turns, ~$0.05-0.12
- 30min target: 18-25 turns, ~$0.12-0.25

**TTS Synthesis:**
- ~15 chars/second rate
- 5min episode: ~4500 chars, ~30s generation
- 15min episode: ~13500 chars, ~90s generation

**Audio Assembly:**
- Simple (lite): ~5-10s for 15min episode
- With music: ~30-60s for 15min episode

## Tool Loop vs. Single-Call

| Metric | Single-Call (Classic) | Tool Loop (Current) |
|--------|----------------------|---------------------|
| Duration Accuracy | 68-71% | 96-103% |
| Turns | 1 | 8-25 |
| Cost | $0.01-0.02 | $0.02-0.25 |
| Serverless Compatible | ✅ | ✅ |
| Quality | Basic | High |

The tool loop approach uses Anthropic API directly (not Agent SDK) for serverless compatibility.
