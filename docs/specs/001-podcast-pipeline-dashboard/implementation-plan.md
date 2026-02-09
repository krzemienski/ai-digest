---
title: "Podcast Pipeline Transparency Dashboard"
status: draft
version: "1.0"
---

# Implementation Plan

## Validation Checklist

### CRITICAL GATES (Must Pass)

- [x] All `[NEEDS CLARIFICATION: ...]` markers have been addressed
- [x] All specification file paths are correct and exist
- [x] Each phase follows TDD: Prime → Test → Implement → Validate
- [x] Every task has verifiable success criteria
- [x] A developer could follow this plan independently

### QUALITY CHECKS (Should Pass)

- [x] Context priming section is complete
- [x] All implementation phases are defined
- [x] Dependencies between phases are clear (no circular dependencies)
- [x] Parallel work is properly tagged with `[parallel: true]`
- [x] Activity hints provided for specialist selection `[activity: type]`
- [x] Every phase references relevant SDD sections
- [x] Every test references PRD acceptance criteria
- [x] Integration & E2E tests defined in final phase
- [x] Project commands match actual project setup

---

## Specification Compliance Guidelines

### How to Ensure Specification Adherence

1. **Before Each Phase**: Read the referenced SDD sections and PRD acceptance criteria
2. **During Implementation**: Follow existing codebase patterns (custom UI components, Drizzle JSONB types, admin auth guard)
3. **After Each Task**: Run `pnpm check-types` across affected packages and verify with real API calls
4. **Phase Completion**: Functional validation with real services (no mocking)

### Deviation Protocol

When implementation requires changes from the specification:
1. Document the deviation with clear rationale
2. Obtain approval before proceeding
3. Update SDD when the deviation improves the design
4. Record all deviations in this plan for traceability

## Metadata Reference

- `[parallel: true]` - Tasks that can run concurrently
- `[component: name]` - For multi-component features
- `[ref: document/section; lines: X-Y]` - Links to specifications
- `[activity: type]` - Activity hint for specialist agent selection

---

## Context Priming

*GATE: Read all files in this section before starting any implementation.*

**Specification**:

- `docs/specs/001-podcast-pipeline-dashboard/product-requirements.md` - 11 features (7 Must, 2 Should, 2 Could) with Gherkin acceptance criteria
- `docs/specs/001-podcast-pipeline-dashboard/solution-design.md` - SSE + Redis pub/sub architecture, 8 API endpoints, 2 new DB tables, 7 confirmed ADRs

**Key Design Decisions**:

- **ADR-1**: SSE over Polling — Use Server-Sent Events for <100ms real-time log streaming instead of 3s polling
- **ADR-2**: Redis Pub/Sub — Worker publishes to Redis channels, SSE endpoints subscribe. IORedis already installed.
- **ADR-3**: DB-Backed Logs + SSE Backfill — Double-write (DB + Redis) ensures no log loss; SSE backfills from DB on reconnect
- **ADR-4**: Config via BullMQ Job Data — Generation config travels with the job, snapshot stored on episode record
- **ADR-5**: Replace Existing Page — New dashboard replaces `/admin/podcast` (same URL, richer features)
- **ADR-6**: Custom UI Components — No external library; extend existing cyberpunk design system
- **ADR-7**: Model Registry as Code — TypeScript constant with model IDs, pricing, and capabilities

**Implementation Context**:

```bash
# Development
pnpm install                                    # Install all workspace deps
cd apps/web && pnpm dev                         # Next.js dev server (port 3000)
cd apps/worker && pnpm dev                      # Worker (tsx watch src/index.ts)

# Type checking
cd apps/worker && pnpm check-types              # tsc --noEmit (worker)
cd packages/db && pnpm check-types              # tsc --noEmit (db package)
cd packages/podcast && pnpm check-types         # tsc --noEmit (podcast package)
cd packages/agents && pnpm check-types          # tsc --noEmit (agents package)

# Database
cd packages/db && pnpm drizzle-kit generate     # Generate migration
cd packages/db && pnpm drizzle-kit push         # Push schema to DB

# Worker management
pkill -f "tsx.*src/index"                       # Kill zombie workers

# Functional validation
curl -X POST http://localhost:3000/api/admin/podcast/generate \
  -H "Cookie: ai-digest-session=..." \
  -H "Content-Type: application/json" \
  -d '{"digestId":"...","targetDurationMinutes":10}'
```

---

## Implementation Phases

Each task follows red-green-refactor: **Prime** (understand context), **Test** (red), **Implement** (green), **Validate** (refactor + verify).

> **Tracking Principle**: Track logical units that produce verifiable outcomes. The TDD cycle is the method, not separate tracked items.

---

### Phase 1: Data Foundation

Establishes the database schema extensions, shared types, and model registry that all subsequent phases depend on.

- [ ] **T1.1 Shared Types and Model Registry** `[activity: domain-modeling]` `[component: shared+agents]`

  1. Prime: Read SDD Application Data Models section and ADR-7 (Model Registry as Code) `[ref: SDD/Application Data Models]`
  2. Test: TypeScript compilation verifies type correctness; model registry exports correct pricing for Haiku/Sonnet/Opus
  3. Implement:
     - Add `PodcastGenerationConfig`, `LogEntry`, `ModelInfo` types to `packages/shared/src/types/podcast.ts`
     - Create `packages/agents/src/models.ts` with `MODEL_REGISTRY` constant containing model IDs, display names, tiers, input/output cost per 1M tokens, max output tokens
     - Add `STYLE_PRESETS` constant to `packages/agents/src/prompts/podcast-script.ts` (Professional, Casual, Technical, News Brief)
     - Add `buildStyledSystemPrompt(basePrompt, style, customPrompt?)` function
     - Export cost estimation function `estimateGenerationCost(model, targetDurationMinutes)` from `packages/agents/src/budget.ts`
  4. Validate: `pnpm check-types` passes in packages/shared, packages/agents
  5. Success: Model registry exports 3+ models with pricing `[ref: PRD/Feature 2]`; style presets return distinct prompt modifications `[ref: PRD/Feature 7]`; cost estimate returns breakdown by provider `[ref: PRD/Feature 5]`

