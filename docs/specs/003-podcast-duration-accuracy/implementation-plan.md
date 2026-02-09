# Implementation Plan: 003 — Podcast Duration Accuracy & User Self-Serve

## Context Priming

| Source | Path | Relevance |
|--------|------|-----------|
| SDD | `docs/specs/003-podcast-duration-accuracy/solution-design.md` | Architecture, tool loop design, cost model |
| Current processor | `apps/web/src/lib/processors/podcast.ts` | Lines 132-544 — full pipeline to modify |
| Agent system prompt | `packages/agents/src/prompts/podcast-agent.ts` | Proven 4-phase prompt with duration targets |
| Classic system prompt | `packages/agents/src/prompts/podcast-script.ts` | To be replaced by tool loop |
| Script parser | `packages/podcast/src/script-parser.ts` | parseScript, validateSegments |
| TTS | `packages/podcast/src/tts.ts` | generateSegmentAudio (unchanged) |
| Podcast package | `packages/podcast/package.json` | Dependencies and exports |
| Admin podcast UI | `apps/web/src/app/admin/podcast/` | Existing admin config panel |
| Public podcasts | `apps/web/src/app/podcasts/` | Public listing and player |
| Middleware | `apps/web/src/middleware.ts` | Auth flow |

## Project Commands

```bash
pnpm check-types          # TypeScript validation (from apps/web)
pnpm --filter @ai-digest/podcast check-types  # Podcast package only
```

---

## Phase 1: Script Generator with Tool Loop `[ref: SDD/Section 3]`

Build the core module that replaces both classic and Agent SDK modes with an Anthropic Client SDK tool loop.

- [ ] **T1.1 Script Generator Module** `[activity: backend]` `[component: podcast]`

  **Prime**: Read SDD Section 3.1-3.4 (tool loop architecture, 4 tools, duration targeting). Read existing Agent SDK implementation at `apps/worker/src/processors/podcast-script-agent.ts` for tool logic to port.

  **Implement**: Create `packages/podcast/src/script-generator.ts`:
  - Export `generateScriptWithTools(options)` returning `ScriptGeneratorResult`
  - 4 tool definitions with JSON Schema: `get_stories`, `save_section`, `get_progress`, `finalize_script`
  - Manual `client.messages.create()` loop with `stop_reason === "tool_use"` check
  - Closure state: `savedSections[]`, `globalOrderCounter`, story data
  - `CHARS_PER_SECOND = 15.0` constant (validated from production: 15.09 ±2.3%)
  - Token tracking per turn: `totalInputTokens`, `totalOutputTokens`, `cacheReadTokens`
  - Cost calculation using model pricing from `@ai-digest/agents`
  - `onProgress` callback for real-time logging
  - `maxTurns` guard (default 40), `maxBudgetUsd` guard (default $5)
  - Enable prompt caching: `cache_control: { type: "ephemeral" }` on system prompt

  **Validate**: `pnpm --filter @ai-digest/podcast check-types` passes. Module exports match SDD Section 5.1 interface.

- [ ] **T1.2 Updated System Prompt** `[activity: backend]` `[component: agents]`

  **Prime**: Read SDD Section 3.4 (duration targeting strategy). Read `packages/agents/src/prompts/podcast-agent.ts` for existing prompt.

  **Implement**: Modify `packages/agents/src/prompts/podcast-agent.ts`:
  - Change `CHARS_PER_SECOND` reference from 14.5 to 15.0 in the prompt text
  - Add exported function `buildToolLoopSystemPrompt(targetDurationMinutes, style, customPrompt?)` that:
    - Computes `targetSeconds = targetDurationMinutes * 60`
    - Computes `requiredChars = Math.round(targetSeconds * 15)`
    - Interpolates targets into the prompt: "You need ~{requiredChars} total characters"
    - Appends style instructions
  - Keep the 4-phase workflow (Research → Plan → Write → Finalize)
  - Update overshoot guidance: "aim for 110-115% of target"

  **Validate**: TypeScript passes. Function returns string with interpolated values.

- [ ] **T1.3 Package Integration** `[activity: backend]` `[component: podcast]`

  **Prime**: Read `packages/podcast/package.json` for existing deps/exports.

  **Implement**:
  - Add `@anthropic-ai/sdk` to `packages/podcast/package.json` dependencies
  - Add `@ai-digest/agents` to dependencies (for prompt builder + model registry)
  - Add sub-path export: `"./script-generator": "./src/script-generator.ts"`
  - Export from `packages/podcast/src/index.ts`
  - Run `pnpm install`

  **Validate**: `pnpm check-types` passes across entire monorepo.

