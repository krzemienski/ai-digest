---
title: "Podcast Time Windows, Source Expansion & AI Discovery"
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
2. **During Implementation**: Follow existing codebase patterns (Drizzle schema, Next.js API routes, BullMQ processors)
3. **After Each Task**: Run `tsc --noEmit` on affected packages + functional validation (cURL / psql / Playwright)
4. **Phase Completion**: Verify all phase acceptance criteria are met via real system behavior

### Deviation Protocol

When implementation requires changes from the specification:
1. Document the deviation with clear rationale
2. Obtain approval before proceeding
3. Update SDD when the deviation improves the design
4. Record all deviations in this plan for traceability

### Functional Validation Mandate

**Per project constitution**: No mocks, no unit tests, no test doubles. All validation is functional:
- **Backend**: cURL requests against running server, psql queries against real DB
- **Frontend**: Playwright MCP browser automation with screenshots
- **Pipeline**: Real pipeline runs with real sources, real API calls
- **TTS**: Real ElevenLabs API calls (cost applies)

## Metadata Reference

- `[parallel: true]` - Tasks that can run concurrently
- `[component: name]` - Package/app affected
- `[ref: document/section]` - Links to specifications
- `[activity: type]` - Activity hint for specialist agent selection

---

## Context Priming

*GATE: Read all files in this section before starting any implementation.*

**Specification**:

- `docs/specs/002-podcast-sources-timewindow/product-requirements.md` - PRD (4 Must Have, 2 Should Have features)
- `docs/specs/002-podcast-sources-timewindow/solution-design.md` - SDD (architecture, APIs, schema, ADRs)

**Key Design Decisions**:

- **ADR-1**: Time window queries `normalized_items.published_at` directly — bypass digest_items join
- **ADR-2**: API keys in existing `config` table with AES-256-GCM — no new table
- **ADR-3**: Discovery agent as BullMQ job — prevents HTTP timeouts, enables SSE progress
- **ADR-4**: Seed sources expanded in code (`seed-sources.ts`) — version-controlled, idempotent seed
- **ADR-5**: Worker reads API keys from DB first, falls back to env vars — backwards-compatible

**Implementation Context**:

```bash
# Development
pnpm install                              # Install all deps
pnpm dev                                  # Start all apps (turborepo)
pnpm --filter web run dev -- --port 3001  # Web only
pnpm --filter worker run dev              # Worker only
pkill -f "tsx.*src/index"                 # Kill zombie workers

# Quality
pnpm -r exec tsc --noEmit                # Type-check all packages
pnpm build                                # Full build

# Database
pnpm --filter @ai-digest/db run push     # Apply schema changes (drizzle-kit push)

# Functional Validation
curl -s http://localhost:3001/api/admin/... | jq .   # Backend API
psql ai_digest_dev -c "SELECT ..."                    # DB queries
# Playwright MCP for UI validation
```

---

## Implementation Phases

Each task follows: **Prime** (read specs), **Test** (define expected behavior), **Implement** (build it), **Validate** (prove it works functionally).

> **Tracking Principle**: Track logical units that produce verifiable outcomes. The functional validation is the method, not a separate tracked item.

---

### Phase 1: Schema & Type Foundation

Establishes database schema changes and shared type definitions required by all subsequent phases.

- [ ] **T1.1 Extend episodes schema for time window** `[component: packages/db]` `[activity: data-architecture]`

  1. Prime: Read SDD Data Storage Changes (episodes table modifications) `[ref: SDD/Data Storage Changes]`
  2. Test: After schema push, verify via psql: `\d episodes` shows nullable `digest_id`, new `date_range_start`, `date_range_end` columns
  3. Implement:
     - Modify `packages/db/src/schema/episodes.ts`: change `digestId` to `.references(() => digests.id)` (remove `.notNull()`), add `dateRangeStart` and `dateRangeEnd` timestamp columns (nullable)
     - Run `drizzle-kit push`
     - Apply CHECK constraint via raw SQL: `ALTER TABLE episodes ADD CONSTRAINT episodes_content_source_check CHECK (digest_id IS NOT NULL OR (date_range_start IS NOT NULL AND date_range_end IS NOT NULL));`
  4. Validate: `tsc --noEmit` on packages/db; psql `\d episodes` shows correct schema; existing episodes still have valid `digest_id`
  5. Success: Episodes table supports both digest-based and date-range-based podcast generation `[ref: PRD/Feature 1, AC-1.2]`