- [ ] **T1.2 Database Schema Extensions** `[activity: data-architecture]` `[component: db]`

  1. Prime: Read SDD Data Storage Changes section `[ref: SDD/Data Storage Changes]`
  2. Test: Drizzle push succeeds; new tables and columns are queryable
  3. Implement:
     - Create `packages/db/src/schema/podcast-logs.ts` — `podcast_logs` table (id, episodeId, stage, severity, message, metadata jsonb, createdAt) with indexes on episodeId and createdAt
     - Create `packages/db/src/schema/podcast-configs.ts` — `podcast_configs` table (id, name, model, targetDurationMinutes, style, customStylePrompt, voiceConfig jsonb, isActive, createdAt, updatedAt)
     - Modify `packages/db/src/schema/episodes.ts` — Add columns: model (text nullable), style (text nullable), customStylePrompt (text nullable), costUsd (real nullable), configSnapshot (jsonb nullable), promptsUsed (jsonb nullable), qualityScores (jsonb nullable)
     - Export new tables from `packages/db/src/schema/index.ts`
     - Run `drizzle-kit push` to apply schema
  4. Validate: `pnpm check-types` passes in packages/db; tables exist in PostgreSQL with correct column types
  5. Success: `podcast_logs` table accepts inserts with all fields `[ref: SDD/Data Storage Changes]`; episodes table has 7 new nullable columns; `podcast_configs` table supports preset CRUD

- [ ] **T1.3 Database Query Functions** `[activity: data-architecture]` `[component: db]`

  1. Prime: Read SDD Interface Specifications for episode history and log retrieval `[ref: SDD/Internal API Changes]`
  2. Test: Query functions return correctly typed results
  3. Implement:
     - Create `packages/db/src/queries/podcast-logs.ts` — `insertLog(db, entry)`, `getLogsByEpisode(db, episodeId)`, `getLogsByEpisodeAndStage(db, episodeId, stage)`
     - Create `packages/db/src/queries/podcast-configs.ts` — `getConfigs(db)`, `getConfigById(db, id)`, `createConfig(db, data)`, `updateConfig(db, id, data)`, `getActiveConfig(db)`
     - Modify `packages/db/src/queries/episodes.ts` — Add `getEpisodeHistory(db, { page, limit })` with pagination, `getEpisodeWithFullDetail(db, id)` joining transcripts + aggregating cost, `getMonthlyCostTotal(db, year, month)`
     - Export all new queries from `packages/db/src/index.ts`
  4. Validate: `pnpm check-types` passes; queries execute against real DB without errors
  5. Success: `getEpisodeHistory` returns paginated results sorted by createdAt DESC `[ref: PRD/Feature 6]`; `getMonthlyCostTotal` returns cumulative spend `[ref: PRD/Feature 5]`

- [ ] **T1.4 Phase Validation** `[activity: validate]`

  Run all packages type checks. Verify DB schema matches SDD data models. Confirm all new types, queries, and constants are exported correctly.

---

### Phase 2: Worker Infrastructure

Builds the log emitter, extends the podcast processor to accept configuration from job data, and emits real-time log events.

- [ ] **T2.1 Log Emitter Module** `[activity: backend-infra]` `[component: worker]`

  1. Prime: Read SDD Implementation Examples (Log Emitter pattern) and ADR-2/ADR-3 `[ref: SDD/Implementation Examples]`
  2. Test: Log emitter writes to both DB and Redis pub/sub; falls back to DB-only if Redis publish fails
  3. Implement:
     - Create `apps/worker/src/lib/log-emitter.ts`
     - `createLogEmitter(redis, episodeId)` factory function
     - `emit(stage, severity, message, metadata?)` method — parallel writes to `podcast_logs` table + Redis `PUBLISH podcast:{episodeId}:logs`
     - `emitStageUpdate(stage, status, startedAt?, completedAt?)` method — publishes stage transition events
     - `emitComplete(episodeId, status, audioUrl?, durationSeconds?, costUsd?)` method — publishes completion event
     - Error handling: if Redis publish fails, log warning and continue (DB write is the source of truth)
  4. Validate: `pnpm check-types` passes; manually verify log entries appear in `podcast_logs` table AND Redis subscriber receives messages
  5. Success: Log emitter writes to DB within 50ms `[ref: SDD/Quality Requirements]`; Redis messages arrive within 100ms; DB fallback works when Redis is unavailable `[ref: SDD/Error Handling]`