- [ ] **T1.4 Wire Into Processor** `[activity: backend]` `[component: web]`

  **Prime**: Read `apps/web/src/lib/processors/podcast.ts` lines 218-277 (current script generation).

  **Implement**: Modify `apps/web/src/lib/processors/podcast.ts`:
  - Import `generateScriptWithTools` from `@ai-digest/podcast/script-generator`
  - Replace Stage 2 (lines 218-277) entirely:
    - Remove `client.messages.create()` single call
    - Call `generateScriptWithTools()` with stories, target, model, style, apiKey
    - Pass `onProgress` callback that calls `log.emit("script_gen", ...)`
    - Use returned `segments` (already parsed, no need for `parseScript`)
    - Use returned `cost` for budget tracking
  - Remove `useAgentMode` conditional — all durations use tool loop
  - Update script preview storage and prompt storage

  **Validate**: TypeScript passes. Processor compiles with new imports.

- [ ] **T1.5 Phase 1 Validation — Deploy & Test 3 Podcasts** `[activity: validate]`

  **Implement**:
  - Commit and deploy to Vercel
  - Generate 3 podcasts via API:
    1. 15-minute podcast (last 7 days)
    2. 30-minute podcast (last 7 days)
    3. 60-minute podcast (last month)
  - For each, verify:
    - Duration within 90-115% of target
    - All 6 stages complete (ready status)
    - Cost breakdown logged
    - Transcript matches audio
  - Capture evidence: episode IDs, durations, costs, DB queries

  **Validate**: All 3 podcasts have `status = 'ready'` and `duration_seconds` within 10% of target.

---

## Phase 2: User Self-Serve Generation `[ref: SDD/Section new]`

Enable authenticated (non-admin) users to generate podcasts with their own configurations.

- [ ] **T2.1 User Generation API Route** `[activity: backend-api]` `[component: web]`

  **Prime**: Read `apps/web/src/app/api/admin/podcast/generate/route.ts` for existing admin-only route. Read middleware auth flow.

  **Implement**: Create `apps/web/src/app/api/podcasts/generate/route.ts`:
  - Require authenticated user (Supabase session, NOT admin required)
  - Accept same body schema as admin route but with defaults:
    - Duration: 5-30 min only (no 45/60 for free users)
    - Model: Haiku only (cheapest)
    - Style: user choice from presets (no custom prompt)
    - Voice: default voices only (no custom voice config)
  - Rate limit: 3 generations per day per user (check `episodes` table)
  - Cost cap: $2 per generation (enforced via `maxBudgetUsd`)
  - Create episode with `userId` field (requires schema migration)
  - Run `processPodcastInline()` synchronously
  - Return `{ episodeId, status }`
  - `export const maxDuration = 800;`

  **Validate**: TypeScript passes. Route responds 401 for unauthenticated, 429 for rate-limited.

- [ ] **T2.2 Episodes Schema: Add userId** `[activity: database]` `[component: db]`

  **Prime**: Read `packages/db/src/schema/episodes.ts` for current schema.

  **Implement**:
  - Add `userId` column to episodes table (nullable UUID, references auth.users)
  - Add index on `userId` for query performance
  - Update Drizzle schema and push migration
  - Update `queries.getEpisodes()` to support filtering by userId
  - Add `queries.getUserEpisodeCount(userId, since)` for rate limiting

  **Validate**: Migration applies cleanly. Existing episodes unaffected (userId = null for admin-created).

- [ ] **T2.3 User Podcast Dashboard Page** `[activity: frontend]` `[component: web]`

  **Prime**: Read `apps/web/src/app/podcasts/page.tsx` for current public listing. Read admin config panel for UI patterns.

  **Implement**: Create `apps/web/src/app/podcasts/generate/page.tsx`:
  - Gate behind authentication (redirect to /login if not signed in)
  - Simplified config panel:
    - Date range picker (last day / last week / last month presets)
    - Duration selector (5, 10, 15, 20, 25, 30 min)
    - Style selector (professional, conversational, educational)
    - Cost estimate display (updates on config change)
    - "Generate" button with confirmation
  - Show remaining daily quota (e.g., "2 of 3 generations remaining today")
  - After generation starts: redirect to episode detail page with live streaming
  - Reuse existing components: `StageProgress`, `CostBreakdown`, `LogStream`

  **Validate**: Page renders for authenticated users. Shows login redirect for unauthenticated.

