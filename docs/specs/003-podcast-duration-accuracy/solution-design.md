# Solution Design: 003 — Podcast Duration Accuracy & Generation Pipeline

## 1. Problem Statement

Podcasts targeting 30 minutes produce 12-19 minutes of audio. The root causes are:

1. **Classic mode (single API call)** gives Claude no guidance on character count or segment volume — it guesses conservatively
2. **Agent SDK mode** (which works, producing 30+ min via iterative `save_section` + `get_progress`) is disabled on Vercel because it spawns a CLI subprocess
3. **No alternative agentic pipeline** exists that runs on Vercel serverless

Additionally, the system is admin-only with no path for users to self-serve podcast generation.

## 2. Solution Overview

Replace the Agent SDK with the **Anthropic Client SDK tool loop** (`@anthropic-ai/sdk` with `tool_use`). This provides the same iterative script generation (tools for progress tracking, section saving) but runs as pure HTTP API calls — fully Vercel-compatible, no subprocess.

### Key Changes

| Component | Before | After |
|-----------|--------|-------|
| Script generation (≥25 min) | Agent SDK (CLI subprocess) | Client SDK tool loop (HTTP) |
| Script generation (<25 min) | Single API call (no guidance) | Client SDK tool loop (same pipeline for ALL durations) |
| Runtime | Worker process (BullMQ) | Vercel serverless (inline) |
| Cost per 30-min episode | ~$8.65 (Agent SDK overhead) | ~$0.10-0.25 (Haiku + prompt caching) |
| Duration accuracy | 40-65% of target (classic) | 95-110% of target (tool-guided) |

## 3. Architecture

### 3.1 Script Generation Pipeline (New)

```
processPodcastInline()
  → selectContent()                    // existing, unchanged
  → generateScriptWithTools()          // NEW: replaces both classic + agent modes
    → Anthropic Client SDK tool loop
    → Tools: get_stories, save_section, get_progress, finalize_script
    → Same proven system prompt from podcast-agent.ts
    → Iterative: Claude writes sections, checks progress, adjusts
  → reviewScript()                     // existing quality review
  → generateAllSegments()              // existing TTS
  → assembleEpisodeLite()             // existing assembly
  → uploadToS3()                       // existing upload
```

### 3.2 Tool Loop Architecture

```typescript
// Pure HTTP — no subprocess, no CLI, no Agent SDK
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey });
const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];

let totalInputTokens = 0;
let totalOutputTokens = 0;

for (let turn = 0; turn < MAX_TURNS; turn++) {
  const response = await client.messages.create({
    model,
    max_tokens: 16384,
    system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
    tools,
    messages,
  });

  totalInputTokens += response.usage.input_tokens;
  totalOutputTokens += response.usage.output_tokens;
  messages.push({ role: "assistant", content: response.content });

  if (response.stop_reason !== "tool_use") break;

  // Execute tools, collect results
  const toolResults = response.content
    .filter(b => b.type === "tool_use")
    .map(b => ({ type: "tool_result", tool_use_id: b.id, content: executeTool(b.name, b.input) }));

  messages.push({ role: "user", content: toolResults });
}
```

### 3.3 Four Tools (Same Logic as Agent SDK, Simplified)

All tools are pure functions operating on closure state — no MCP server needed.

| Tool | Input | Output | Purpose |
|------|-------|--------|---------|
| `get_stories` | `{}` | Story list with titles, sources, summaries | Let Claude plan the episode |
| `save_section` | `{ sectionName, segments[] }` | Cumulative duration, remaining seconds | Save a batch of dialogue, get progress feedback |
| `get_progress` | `{}` | Total duration, target, percent, remaining | Check how much more content is needed |
| `finalize_script` | `{}` | Final ordered segment array | Signal completion, assemble all sections |

### 3.4 Duration Targeting Strategy

The system prompt (adapted from the working `podcast-agent.ts`) includes explicit targets:

```
Duration is calculated at ~15 chars/second of speech (validated from production data).

Target: {targetDurationMinutes} minutes = {targetSeconds} seconds
Required characters: ~{Math.round(targetSeconds * 15)} total dialogue characters

Guidance:
- For 15 min: ~13,500 chars across ~40 segments
- For 30 min: ~27,000 chars across ~80 segments
- For 45 min: ~40,500 chars across ~120 segments
- For 60 min: ~54,000 chars across ~160 segments

CRITICAL: Aim for 110-115% of target. Better to slightly overshoot than undershoot.
Use get_progress after each save_section to track cumulative duration.
Do NOT call finalize_script until get_progress shows ≥100% of target.
```