- [ ] **T2.2 Podcast Processor Configuration Extension** `[activity: backend-logic]` `[component: worker]`

  1. Prime: Read SDD Solution Strategy (config via BullMQ job data) and current `apps/worker/src/processors/podcast.ts` `[ref: SDD/ADR-4]` `[ref: apps/worker/src/processors/podcast.ts]`
  2. Test: Processor reads model, voiceConfig, and style from job data instead of hardcoded values; falls back to defaults if not provided
  3. Implement:
     - Extend `PodcastJobData` interface: add `model?: string`, `voiceConfig?: VoiceConfig`, `style?: string`, `customStylePrompt?: string`
     - Replace hardcoded `"claude-haiku-4-5-20251001"` with `job.data.model ?? "claude-haiku-4-5-20251001"` (2 locations: script gen + quality review)
     - Replace hardcoded voice config with `job.data.voiceConfig ?? DEFAULT_VOICE_CONFIG`
     - Pass style to `buildStyledSystemPrompt()` for the script generation system prompt
     - Store `configSnapshot` on episode record at job start
     - Store `promptsUsed` (system prompt + user prompt) after assembling them
     - Store `qualityScores` after each review attempt
     - Update `costUsd` on episode record at completion
  4. Validate: `pnpm check-types` passes; generate a podcast with default config (backward compatible); generate another with explicit Haiku + non-default style
  5. Success: Episode record contains `configSnapshot` with all config fields `[ref: PRD/Feature 6]`; `promptsUsed` contains full system and user prompt text `[ref: PRD/Feature 1]`; `qualityScores` contains all review attempts `[ref: PRD/Feature 1]`

- [ ] **T2.3 Podcast Processor Log Integration** `[activity: backend-logic]` `[component: worker]`

  1. Prime: Read SDD Runtime View (Primary Flow sequence diagram) for all log emission points `[ref: SDD/Runtime View]`
  2. Test: Each pipeline stage emits appropriate log entries; TTS emits per-segment progress; errors emit error-severity logs
  3. Implement:
     - Instantiate `createLogEmitter(redis, episodeId)` at job start
     - **Content Selection**: emit log with selected story titles and scores
     - **Script Generation**: emit system prompt (info), user prompt (info), then result with segment count + token usage + cost
     - **Quality Review**: emit each attempt's scores (all sub-dimensions), pass/fail status, revision feedback if applicable
     - **TTS**: emit per-segment progress "Segment N of M (Speaker, X chars) — Y.Zs" with elapsed time
     - **Assembly**: emit concatenation start, completion with duration
     - **Upload**: emit S3 key, content type, file size, HTTP status
     - **Completion**: emit final summary with total cost, duration, audio URL
     - **Errors**: emit error-severity log with stage, error message, and API response details (secrets redacted)
     - Emit stage_update events at each stage start/complete/fail
  4. Validate: Run a full podcast generation with Haiku/defaults; verify `podcast_logs` table has entries for all 6 stages; verify Redis subscriber received real-time events
  5. Success: All 6 stages produce at least 1 log entry each `[ref: PRD/Feature 4]`; TTS produces per-segment entries `[ref: PRD/Feature 4, AC-4.2]`; API call metadata includes status codes and response times `[ref: PRD/Feature 4, AC-4.3]`; errors include API response details `[ref: PRD/Feature 4, AC-4.4]`

- [ ] **T2.4 Phase Validation** `[activity: validate]`

  Run a complete podcast generation end-to-end with default config. Verify:
  - Episode record has `configSnapshot`, `promptsUsed`, `qualityScores`, `costUsd`
  - `podcast_logs` table has 20+ entries across all 6 stages
  - Redis pub/sub messages were received (test with `redis-cli SUBSCRIBE podcast:*:logs`)
  - Worker type checks pass: `cd apps/worker && pnpm check-types`

---

### Phase 3: API Layer

Builds the Next.js API routes that bridge the worker data to the frontend. SSE endpoint is the core innovation.

- [ ] **T3.1 SSE Log Streaming Endpoint** `[activity: backend-api]` `[component: web]`

  1. Prime: Read SDD Implementation Examples (SSE Endpoint Pattern) and ADR-1 `[ref: SDD/Implementation Examples]` `[ref: SDD/ADR-1]`
  2. Test: SSE endpoint streams real-time log entries; backfills from DB on connection; cleans up Redis subscriber on disconnect
  3. Implement:
     - Create `apps/web/src/app/api/admin/podcast/stream/route.ts`
     - `GET /api/admin/podcast/stream?episodeId={id}`
     - Auth: `requireAdminFromRequest(request)`
     - Create dedicated Redis subscriber connection
     - Backfill: query `podcast_logs` for existing entries, send as SSE events
     - Subscribe: `redis.subscribe(podcast:{episodeId}:logs)`, forward messages as `event: log`
     - Stage updates forwarded as `event: stage_update`
     - Completion forwarded as `event: complete`
     - Cleanup: on `request.signal.abort`, unsubscribe + quit Redis connection
     - Use `new Response(stream)` (NOT NextResponse) with `Content-Type: text/event-stream`
  4. Validate: Start a podcast generation, connect to SSE endpoint with `curl`, verify log events stream in real-time
  5. Success: SSE events appear within 200ms of worker emission `[ref: SDD/Quality Requirements]`; backfill includes all previous logs on reconnection `[ref: PRD/Feature 4, AC-4.5]`; Redis subscriber is cleaned up on disconnect (no connection leaks)

- [ ] **T3.2 Generation API Extension** `[activity: backend-api]` `[component: web]`

  1. Prime: Read SDD Internal API Changes (Generate Podcast endpoint) `[ref: SDD/Internal API Changes]`
  2. Test: API accepts expanded config (model, voiceConfig, style); validates inputs; passes config to BullMQ job
  3. Implement:
     - Modify `apps/web/src/app/api/admin/podcast/generate/route.ts`
     - Accept new fields: `model`, `voiceConfig`, `style`, `customStylePrompt`
     - Validate model against `MODEL_REGISTRY` (reject unknown models)
     - Validate voiceConfig structure with Zod schema
     - Pass all config fields in BullMQ job data
     - Store config on episode record immediately (configSnapshot)
  4. Validate: POST with expanded config; verify BullMQ job data contains all fields; verify episode record has configSnapshot
  5. Success: API accepts model selection `[ref: PRD/Feature 2]`; rejects invalid model names with 400 error; passes voice config to worker `[ref: PRD/Feature 3]`