- [ ] **T1.2 Create discovery_runs schema** `[component: packages/db]` `[activity: data-architecture]`

  1. Prime: Read SDD Data Storage Changes (discovery_runs table) `[ref: SDD/Data Storage Changes]`
  2. Test: After schema push, verify via psql: `\d discovery_runs` shows all columns
  3. Implement:
     - Create `packages/db/src/schema/discovery-runs.ts` with id, status, topics, source_types, max_sources, candidates (jsonb), added_source_ids, error, started_at, completed_at, created_at
     - Export from `packages/db/src/schema/index.ts`
  4. Validate: `tsc --noEmit`; `drizzle-kit push` succeeds; psql confirms table
  5. Success: Discovery runs table created and accessible via Drizzle ORM `[ref: PRD/Feature 3]`

- [ ] **T1.3 Extend shared types** `[component: packages/shared]` `[activity: type-definitions]`

  1. Prime: Read SDD Application Data Models `[ref: SDD/Application Data Models]`
  2. Test: After changes, `tsc --noEmit` on packages/shared, packages/db, apps/worker, apps/web all pass
  3. Implement:
     - Modify `packages/shared/src/types/podcast.ts`: make `digestId` in `PodcastGenerationConfig` optional (`string | null`), add `dateRange: { start: string; end: string } | null`
     - Create `packages/shared/src/types/discovery.ts` with `DiscoveryRun`, `DiscoveryCandidate`, `DiscoveryStatus` types
     - Export from `packages/shared/src/types/index.ts`
  4. Validate: Full `tsc --noEmit` across all packages. Fix any type errors caused by `digestId` becoming nullable.
  5. Success: All type definitions match SDD data models; no type errors across monorepo `[ref: SDD/Application Data Models]`

- [ ] **T1.4 Create crypto module** `[component: packages/db]` `[activity: security]`

  1. Prime: Read SDD API Key Encryption example `[ref: SDD/Implementation Examples: API Key Encryption]`
  2. Test: After implementation, encrypt a test string, decrypt it, verify round-trip. Use node REPL or a quick script.
  3. Implement:
     - Create `packages/db/src/crypto.ts` with `encryptApiKey(plaintext)` and `decryptApiKey(token)` using AES-256-GCM
     - Reads `API_KEY_ENCRYPTION_SECRET` from env (32-byte hex)
     - Error if env var missing
  4. Validate: `tsc --noEmit`; run `node -e "..."` to test encrypt/decrypt round-trip
  5. Success: Encrypt → decrypt round-trip works; error thrown when env var missing `[ref: PRD/Feature 4, AC-4.2]`

- [ ] **T1.5 Phase Validation** `[activity: validate]`

  - `tsc --noEmit` across all packages. `pnpm build` succeeds. psql shows correct schema. Existing features unaffected (start web app, visit admin dashboard).

---

### Phase 2: Query Layer & Seed Data

Builds query functions and expands seed sources. No API routes yet — just the data access layer.

- [ ] **T2.1 Add normalized items date range query** `[component: packages/db]` `[activity: data-access]`

  1. Prime: Read SDD content selection example `[ref: SDD/Implementation Examples: Time Window Content Selection]`
  2. Test: After implementation, use psql or a script to call `getItemsByDateRange(db, start, end)` and verify results match `WHERE published_at BETWEEN start AND end`
  3. Implement:
     - Create or modify `packages/db/src/queries/normalized-items.ts` with `getItemsByDateRange(db, start, end, limit?)` and `getItemCountByDateRange(db, start, end)` functions
     - Must re-export `lte` from drizzle-orm in `packages/db/src/index.ts` if not already
  4. Validate: `tsc --noEmit`; query returns correct items for known date ranges in current DB
  5. Success: Date range query returns scored, non-duplicate items ordered by compositeScore `[ref: PRD/Feature 1, AC-1.2]`