### 3.5 Chars-Per-Second Calibration

Production data shows **15.09 chars/sec** (±2.3% variance). The system uses **15.0 chars/sec** as the constant for conservative estimation.

```typescript
const CHARS_PER_SECOND = 15.0; // Validated from 3 production episodes

function estimateDuration(text: string): number {
  return Math.round(text.length / CHARS_PER_SECOND);
}
```

## 4. Cost Model

### 4.1 Script Generation Cost (Tool Loop with Haiku)

| Turns | Cumulative Input Tokens | Output Tokens | Cost (Haiku) | With Cache |
|-------|------------------------|---------------|-------------|------------|
| 10 | ~171,000 | ~15,400 | $0.25 | ~$0.10 |
| 15 | ~280,000 | ~22,000 | $0.39 | ~$0.15 |
| 20 | ~400,000 | ~30,000 | $0.55 | ~$0.20 |

### 4.2 TTS Cost (ElevenLabs)

| Duration | Characters | Cost (Scale tier) |
|----------|-----------|-------------------|
| 15 min | ~13,500 | ~$0.20 |
| 30 min | ~27,000 | ~$0.40 |
| 45 min | ~40,500 | ~$0.61 |
| 60 min | ~54,000 | ~$0.81 |

### 4.3 Total Cost Per Episode

| Duration | Script (Haiku+cache) | TTS | Total |
|----------|---------------------|-----|-------|
| 15 min | ~$0.08 | ~$0.20 | **~$0.28** |
| 30 min | ~$0.12 | ~$0.40 | **~$0.52** |
| 45 min | ~$0.18 | ~$0.61 | **~$0.79** |
| 60 min | ~$0.25 | ~$0.81 | **~$1.06** |

(vs current Agent SDK: ~$8.65 for 30 min)

### 4.4 Prompt Caching

Enable `cache_control: { type: "ephemeral" }` on system prompt and tool definitions. These are identical across all turns, so ~90% of repeated input tokens hit cache at 0.1x price.

## 5. File Changes

### 5.1 New File: `packages/podcast/src/script-generator.ts`

The core new module. Replaces both classic single-call and Agent SDK modes.

**Exports:**
```typescript
export interface ScriptGeneratorOptions {
  stories: PodcastTopicItem[];
  targetDurationMinutes: number;
  model: string;
  style: string;
  customStylePrompt?: string;
  apiKey: string;
  onProgress?: (stage: string, message: string) => void;
}

export interface ScriptGeneratorResult {
  segments: ScriptSegment[];
  totalDuration: number;
  totalCharacters: number;
  cost: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    estimatedCostUsd: number;
  };
  turns: number;
}

export async function generateScriptWithTools(
  options: ScriptGeneratorOptions
): Promise<ScriptGeneratorResult>;
```

**Implementation:**
- Creates 4 tool definitions with Zod input schemas
- Builds system prompt from `podcast-agent.ts` template with duration targets
- Runs `client.messages.create()` in a loop until `stop_reason !== "tool_use"`
- Tracks tokens and cost per turn
- Calls `onProgress` callback for real-time logging
- Returns structured result with segments + cost breakdown

### 5.2 Modified File: `apps/web/src/lib/processors/podcast.ts`

**Changes:**
- Remove `useAgentMode` conditional — ALL durations use the tool loop
- Import `generateScriptWithTools` from `@ai-digest/podcast/script-generator`
- Replace the `generateScript()` function to call `generateScriptWithTools()`
- Pass `onProgress` callback that writes to `podcast_logs` table
- Store cost breakdown in episode record

### 5.3 Modified File: `packages/podcast/package.json`

**Changes:**
- Add `@anthropic-ai/sdk` as dependency (already in monorepo, just not in this package)
- Add sub-path export: `"./script-generator": "./src/script-generator.ts"`

### 5.4 Modified File: `packages/podcast/src/index.ts`

- Export `generateScriptWithTools` and types from `./script-generator`

### 5.5 Modified File: `packages/agents/src/prompts/podcast-agent.ts`