- [ ] **T3.3 Voices API and Preview** `[parallel: true]` `[activity: backend-api]` `[component: web]`

  1. Prime: Read SDD Interface Specifications for voices and voice-preview endpoints `[ref: SDD/Internal API Changes]`
  2. Test: Voices endpoint returns ElevenLabs voice list; preview endpoint returns audio binary; voices are cached in Redis
  3. Implement:
     - Create `apps/web/src/app/api/admin/podcast/voices/route.ts`
       - `GET /api/admin/podcast/voices`
       - Fetch from ElevenLabs `GET /v1/voices` with `xi-api-key` header
       - Cache result in Redis with key `elevenlabs:voices` and 1-hour TTL
       - Return `{ voices: [{ voiceId, name, category, previewUrl, labels }] }`
     - Create `apps/web/src/app/api/admin/podcast/voice-preview/route.ts`
       - `POST /api/admin/podcast/voice-preview`
       - Accept `{ voiceId, text?, settings? }`
       - Call ElevenLabs TTS with short sample text (default: "Welcome to AI Digest, your daily briefing on artificial intelligence news and breakthroughs.")
       - Return `audio/mpeg` binary response
       - Rate limit: track in Redis, max 10 requests per minute
  4. Validate: Call voices endpoint, verify it returns real ElevenLabs voices; call preview with a voice ID, verify audio plays
  5. Success: Voice list returns 10+ voices with preview URLs `[ref: PRD/Feature 3, AC-3.1]`; preview plays audio sample within 2s `[ref: SDD/Quality Requirements]`; second voices call returns cached result within 500ms `[ref: SDD/Quality Requirements]`

- [ ] **T3.4 History and Episode Detail APIs** `[parallel: true]` `[activity: backend-api]` `[component: web]`

  1. Prime: Read SDD Internal API Changes for history and episode endpoints `[ref: SDD/Internal API Changes]`
  2. Test: History returns paginated episodes; episode detail returns full data with logs and transcript
  3. Implement:
     - Create `apps/web/src/app/api/admin/podcast/history/route.ts`
       - `GET /api/admin/podcast/history?page={n}&limit={n}`
       - Query `getEpisodeHistory(db, { page, limit })` — sorted by createdAt DESC
       - Return `{ episodes: [...], total, page, limit }`
     - Create `apps/web/src/app/api/admin/podcast/episode/[id]/route.ts`
       - `GET /api/admin/podcast/episode/{id}`
       - Query `getEpisodeWithFullDetail(db, id)` — episode + transcript + logs + configSnapshot
       - Return `{ episode, transcript, logs, config }`
  4. Validate: Create 2+ episodes via generation; call history endpoint, verify pagination; call episode detail, verify all fields present
  5. Success: History shows all past episodes with model, style, cost `[ref: PRD/Feature 6, AC-6.1]`; episode detail includes full config, prompts, script, quality scores, logs `[ref: PRD/Feature 6, AC-6.2]`

- [ ] **T3.5 Cost Estimate API** `[parallel: true]` `[activity: backend-api]` `[component: web]`

  1. Prime: Read SDD Complex Logic (Pre-Generation Cost Estimation algorithm) `[ref: SDD/Complex Logic]`
  2. Test: Cost estimate returns breakdown by provider; uses correct model pricing from registry
  3. Implement:
     - Create `apps/web/src/app/api/admin/podcast/cost-estimate/route.ts`
       - `POST /api/admin/podcast/cost-estimate`
       - Accept `{ model, targetDurationMinutes }`
       - Call `estimateGenerationCost()` from agents package
       - Return `{ estimatedCost: { anthropic: {...}, elevenlabs: {...}, total }, warning? }`
     - Include warning string when model is Opus ("Opus costs ~25x more than Haiku")
  4. Validate: Call with Haiku/10min, verify cost ~$0.08; call with Opus/10min, verify cost ~$1.50 with warning
  5. Success: Cost estimate responds within 100ms (no API calls) `[ref: SDD/Quality Requirements]`; includes per-provider breakdown `[ref: PRD/Feature 5]`

- [ ] **T3.6 Monthly Spend Endpoint** `[activity: backend-api]` `[component: web]`

  1. Prime: Read SDD for cumulative cost tracking `[ref: PRD/Feature 5, AC-5.2]`
  2. Test: Returns monthly total from completed episodes' costUsd column
  3. Implement:
     - Add to existing status or create `apps/web/src/app/api/admin/podcast/spend/route.ts`
       - `GET /api/admin/podcast/spend`
       - Call `getMonthlyCostTotal(db, year, month)` for current month
       - Return `{ currentMonth: { total, count }, threshold: 50 }`
  4. Validate: After 1+ generations with cost, verify spend endpoint returns correct total
  5. Success: Monthly spend reflects sum of all episode costUsd values `[ref: PRD/Feature 5, AC-5.2]`

- [ ] **T3.7 Phase Validation** `[activity: validate]`

  Test all API endpoints with curl:
  - `GET /api/admin/podcast/voices` — returns voice list
  - `POST /api/admin/podcast/voice-preview` — returns audio
  - `POST /api/admin/podcast/cost-estimate` — returns cost breakdown
  - `POST /api/admin/podcast/generate` — accepts expanded config, returns episodeId
  - `GET /api/admin/podcast/stream?episodeId=X` — streams SSE events during generation
  - `GET /api/admin/podcast/history` — returns paginated episodes
  - `GET /api/admin/podcast/episode/{id}` — returns full episode detail
  - `GET /api/admin/podcast/spend` — returns monthly total
  - All endpoints require auth (return 401 without session cookie)
  - Type checks pass: `cd apps/web && pnpm check-types`