- [ ] **T2.2 Add source bulk operations** `[component: packages/db]` `[activity: data-access]`

  1. Prime: Read SDD bulk import spec and sources query module `[ref: SDD/Internal API Changes: Bulk Import]`
  2. Test: After implementation, bulk insert 3 test sources via script, verify in psql. Insert same 3 again, verify duplicates skipped.
  3. Implement:
     - Add `bulkCreateSources(db, sources[], options?)` to `packages/db/src/queries/sources.ts`
     - Duplicate detection by `type` + config URL/query (normalize before comparison)
     - Return `{ added: number, skipped: number, errors: string[] }`
  4. Validate: `tsc --noEmit`; bulk create idempotent (second run skips duplicates)
  5. Success: Bulk insert handles duplicates gracefully `[ref: PRD/Feature 5, AC-5.2]`

- [ ] **T2.3 Add API key queries with encryption** `[component: packages/db]` `[activity: data-access]` `[activity: security]`

  1. Prime: Read SDD ADR-2 and crypto module `[ref: SDD/ADR-2]`
  2. Test: Set API_KEY_ENCRYPTION_SECRET env, call setApiKey, then getApiKey — verify round-trip. Call getApiKeyMasked — verify only last 4 chars returned.
  3. Implement:
     - Add `setApiKey(db, provider, key)`, `getApiKey(db, provider)`, `getApiKeyMasked(db, provider)` to `packages/db/src/queries/config.ts`
     - Uses crypto.ts for encrypt/decrypt
     - Stores as config key `apiKey:anthropic` or `apiKey:elevenlabs`
  4. Validate: `tsc --noEmit`; round-trip works; masked output shows only `****...last4`
  5. Success: API keys encrypted at rest, maskable for UI, decryptable for worker use `[ref: PRD/Feature 4, AC-4.2, AC-4.5]`

- [ ] **T2.4 Add discovery run queries** `[component: packages/db]` `[activity: data-access]`

  1. Prime: Read discovery_runs schema from T1.2 `[ref: SDD/Data Storage Changes: discovery_runs]`
  2. Test: Create a discovery run, update its status and candidates, verify via psql
  3. Implement:
     - Create `packages/db/src/queries/discovery.ts` with `createDiscoveryRun`, `updateDiscoveryRun`, `getDiscoveryRun`
     - Export from `packages/db/src/queries/index.ts`
  4. Validate: `tsc --noEmit`; CRUD operations work against real DB
  5. Success: Discovery runs can be created, updated, and retrieved `[ref: PRD/Feature 3]`

- [ ] **T2.5 Expand seed sources to 55+** `[component: packages/shared]` `[activity: content-data]`

  1. Prime: Read existing seed-sources.ts (21 sources) and PRD Feature 2 requirements `[ref: PRD/Feature 2, AC-2.2]`
  2. Test: After expansion, count sources in seed file. Verify all 7 fetcher types represented. Run seed script against DB, verify >50 in sources table.
  3. Implement:
     - Expand `packages/shared/src/seed-sources.ts` with 35+ additional sources:
       - RSS: NVIDIA AI Blog, Apple ML, Wired AI, IEEE Spectrum AI, BAIR, Stanford HAI, fast.ai, Distill.pub, Hugging Face Blog, LangChain Blog, LlamaIndex Blog, Weights & Biases Blog, Scale AI Blog, Cohere Blog
       - Reddit: r/artificial, r/deeplearning, r/OpenAI, r/StableDiffusion, r/Singularity
       - GitHub: topic:deep-learning, topic:natural-language-processing, topic:computer-vision
       - ArXiv: cs.RO (robotics), cs.MA (multi-agent), stat.ML
       - HuggingFace: additional task filters
     - Update or create seed script to use `bulkCreateSources` from T2.2
  4. Validate: Count in seed file >=55. Seed script inserts without errors. `psql -c "SELECT count(*) FROM sources"` shows >=50.
  5. Success: >=50 sources across all 7 fetcher types in the database `[ref: PRD/Feature 2, AC-2.1, AC-2.2]`