- [ ] **T2.4 User Episode History** `[activity: frontend]` `[component: web]`

  **Prime**: Read admin `job-history.tsx` and `episode-detail.tsx` for patterns.

  **Implement**: Create `apps/web/src/app/podcasts/my-episodes/page.tsx`:
  - Authenticated users only
  - List episodes created by current user (filter by userId)
  - Show: title, date, duration, status, cost
  - Click → navigate to existing public episode detail page
  - Replay button to re-generate with same settings

  **Validate**: Page shows only current user's episodes. Admin episodes not visible.

- [ ] **T2.5 Middleware Update for User Routes** `[activity: backend]` `[component: web]`

  **Prime**: Read `apps/web/src/middleware.ts` for current auth routing.

  **Implement**:
  - `/api/podcasts/generate` — require authenticated user (any role)
  - `/podcasts/generate` — require authenticated user
  - `/podcasts/my-episodes` — require authenticated user
  - Keep existing admin routes unchanged

  **Validate**: Unauthenticated access returns 401/redirect. Authenticated non-admin can access user routes.

- [ ] **T2.6 Phase 2 Validation — User Self-Serve Flow** `[activity: validate]`

  **Implement**:
  - Deploy to Vercel
  - Register a test user (non-admin) via the app
  - Navigate to /podcasts/generate
  - Configure and generate a 15-minute podcast
  - Verify:
    - Generation starts and streams progress
    - Episode appears in /podcasts/my-episodes
    - Episode plays on public /podcasts/[id] page
    - Cost is tracked
    - Rate limit enforced (try 4th generation, expect rejection)
  - Capture screenshots as evidence

  **Validate**: Full user flow works end-to-end. Rate limiting enforced. Cost visible.

---

## Phase 3: Cost Transparency & Polish `[ref: SDD/Section 4]`

Make costs, prompts, and generation details visible and transparent everywhere.

- [ ] **T3.1 Generation Cost Display in User UI** `[activity: frontend]` `[component: web]` `[parallel: true]`

  **Prime**: Read admin `cost-breakdown.tsx` and `cost-estimate` API for patterns.

  **Implement**:
  - Add cost estimate API call to user generate page (reuse `/api/admin/podcast/cost-estimate` or create public variant)
  - Show estimated cost before generation: "This will cost approximately $0.52"
  - Show actual cost after generation on episode detail page
  - Display per-turn cost breakdown if available in episode metadata

  **Validate**: Cost estimate shows before generation. Actual cost shows after.

- [ ] **T3.2 Prompt Transparency** `[activity: frontend]` `[component: web]` `[parallel: true]`

  **Prime**: Read admin `episode-detail.tsx` prompt viewer section.

  **Implement**:
  - On episode detail page (both admin and public), show:
    - System prompt used (collapsible)
    - Number of tool loop turns
    - Total input/output tokens
    - Prompt caching stats (cache hits vs misses)
  - Make this available for user-generated episodes too (not just admin)

  **Validate**: Prompt details visible on episode page. Token counts match API response.

- [ ] **T3.3 Duration Accuracy Badge** `[activity: frontend]` `[component: web]` `[parallel: true]`

  **Prime**: Read episode card and detail components.

  **Implement**:
  - Show target vs actual duration on episode cards and detail pages
  - Color-coded badge:
    - Green: 90-110% of target
    - Yellow: 80-90% or 110-120%
    - Red: <80% or >120%
  - Format: "30:00 target → 28:42 actual (96%)"

  **Validate**: Badge appears with correct color coding on all episodes.

- [ ] **T3.4 Phase 3 Validation** `[activity: validate]`

  **Implement**:
  - Deploy and verify all transparency features
  - Check cost estimate matches actual within 20%
  - Check prompts are visible
  - Check duration badge colors are correct
  - Take screenshots of the complete flow

  **Validate**: All transparency features render correctly with production data.

---

## Dependency Graph

```
T1.1 ─→ T1.3 ─→ T1.4 ─→ T1.5
T1.2 ─↗
                         ↓
T2.2 ─→ T2.1 ─→ T2.3 ─→ T2.6
         T2.5 ─↗ T2.4 ─↗
                         ↓
         T3.1 ─→ T3.4
         T3.2 ─↗
         T3.3 ─↗
```

Phase 1 must complete before Phase 2 (user generation depends on working tool loop).
Phase 2 must complete before Phase 3 (transparency applies to user-generated episodes).
T3.1, T3.2, T3.3 are parallel within Phase 3.

## Validation

- [ ] Build and run actual application
- [ ] Test through user interface (admin + user flows)
- [ ] Capture screenshots/output as evidence
- [ ] Verify evidence shows expected behavior
- [ ] Duration accuracy: 3 test episodes within 90-115% of target
- [ ] User self-serve: non-admin can generate, view, replay
- [ ] Cost transparency: estimates + actuals visible