---

### Phase 4: Frontend — Configuration Panel

Builds the configuration UI: model selector, voice selector with preview, style selector, duration picker, and cost estimate display.

- [ ] **T4.1 Custom Hooks** `[activity: frontend]` `[component: web]`

  1. Prime: Read SDD Directory Map for hooks `[ref: SDD/Directory Map]`
  2. Test: Hooks fetch and cache data correctly; handle loading/error states
  3. Implement:
     - Create `apps/web/src/app/admin/podcast/hooks/use-voices.ts`
       - Fetch from `/api/admin/podcast/voices`
       - Cache in component state (avoids re-fetch on tab switch)
       - Return `{ voices, loading, error }`
     - Create `apps/web/src/app/admin/podcast/hooks/use-log-stream.ts`
       - Accept `episodeId` parameter
       - Create `EventSource` connection to `/api/admin/podcast/stream?episodeId={id}`
       - Parse SSE events into typed `LogEntry[]` and `StageStatus` state
       - Handle `event: log`, `event: stage_update`, `event: complete`, `event: error`
       - Clean up EventSource on unmount
       - Return `{ logs, stages, isComplete, error }`
     - Create `apps/web/src/app/admin/podcast/hooks/use-episode-history.ts`
       - Fetch from `/api/admin/podcast/history?page={n}&limit=10`
       - Support pagination (next/prev)
       - Return `{ episodes, total, page, loading, goToPage }`
  4. Validate: TypeScript compiles; hooks usable in test component
  5. Success: `useLogStream` receives SSE events in real-time `[ref: PRD/Feature 4]`; `useVoices` returns voice list `[ref: PRD/Feature 3]`; `useEpisodeHistory` paginates correctly `[ref: PRD/Feature 6]`

- [ ] **T4.2 Model Selector Component** `[activity: frontend]` `[component: web]`

  1. Prime: Read SDD UI Visualization Guide (Config Panel) and existing dropdown patterns `[ref: SDD/UI Visualization Guide]`
  2. Test: Renders 3+ model options; shows tier badge and cost hint; fires onChange
  3. Implement:
     - Create `apps/web/src/app/admin/podcast/components/model-selector.tsx`
     - Import `MODEL_REGISTRY` from agents package
     - Dropdown with model name, tier badge (fast/balanced/premium), cost hint
     - Highlight current selection
     - Follow existing dropdown styling: `bg-bg border border-surface-elevated rounded text-text-primary`
  4. Validate: Renders in browser; all models shown; selection updates parent state
  5. Success: Shows Haiku, Sonnet, Opus with cost indicators `[ref: PRD/Feature 2, AC-2.1]`

- [ ] **T4.3 Voice Selector with Preview** `[activity: frontend]` `[component: web]`

  1. Prime: Read SDD Voice Config section and existing `voice-selector.tsx` + `voice-preview.tsx` components `[ref: SDD/UI Visualization Guide]` `[ref: apps/web/src/app/admin/podcast/components/voice-selector.tsx]`
  2. Test: Shows voice list from API; plays preview audio; sliders adjust settings
  3. Implement:
     - Extend or rewrite `apps/web/src/app/admin/podcast/components/voice-selector.tsx`
       - Use `useVoices` hook to populate dropdown
       - Show voice name and category
       - Preview button plays audio from `/api/admin/podcast/voice-preview`
     - Extend or rewrite `apps/web/src/app/admin/podcast/components/voice-preview.tsx`
       - Settings sliders: stability (0-1), similarity boost (0-1), speed (0.5-2.0), style (0-1)
       - "Preview with settings" button regenerates audio sample with current slider values
       - Audio plays via `<audio>` element with blob URL from fetch response
     - Compose into a VoiceConfigPanel that shows Host A and Host B side by side
  4. Validate: Open in browser; see real ElevenLabs voices; click preview, hear audio; adjust sliders, preview again
  5. Success: Voice list shows real voices from operator's ElevenLabs account `[ref: PRD/Feature 3, AC-3.1]`; preview plays audio `[ref: PRD/Feature 3, AC-3.2]`; settings affect preview output `[ref: PRD/Feature 3, AC-3.3]`

- [ ] **T4.4 Style Selector Component** `[activity: frontend]` `[component: web]`

  1. Prime: Read SDD Style Presets and PRD Feature 7 `[ref: SDD/Implementation Examples]` `[ref: PRD/Feature 7]`
  2. Test: Shows 4 presets + Custom option; Custom reveals text editor; fires onChange with style name + custom text
  3. Implement:
     - Create `apps/web/src/app/admin/podcast/components/style-selector.tsx`
     - Radio/pill selector for: Professional, Casual, Technical Deep-Dive, News Brief, Custom
     - When Custom selected: show `<textarea>` pre-filled with Professional preset instructions
     - Follow existing form styling patterns
  4. Validate: Renders in browser; all presets selectable; Custom shows editor with default text
  5. Success: 4+ preset styles shown `[ref: PRD/Feature 7, AC-7.1]`; Custom allows editing `[ref: PRD/Feature 7, AC-7.3]`