- [ ] **T2.6 Phase Validation** `[activity: validate]`

  - `tsc --noEmit` across all packages. `pnpm build` succeeds. All query functions work against real DB. 50+ sources seeded. Existing features still work.

---

### Phase 3: Backend API Routes

Builds all new and modified API endpoints. Depends on Phase 2 query layer.

- [ ] **T3.1 Modify podcast generate endpoint for time window** `[component: apps/web]` `[activity: backend-api]`

  1. Prime: Read SDD generate endpoint spec and current route `[ref: SDD/Internal API Changes: Generate Podcast]`
  2. Test: cURL POST with `dateRange` field → job enqueued. cURL POST without `dateRange` or `digestId` → 400 error. cURL POST with both → 400 error.
  3. Implement:
     - Modify `apps/web/src/app/api/admin/podcast/generate/route.ts`: Zod schema accepts optional `dateRange: { start: string, end: string }`, optional `digestId`. Validate XOR constraint. Create episode with date range columns. Pass `dateRange` in BullMQ job data.
  4. Validate: `tsc --noEmit`; cURL tests pass for all 3 cases (dateRange only, digestId only, neither → error)
  5. Success: Podcast generation accepts date range as content source `[ref: PRD/Feature 1, AC-1.2, AC-1.3]`

- [ ] **T3.2 Create item count endpoint** `[parallel: true]` `[component: apps/web]` `[activity: backend-api]`

  1. Prime: Read SDD item count endpoint spec `[ref: SDD/Internal API Changes: Item Count]`
  2. Test: cURL `GET /api/admin/podcast/item-count?start=2026-02-01&end=2026-02-08` → returns `{ itemCount: N, sourceCount: N }`
  3. Implement:
     - Create `apps/web/src/app/api/admin/podcast/item-count/route.ts` with GET handler
     - Uses `getItemCountByDateRange` from T2.1
     - Also counts distinct sources in range
  4. Validate: `tsc --noEmit`; cURL returns correct counts matching psql query
  5. Success: Live item count available for UI `[ref: PRD/Feature 1, AC-1.1]`

- [ ] **T3.3 Create bulk import/export endpoints** `[parallel: true]` `[component: apps/web]` `[activity: backend-api]`

  1. Prime: Read SDD bulk import and export specs `[ref: SDD/Internal API Changes: Bulk Import, Export]`
  2. Test: cURL POST `/api/admin/sources/bulk` with JSON array → sources added. cURL GET `/api/admin/sources/export` → JSON file downloaded.
  3. Implement:
     - Create `apps/web/src/app/api/admin/sources/bulk/route.ts` (POST with Zod validation, uses `bulkCreateSources`)
     - Create `apps/web/src/app/api/admin/sources/export/route.ts` (GET with Content-Disposition header)
  4. Validate: `tsc --noEmit`; round-trip: export → import → verify no duplicates added
  5. Success: Sources can be bulk imported and exported as JSON `[ref: PRD/Feature 5, AC-5.1, AC-5.2]`