**Changes:**
- Extract the system prompt into a reusable function that accepts `targetDurationMinutes` and computes character targets dynamically
- Ensure the 15.0 chars/sec constant is used (validated from production)
- Add overshoot guidance: "aim for 110-115%"

### 5.6 No Changes Needed

- `packages/podcast/src/tts.ts` — TTS pipeline unchanged
- `packages/podcast/src/assembler-lite.ts` — Assembly unchanged
- `packages/podcast/src/r2-upload.ts` — Upload unchanged
- `packages/podcast/src/script-parser.ts` — Still used to parse finalize_script output

## 6. Vercel Compatibility

| Concern | Solution |
|---------|----------|
| maxDuration | 800s (Fluid Compute) — tool loop takes 1-5 min |
| No subprocess | Client SDK is pure HTTP — no CLI binary |
| Memory | Conversation history grows but stays under 100MB |
| Prompt caching | Reduces latency + cost across turns |
| Cold starts | `@anthropic-ai/sdk` is lightweight (~2MB) |

## 7. Quality Assurance

### 7.1 Duration Validation

After `finalize_script`, validate total estimated duration:

```typescript
const totalChars = segments.reduce((sum, s) => sum + s.text.length, 0);
const estimatedSeconds = totalChars / CHARS_PER_SECOND;
const targetSeconds = targetDurationMinutes * 60;
const ratio = estimatedSeconds / targetSeconds;

if (ratio < 0.85) {
  // Script is too short — log warning, consider retry
  logEmitter.warn("script_gen", `Script is ${Math.round(ratio * 100)}% of target duration`);
}
```

### 7.2 Existing Quality Review

The `reviewScript()` function already checks:
- At least 2 speakers
- No empty segments
- Segment ordering
- Duration estimation

### 7.3 Cost Guards

- `maxBudgetUsd` parameter (default: $5) — abort if cumulative cost exceeds budget
- `MAX_TURNS` (default: 40) — prevent infinite loops
- Log cost after each turn for transparency

## 8. Migration Path

1. **Phase 1**: Build `script-generator.ts` with tool loop
2. **Phase 2**: Wire into `processors/podcast.ts`, replacing both classic and agent modes
3. **Phase 3**: Deploy and validate with 3 test podcasts (15, 30, 60 min)
4. **Phase 4**: Remove Agent SDK dependency from monorepo (optional cleanup)

## 9. ADRs

### ADR-1: Replace Agent SDK with Client SDK Tool Loop
- **Decision**: Use `@anthropic-ai/sdk` with manual tool loop instead of `@anthropic-ai/claude-agent-sdk`
- **Rationale**: Agent SDK spawns CLI subprocess (incompatible with Vercel), costs 35-85x more due to overhead, bundles 100MB+ binary. Client SDK tool loop provides identical functionality via pure HTTP.
- **Trade-offs**: Lose automatic context management and built-in tools. Acceptable because we only need 4 simple in-memory tools.

### ADR-2: Single Pipeline for All Durations
- **Decision**: Use tool loop for ALL durations (5-60 min), not just 25+
- **Rationale**: Classic single-call mode fundamentally cannot self-correct duration. The tool loop is cheap enough (~$0.08 for 15 min) that the quality improvement justifies using it everywhere.
- **Trade-offs**: Slightly slower for short podcasts (1-2 min vs <30s). Acceptable for reliability.

### ADR-3: 15.0 chars/sec Constant
- **Decision**: Use 15.0 chars/sec as the TTS duration estimation constant
- **Rationale**: Production data from 3 episodes shows 15.09 ±2.3% chars/sec. Using 15.0 provides a slight conservative bias (~0.6% undershoot), which combined with the 110-115% overshoot guidance, produces episodes within 5-15% of target.
- **Trade-offs**: If voice settings change significantly (speed, voice ID), the rate may drift. Mitigation: can be calibrated from actual TTS results.

### ADR-4: Prompt Caching for Cost Reduction
- **Decision**: Enable ephemeral cache on system prompt and tool definitions
- **Rationale**: In a 10-turn conversation, the system prompt (~2000 tokens) and tool definitions (~800 tokens) are sent 10 times. Caching reduces the repeated cost by ~90% (0.1x price for cache hits).
- **Trade-offs**: Cache has a 5-minute TTL. If turns take >5 min (unlikely with Haiku), cache misses occur. No functional impact.