- [ ] **T4.5 Configuration Panel Assembly** `[activity: frontend]` `[component: web]`

  1. Prime: Read SDD UI Visualization Guide (Generate Tab Layout) `[ref: SDD/UI Visualization Guide]`
  2. Test: Panel composes model, duration, style, digest, and voice selectors; shows cost estimate; fires Generate with full config
  3. Implement:
     - Create `apps/web/src/app/admin/podcast/components/config-panel.tsx`
     - Compose: ModelSelector, DurationSelector (existing dropdown), StyleSelector, DigestSelector (existing), VoiceConfigPanel (Host A + B)
     - Cost estimate display: fetch from `/api/admin/podcast/cost-estimate` on config change (debounced 500ms)
     - "Generate" button sends full `PodcastGenerationConfig` to parent
     - All fields have sensible defaults (Haiku, 10min, Professional, Brian+Sarah)
  4. Validate: Open in browser; all selectors render; change model, see cost update; click Generate with custom config
  5. Success: Operator can generate with zero config (all defaults) `[ref: SDD/Quality Requirements]`; cost estimate updates on config change `[ref: PRD/Feature 5]`

- [ ] **T4.6 Phase Validation** `[activity: validate]`

  Open `/admin/podcast` in browser. Verify:
  - Model selector shows 3 models with cost hints
  - Voice selector shows real ElevenLabs voices
  - Voice preview plays audio
  - Style selector shows 4 presets + Custom
  - Cost estimate displays and updates
  - Generate button with default config triggers generation API
  - Type checks pass

---

### Phase 5: Frontend — Real-Time Monitoring

Builds the log viewer, stage progress bar, script viewer, and generation monitor that display real-time pipeline progress.

- [ ] **T5.1 Stage Progress Component** `[activity: frontend]` `[component: web]`

  1. Prime: Read SDD UI Visualization Guide (Pipeline Progress bar) `[ref: SDD/UI Visualization Guide]`
  2. Test: Shows 6 stages with status indicators; updates from SSE stage_update events; shows per-stage timing
  3. Implement:
     - Create `apps/web/src/app/admin/podcast/components/stage-progress.tsx`
     - Horizontal 6-stage indicator: Content → Script → Review → TTS → Assembly → Upload
     - Status indicators: pending (gray circle), running (spinning blue), done (green check), warn (yellow triangle), failed (red X)
     - Per-stage timing below indicator (e.g., "2.1s", "12/29")
     - Accepts `stages` state from `useLogStream` hook
  4. Validate: Render with mock stage data; verify visual transitions
  5. Success: All 6 stages shown with correct status colors `[ref: PRD/Feature 4]`; TTS shows segment progress `[ref: PRD/Feature 4, AC-4.2]`

- [ ] **T5.2 Log Entry and Log Viewer Components** `[activity: frontend]` `[component: web]`

  1. Prime: Read SDD UI Visualization Guide (Live Log panel) and PRD Feature 4 business rules `[ref: SDD/UI Visualization Guide]` `[ref: PRD/Feature 4]`
  2. Test: Log entries render with timestamp, stage badge, severity color, message; expandable sections for prompts/scripts; scroll-to-bottom on new entries
  3. Implement:
     - Create `apps/web/src/app/admin/podcast/components/log-entry.tsx`
       - Timestamp (HH:MM:SS), stage badge (colored by stage), severity indicator
       - Expandable: if metadata contains `systemPrompt`, `userPrompt`, or `segments`, show collapsed with "tap to expand"
       - Geist Mono font for log text
     - Create `apps/web/src/app/admin/podcast/components/log-viewer.tsx`
       - Scrollable container with auto-scroll to bottom (unless user has scrolled up)
       - Accepts `logs: LogEntry[]` from `useLogStream` hook
       - Append-only display (PRD business rule 5)
       - Info: default color, Warn: yellow, Error: red
  4. Validate: Render with sample log entries; verify expandable sections; verify auto-scroll behavior
  5. Success: Log entries appear within 1s of emission `[ref: PRD/Feature 4, Rule 1]`; expandable sections collapsed by default `[ref: PRD/Feature 4, Rule 5]`; append-only display `[ref: PRD/Feature 4, AC-4.5]`

- [ ] **T5.3 Script Viewer Component** `[activity: frontend]` `[component: web]`

  1. Prime: Read PRD Feature 1 (prompt visibility) and SDD episode detail API `[ref: PRD/Feature 1]`
  2. Test: Displays all segments with speaker label, text, and estimated duration; shows total segment count
  3. Implement:
     - Create `apps/web/src/app/admin/podcast/components/script-viewer.tsx`
       - Render each segment: speaker badge (Host A = cyan, Host B = accent), text, duration
       - Show segment count header: "Full Script (29 segments)"
       - Scrollable container
  4. Validate: Render with transcript data from a real episode; all segments visible
  5. Success: Displays ALL segments (not truncated) `[ref: PRD/Feature 1, AC-1.3]`; shows speaker, text, estimated duration per segment

- [ ] **T5.4 Cost Breakdown Component** `[activity: frontend]` `[component: web]`

  1. Prime: Read PRD Feature 5 and SDD episode detail `[ref: PRD/Feature 5]`
  2. Test: Shows Anthropic cost (input tokens x rate + output tokens x rate), ElevenLabs cost, total
  3. Implement:
     - Create `apps/web/src/app/admin/podcast/components/cost-breakdown.tsx`
       - Accept cost data from episode record or log metadata
       - Display: Anthropic (input: X tokens, output: Y tokens) = $Z.ZZ; ElevenLabs (N chars) = $Z.ZZ; Total = $Z.ZZ
       - Color-coded: green if under $0.50, yellow if $0.50-$2.00, red if over $2.00
  4. Validate: Render with real episode cost data
  5. Success: Shows per-provider breakdown `[ref: PRD/Feature 5, AC-5.1]`