- [ ] **T3.4 Create API key management endpoints** `[parallel: true]` `[component: apps/web]` `[activity: backend-api]` `[activity: security]`

  1. Prime: Read SDD API key endpoints `[ref: SDD/Internal API Changes: API Keys]`
  2. Test: cURL PUT with key → stored. cURL GET → shows masked. cURL POST test → validates against real API.
  3. Implement:
     - Create `apps/web/src/app/api/admin/config/api-keys/route.ts` (GET returns masked, PUT stores encrypted)
     - Create `apps/web/src/app/api/admin/config/api-keys/test/route.ts` (POST tests key validity: Anthropic → messages.create with 1 token, ElevenLabs → GET /v1/voices)
  4. Validate: `tsc --noEmit`; cURL tests for all operations; keys never appear in logs
  5. Success: API keys manageable via UI, encrypted at rest, testable `[ref: PRD/Feature 4, AC-4.1 through AC-4.5]`

- [ ] **T3.5 Create discovery endpoints** `[component: apps/web]` `[activity: backend-api]`

  1. Prime: Read SDD discovery trigger, results, and add endpoints `[ref: SDD/Internal API Changes: Discovery]`
  2. Test: cURL POST `/api/admin/sources/discover` → returns `{ runId }`. cURL GET with runId → returns run with status. cURL POST `/discover/add` → adds sources.
  3. Implement:
     - Create `apps/web/src/app/api/admin/sources/discover/route.ts` (POST creates run + enqueues job, GET returns run by runId)
     - Create `apps/web/src/app/api/admin/sources/discover/add/route.ts` (POST adds selected candidates)
  4. Validate: `tsc --noEmit`; cURL tests (discovery job creation may fail until Phase 4 builds the processor — that's expected, verify job is enqueued in Redis)
  5. Success: Discovery API CRUD works; job enqueued `[ref: PRD/Feature 3, AC-3.1]`

- [ ] **T3.6 Phase Validation** `[activity: validate]`

  - `tsc --noEmit` on apps/web. `pnpm build` succeeds. All new endpoints respond correctly to cURL. Existing endpoints unchanged. Start web app, verify admin dashboard still loads.

---

### Phase 4: Worker Processors

Modifies podcast processor for time window and adds discovery agent processor.

- [ ] **T4.1 Modify podcast processor for date range content selection** `[component: apps/worker]` `[activity: backend-logic]`

  1. Prime: Read SDD time window content selection example and current podcast.ts `[ref: SDD/Implementation Examples: Time Window Content Selection]`
  2. Test: Submit a podcast job with `dateRange` field via BullMQ script. Verify worker selects items from that date range (check logs via SSE or podcast_logs table).
  3. Implement:
     - Modify `apps/worker/src/processors/podcast.ts`:
       - Update `PodcastJobData` interface: `digestId` becomes optional, add `dateRange?: { start: string; end: string }`
       - Add `lte` to drizzle-orm imports
       - Modify content selection: if `dateRange` present, query by `published_at` range; else keep existing behavior
       - Update episode creation to use `dateRangeStart`/`dateRangeEnd` columns
  4. Validate: `tsc --noEmit`; submit test job with dateRange; worker completes content_select stage with correct items
  5. Success: Podcast processor supports date range content selection alongside existing mode `[ref: PRD/Feature 1, AC-1.2, AC-1.4]`

- [ ] **T4.2 Implement API key resolution in worker** `[component: apps/worker]` `[activity: backend-logic]` `[activity: security]`

  1. Prime: Read SDD ADR-5 (DB-first, env fallback) `[ref: SDD/ADR-5]`
  2. Test: Set API key in DB via psql. Remove env var. Start worker, trigger job — verify it uses DB key. Remove DB key, restore env var — verify fallback works.
  3. Implement:
     - Create `apps/worker/src/lib/api-keys.ts` with `resolveApiKey(provider: "anthropic" | "elevenlabs")` that checks DB first, falls back to env
     - Update podcast processor and pipeline processor to use `resolveApiKey` instead of direct `process.env` access
  4. Validate: Both paths tested functionally; `tsc --noEmit`
  5. Success: Worker uses DB keys when available, env vars as fallback `[ref: PRD/Feature 4, AC-4.4]`

- [ ] **T4.3 Create discovery agent** `[component: packages/agents]` `[activity: ai-agent]`

  1. Prime: Read SDD discovery agent tool schema `[ref: SDD/Implementation Examples: Discovery Agent Tool Use]`
  2. Test: Run agent with topics ["machine learning"], verify it returns candidates with validation status
  3. Implement:
     - Create `packages/agents/src/discovery/agent.ts` with Anthropic `tool_use` loop:
       - `web_search` tool: uses fetch to hit a search API or curated source lists
       - `search_rss_feeds` tool: probes common feed paths on given domains
       - `validate_source` tool: fetch URL, check HTTP status, parse feed for last update date
       - `submit_candidate` tool: adds to candidates array
     - Create `packages/agents/src/discovery/validators.ts` for source validation logic
     - 5-minute timeout with partial result saving
  4. Validate: Agent discovers at least 5 sources for "machine learning" topic; validates reachability
  5. Success: Discovery agent finds and validates sources using Anthropic tool_use `[ref: PRD/Feature 3, AC-3.2, AC-3.3]`

- [ ] **T4.4 Create discovery BullMQ processor** `[component: apps/worker]` `[activity: backend-logic]`

  1. Prime: Read SDD runtime flow for discovery `[ref: SDD/Runtime View: AI Source Discovery]`
  2. Test: Enqueue a discovery job via script. Verify worker picks it up, runs agent, updates discovery_run in DB.
  3. Implement:
     - Create `apps/worker/src/processors/discovery.ts` with BullMQ processor
     - Register `discovery` queue in `apps/worker/src/index.ts`
     - Streams progress via Redis Pub/Sub (same pattern as podcast)
     - Updates discovery_run status and candidates in DB
  4. Validate: End-to-end: enqueue job → agent runs → candidates saved to DB → verify via psql
  5. Success: Discovery runs as async BullMQ job with progress streaming `[ref: PRD/Feature 3, AC-3.2]`

- [ ] **T4.5 Phase Validation** `[activity: validate]`

  - `tsc --noEmit` on apps/worker and packages/agents. Worker starts without errors. Podcast job with dateRange completes. Discovery job completes and saves candidates.

---

### Phase 5: Frontend UI Components

Builds all new UI components and modifies existing pages. Depends on Phase 3 API routes.

- [ ] **T5.1 Time window picker component** `[component: apps/web]` `[activity: frontend-ui]`

  1. Prime: Read SDD UI wireframe for time window selector `[ref: SDD/User Interface & UX: Time Window Selector]`
  2. Test: Playwright MCP: navigate to podcast dashboard, verify time window selector visible with 5 presets (24h, 3d, 7d, 14d, Custom). Select each, verify item count updates. Screenshot.
  3. Implement:
     - Create `apps/web/src/app/admin/podcast/components/time-window-picker.tsx` with preset buttons and custom date range pickers
     - Calls `GET /api/admin/podcast/item-count` on selection change
     - Shows live count: "~N items from M sources available"
  4. Validate: Screenshot shows correct UI; item count updates on selection; custom range shows date pickers
  5. Success: Admin can select content time window with live feedback `[ref: PRD/Feature 1, AC-1.1]`

- [ ] **T5.2 Integrate time window into config panel** `[component: apps/web]` `[activity: frontend-ui]`

  1. Prime: Read current config-panel.tsx and generation flow `[ref: SDD/Building Block View: config-panel.tsx]`
  2. Test: Playwright MCP: select "Last 7 days", configure 30-min Professional, click Generate → verify job submitted with dateRange (check API response / episode in DB)
  3. Implement:
     - Modify `apps/web/src/app/admin/podcast/components/config-panel.tsx`:
       - Add TimeWindowPicker above duration selector
       - Send `dateRange` instead of `digestId` when time window selected
       - Handle "no items" state (disable Generate, show warning)
  4. Validate: Full generation flow works via UI; screenshot of generation in progress
  5. Success: Podcast generation uses date range from UI `[ref: PRD/Feature 1, AC-1.2 through AC-1.5]`

- [ ] **T5.3 Source health indicators** `[parallel: true]` `[component: apps/web]` `[activity: frontend-ui]`

  1. Prime: Read SDD source health wireframe `[ref: SDD/User Interface & UX: Source Health Indicators]`
  2. Test: Playwright MCP: navigate to Sources page, verify health dots (green/yellow/red) next to each source. Hover shows tooltip with error details.
  3. Implement:
     - Create `apps/web/src/app/admin/sources/components/source-health.tsx` with color-coded health dot
     - Modify `apps/web/src/app/admin/sources/page.tsx` to show health indicators in source table
     - Colors: green (0 errors), yellow (1-2), red (3+)
     - Tooltip shows `lastFetchError` and `lastFetchAt`
  4. Validate: Screenshots show health indicators; tooltips visible on hover
  5. Success: Source health visible at a glance `[ref: PRD/Feature 6, AC-6.1, AC-6.2]`

- [ ] **T5.4 Discovery modal** `[parallel: true]` `[component: apps/web]` `[activity: frontend-ui]`

  1. Prime: Read SDD discovery flow and wireframe `[ref: SDD/Runtime View: AI Source Discovery]`
  2. Test: Playwright MCP: click "Discover Sources" → modal opens. Enter topics, set max sources, click Start → shows progress. Results appear with toggle switches. Add selected → sources appear in table.
  3. Implement:
     - Create `apps/web/src/app/admin/sources/components/discovery-modal.tsx`:
       - Topic input (comma-separated), source type checkboxes, max sources slider (10-50)
       - Shows estimated cost before starting
       - Progress via SSE from `discovery:logs:<runId>` channel
       - Results table with name, type, URL, validation status, duplicate flag, toggle
       - "Add Selected" button calls POST `/discover/add`
     - Add "Discover Sources" button to sources page
  4. Validate: Full discovery flow tested via Playwright with screenshots at each step
  5. Success: Admin can discover, review, and add new sources via AI `[ref: PRD/Feature 3, AC-3.1 through AC-3.5]`

- [ ] **T5.5 Import/Export UI** `[parallel: true]` `[component: apps/web]` `[activity: frontend-ui]`

  1. Prime: Read SDD bulk import/export spec `[ref: SDD/Internal API Changes: Bulk Import, Export]`
  2. Test: Playwright MCP: click "Export" → JSON file downloads. Upload JSON → summary shows "X added, Y skipped". Screenshot.
  3. Implement:
     - Create `apps/web/src/app/admin/sources/components/import-export.tsx`:
       - Export button triggers `/api/admin/sources/export` download
       - Import button opens file picker, uploads to `/api/admin/sources/bulk`
       - Shows result summary
     - Add to sources page
  4. Validate: Round-trip: export → import → no duplicates
  5. Success: Sources can be shared between instances `[ref: PRD/Feature 5, AC-5.1, AC-5.2]`

- [ ] **T5.6 API Key Management UI** `[component: apps/web]` `[activity: frontend-ui]`

  1. Prime: Read SDD API keys wireframe `[ref: SDD/User Interface & UX: API Keys Section]`
  2. Test: Playwright MCP: navigate to Config page. See API Keys section. Enter key → masked display. Click Test → shows valid/invalid. Screenshot.
  3. Implement:
     - Modify `apps/web/src/app/admin/config/page.tsx`:
       - Add "API Keys" section with fields for Anthropic and ElevenLabs
       - Masked display (last 4 chars)
       - Test button validates key
       - Save button stores encrypted
  4. Validate: Screenshots show masked keys, test results, save confirmation
  5. Success: API keys manageable entirely through UI `[ref: PRD/Feature 4, AC-4.1, AC-4.3, AC-4.5]`

- [ ] **T5.7 Phase Validation** `[activity: validate]`

  - `tsc --noEmit` on apps/web. `pnpm build` succeeds. All UI components render correctly. Playwright screenshot tour of all new features.

---

### Phase 6: Integration & End-to-End Validation

Full system validation ensuring all components work together. Real pipeline runs, real podcast generation, real API calls.

- [x] **T6.1 Full pipeline run with 50+ sources** `[activity: integration-test]`

  1. Trigger full pipeline via admin dashboard (or cURL POST `/api/admin/pipeline/trigger`)
  2. Wait for completion (check pipeline status endpoint)
  3. Verify: `psql -c "SELECT count(*) FROM normalized_items"` shows >=200 items
  4. Verify: `psql -c "SELECT count(*) FROM sources WHERE last_fetch_at IS NOT NULL"` shows most sources fetched
  5. Screenshot pipeline status page
  6. Success: Pipeline ingests from 50+ sources, producing >=200 items `[ref: PRD/Feature 2, AC-2.3, AC-2.4]`

- [x] **T6.2 Podcast generation with 7-day time window** `[activity: integration-test]`

  1. Via UI: select "Last 7 days", verify item count shows >=200
  2. Configure 30-min Professional podcast, click Generate
  3. Monitor via SSE stream (log streaming page)
  4. Wait for completion. Verify:
     - Episode in DB with `date_range_start`/`date_range_end` set
     - Audio URL populated
     - Script references items from multiple days and sources
  5. Play audio to verify quality
  6. Screenshot: generation complete page, episode detail
  7. Success: Weekly podcast generated from multi-day content `[ref: PRD/Feature 1, AC-1.2, AC-1.4]`

- [x] **T6.3 AI source discovery end-to-end** `[activity: integration-test]`

  1. Via UI: click "Discover Sources" → enter "robotics, autonomous vehicles" → set max 15 → Start
  2. Watch progress streaming in modal
  3. Verify candidates appear with validation status
  4. Toggle some off, click "Add Selected"
  5. Verify new sources appear in sources table
  6. Screenshot: discovery modal with results, sources page with new entries
  7. Success: Discovery finds, validates, and adds sources `[ref: PRD/Feature 3, AC-3.1 through AC-3.5]`

- [x] **T6.4 API key self-service end-to-end** `[activity: integration-test]`

  1. Via UI: navigate to Config → API Keys
  2. Enter a test API key, click Test → verify validation
  3. Save the key, verify masked display
  4. Trigger a pipeline run or podcast generation — verify worker uses DB key
  5. Screenshot: API key section with masked key and test result
  6. Success: API keys work end-to-end from UI to worker `[ref: PRD/Feature 4, AC-4.1 through AC-4.5]`

- [x] **T6.5 Edge case validation** `[activity: integration-test]`

  1. Time window with no items: Select custom range in the past with no data → verify Generate disabled, error message shown
  2. Time window with few items: Select narrow range → verify warning about few items
  3. Custom range with future end date → verify clamped to today
  4. Bulk import with duplicates → verify skipped count
  5. Discovery timeout: (if possible to simulate) → verify partial results shown
  6. Screenshot each edge case
  7. Success: All edge cases handled gracefully `[ref: PRD/Feature 1 Edge Cases; SDD/Error Handling]`

- [x] **T6.6 Quality Gates** `[activity: validate]`

  - Performance: Item count query <500ms for 7-day range with 50+ sources
  - Performance: Seed script completes in <5s
  - Security: API keys never visible in browser network tab (only masked)
  - Security: API keys not in worker logs or SSE streams
  - Build: `pnpm build` succeeds with zero errors
  - Types: `tsc --noEmit` across all packages passes

- [x] **T6.7 Specification Compliance** `[activity: business-acceptance]`

  - All PRD acceptance criteria verified with evidence (screenshots, cURL outputs, psql results)
  - Implementation follows SDD architecture (5 ADRs honored)
  - All new endpoints documented in SDD match actual implementation
  - Existing features (daily podcast gen, newsletter, admin dashboard) still work

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