- [ ] **T5.5 Generation Monitor Assembly** `[activity: frontend]` `[component: web]`

  1. Prime: Read SDD UI Visualization Guide and Component States diagram `[ref: SDD/UI Visualization Guide]`
  2. Test: Composes stage progress + log viewer + cost breakdown; transitions from generating to completed state
  3. Implement:
     - Create `apps/web/src/app/admin/podcast/components/generation-monitor.tsx`
       - Accept `episodeId` prop
       - Use `useLogStream(episodeId)` hook
       - Compose: StageProgress (top), LogViewer (middle, scrollable), CostBreakdown (bottom, when complete)
       - On completion: show audio player + ScriptViewer + full cost breakdown
       - On failure: show error details with stage that failed
  4. Validate: Trigger a real generation; watch the monitor in the browser; verify all components update in real-time
  5. Success: Real-time monitoring works end-to-end `[ref: PRD/Feature 4]`; completion shows audio player and results `[ref: PRD/Feature 1]`

- [ ] **T5.6 Phase Validation** `[activity: validate]`

  Trigger a real podcast generation from the dashboard and observe:
  - Stage progress updates in real-time (each stage lights up)
  - Log entries stream in with correct timestamps and stage badges
  - Prompts appear as expandable sections
  - TTS shows per-segment progress
  - On completion: audio plays, script is visible, cost breakdown displays
  - Type checks pass

---

### Phase 6: Frontend — History and Replay

Builds the history tab, episode detail view, replay functionality, and monthly spend tracking.

- [ ] **T6.1 Job History List** `[activity: frontend]` `[component: web]`

  1. Prime: Read SDD UI Visualization Guide (History Tab Layout) `[ref: SDD/UI Visualization Guide]`
  2. Test: Displays paginated episode list with date, duration, model, style, cost, status; clicking opens detail
  3. Implement:
     - Create `apps/web/src/app/admin/podcast/components/job-history.tsx`
       - Use `useEpisodeHistory` hook
       - Table with columns: Date, Duration, Model, Style, Cost, Status
       - Status badges: Ready (green), Failed (red), Generating (blue spinning)
       - Pagination controls (prev/next)
       - Click row to select episode (fires onSelect callback)
       - Monthly spend display above table (from `/api/admin/podcast/spend`)
  4. Validate: Generate 2+ episodes; open history tab; verify all appear with correct data; pagination works
  5. Success: History shows all past episodes sorted by date `[ref: PRD/Feature 6, AC-6.1]`; monthly spend visible `[ref: PRD/Feature 5, AC-5.2]`

- [ ] **T6.2 Episode Detail View** `[activity: frontend]` `[component: web]`

  1. Prime: Read SDD episode detail API and PRD Feature 6 `[ref: SDD/Internal API Changes]` `[ref: PRD/Feature 6]`
  2. Test: Shows full episode data: audio player, config summary, prompts (expandable), script, quality scores, cost, logs
  3. Implement:
     - Create `apps/web/src/app/admin/podcast/components/episode-detail.tsx`
       - Fetch full detail from `/api/admin/podcast/episode/{id}`
       - Audio player with `<audio>` element and playback controls
       - Config summary line: "Haiku | Brian + Sarah | Professional | 10 min"
       - Expandable sections: System Prompt, User Prompt, Full Script, Pipeline Logs
       - Quality scores: display all sub-scores and overall with pass/fail
       - Cost breakdown component (reuse T5.4)
       - "Recreate with these settings" button
  4. Validate: Click an episode in history; verify all sections render with real data; audio plays
  5. Success: Episode detail shows complete configuration `[ref: PRD/Feature 6, AC-6.2]`; prompts are viewable `[ref: PRD/Feature 1]`; audio plays `[ref: PRD/Feature 6, AC-6.1]`

- [ ] **T6.3 Replay (Recreate) Functionality** `[activity: frontend]` `[component: web]`

  1. Prime: Read PRD Feature 6 replay acceptance criteria `[ref: PRD/Feature 6, AC-6.3]`
  2. Test: "Recreate" button populates config panel with past episode's configSnapshot; operator can modify and generate
  3. Implement:
     - In episode-detail.tsx: "Recreate with these settings" button extracts `configSnapshot` from episode
     - Calls parent callback `onReplay(config: PodcastGenerationConfig)`
     - Parent (page.tsx) switches to Generate tab and populates config panel with the config
     - Operator can modify any field before generating
  4. Validate: Generate episode A with Haiku; open in history; click Recreate; verify config panel pre-filled; modify model to Sonnet; generate episode B; verify both in history
  5. Success: Recreate pre-fills all config fields `[ref: PRD/Feature 6, AC-6.3]`; modified generation creates new episode visible in history `[ref: PRD/Feature 6, AC-6.4]`

- [ ] **T6.4 Phase Validation** `[activity: validate]`

  Full history workflow validation:
  - History tab shows all past episodes with correct data
  - Monthly spend is accurate
  - Episode detail displays all sections
  - Audio plays from episode detail
  - Recreate pre-fills config and allows modification
  - New generation from replay appears in history

---

### Phase 7: Page Assembly and Polish

Assembles all components into the final tabbed page, replaces the existing podcast admin page.

- [ ] **T7.1 Tabbed Page Assembly** `[activity: frontend]` `[component: web]`

  1. Prime: Read SDD ADR-5 (replace existing page) and Screen Flows diagram `[ref: SDD/ADR-5]` `[ref: SDD/UI Visualization Guide]`
  2. Test: Page has Generate and History tabs; state transitions work (Configuring → Generating → Completed → History)
  3. Implement:
     - Rewrite `apps/web/src/app/admin/podcast/page.tsx`
       - Tabbed interface: "Generate" and "History"
       - Generate tab: ConfigPanel (top) + GenerationMonitor (bottom, visible when generating/completed)
       - History tab: JobHistory (top) + EpisodeDetail (bottom, visible when episode selected)
       - State machine: configuring → generating → monitoring → completed
       - Replay callback: switches to Generate tab with pre-filled config
       - Responsive layout following existing admin page patterns
  4. Validate: Open `/admin/podcast`; switch tabs; generate; view history; replay
  5. Success: Replaces existing page at same URL `[ref: SDD/ADR-5]`; tabbed navigation works; all state transitions smooth

- [ ] **T7.2 UI Polish and Consistency** `[activity: frontend]` `[component: web]`

  1. Prime: Read existing admin pages for styling consistency `[ref: apps/web/src/app/admin/page.tsx]`
  2. Test: Visual consistency with existing admin dashboard; no broken layouts; loading states present
  3. Implement:
     - Verify all components use `bg-surface`, `text-accent`, `border-surface-elevated` consistently
     - Add loading skeletons for voices list, history list, episode detail
     - Add empty states ("No episodes yet", "Select an episode to view details")
     - Ensure responsive behavior (sidebar collapse on mobile)
     - Add keyboard navigation for tabs
     - Add ARIA labels for stage indicators and status badges
  4. Validate: Visual inspection across all states; compare styling with existing admin pages
  5. Success: Dashboard looks professional and consistent with existing admin `[ref: PRD Vision: professional UI/UX]`

- [ ] **T7.3 Phase Validation** `[activity: validate]`

  Complete UI walkthrough:
  - Page loads with Generate tab active and sensible defaults
  - All configuration options work (model, voice, style, duration)
  - Generation monitoring shows real-time progress
  - Completion shows full results with audio
  - History tab shows all past episodes
  - Episode detail shows all data sections
  - Replay works end-to-end
  - Type checks pass: `cd apps/web && pnpm check-types`

---

### Phase 8: Validation Deliverables

Three complete podcast generations with distinct configurations, each with full evidence capture. This is the final acceptance gate.

- [ ] **T8.1 Generation 1: Baseline (Haiku, Default Voices, Professional)** `[activity: functional-validation]`

  1. Config: Model=Haiku, Voices=Brian+Sarah (defaults), Style=Professional, Duration=10min
  2. Execute: Generate via dashboard
  3. Evidence capture:
     - Screenshot: Dashboard during generation (stage progress + live log)
     - Screenshot: Completed result (audio player + cost breakdown + quality scores)
     - Screenshot: System prompt visible in log (expanded)
     - Screenshot: Full script viewer with all segments
     - Verify: Audio plays correctly
     - Verify: Cost breakdown shows Anthropic + ElevenLabs totals
     - Verify: Episode appears in history with correct metadata
  4. Success: Complete generation with all evidence captured `[ref: PRD/Validation Deliverables, Generation 1]`

- [ ] **T8.2 Generation 2: Premium (Opus or Sonnet, Different Voices, Casual)** `[activity: functional-validation]`

  1. Config: Model=Opus (or Sonnet if key doesn't support Opus), Voices=different from Gen 1, Style=Casual, Duration=15min
  2. Execute: Generate via dashboard
  3. Evidence capture:
     - Screenshot: Model selector showing non-Haiku selection
     - Screenshot: Voice preview playing a different voice
     - Screenshot: Full script with casual tone visible in segments
     - Screenshot: Cost comparison with Generation 1 (higher cost visible)
     - Screenshot: History tab showing both episodes
     - Verify: Audio plays with different voices
     - Verify: Cost is higher than Generation 1 (different model pricing)
  4. Success: Distinct configuration produces different output `[ref: PRD/Validation Deliverables, Generation 2]`

- [ ] **T8.3 Generation 3: Technical (Sonnet, Custom Style, Short Format + Replay)** `[activity: functional-validation]`

  1. Config: Model=Sonnet, Voices=operator's choice with custom settings, Style=Custom (or Technical Deep-Dive), Duration=5min
  2. Execute via REPLAY: Open Generation 1 in history → click "Recreate" → modify config → generate
  3. Evidence capture:
     - Screenshot: Replay pre-filling config from Generation 1
     - Screenshot: Custom style editor (if using Custom style)
     - Screenshot: Generation with short format (fewer segments)
     - Screenshot: History tab showing all 3 episodes
     - Screenshot: Episode detail showing replay config
     - Verify: Audio plays
     - Verify: Config snapshot shows replay origin
  4. Success: Replay workflow works; 3 distinct episodes in history `[ref: PRD/Validation Deliverables, Generation 3]`

- [ ] **T8.4 Final Validation Gate** `[activity: validate]`

  Comprehensive check:
  - [ ] 3 episodes in history with distinct configurations
  - [ ] All audio files play correctly
  - [ ] Cost breakdowns visible and accurate for all 3
  - [ ] Prompt visibility working (system + user prompts viewable)
  - [ ] Full scripts visible (not truncated)
  - [ ] Quality scores displayed for all 3
  - [ ] Log entries persisted in `podcast_logs` table for all 3
  - [ ] Replay workflow demonstrated (Gen 3 based on Gen 1)
  - [ ] Monthly spend reflects sum of all 3 episodes
  - [ ] SSE real-time streaming worked for at least 1 generation
  - [ ] All type checks pass across all packages
  - [ ] No console errors in browser

---

## Plan Verification

| Criterion | Status |
|-----------|--------|
| A developer can follow this plan without additional clarification | ✅ |
| Every task produces a verifiable deliverable | ✅ |
| All PRD acceptance criteria map to specific tasks | ✅ |
| All SDD components have implementation tasks | ✅ |
| Dependencies are explicit with no circular references | ✅ |
| Parallel opportunities are marked with `[parallel: true]` | ✅ |
| Each task has specification references `[ref: ...]` | ✅ |
| Project commands in Context Priming are accurate | ✅ |
