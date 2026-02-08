---
spec: finish-full-stack
phase: tasks
total_tasks: 48
created: 2026-02-08T00:00:00-05:00
---

# Tasks: Finish Full-Stack AI Digest Platform

> Phases 0-1 (Foundation + Auth) COMPLETE. Phase 2 (Theme) COMPLETE except email templates.
> Model IDs, Zod structured outputs, and prompt caching already implemented in pipeline stages.
> Starting from email templates, then pipeline execution, podcast fix, admin/consumer UI, validation.

---

## Phase 2: Theme Completion

- [x] 2.1 Update email templates to flat black zinc palette
  - **Do**:
    1. Update `packages/email/src/templates/digest-email.tsx`: bg `#09090B`, card bg `#18181B`, text `#FAFAFA`, links `#3B82F6`, secondary text `#A1A1AA`, borders `#3F3F46`
    2. Update `packages/email/src/templates/welcome-email.tsx`: same palette
    3. Remove any `#000000` pure black or old `#0a0a0a` references
  - **Files**:
    - `packages/email/src/templates/digest-email.tsx`
    - `packages/email/src/templates/welcome-email.tsx`
  - **Done when**: Both templates use zinc palette; grep confirms no `#000000` in templates
  - **Verify**: `grep -c "#09090B" /Users/nick/Desktop/ai-digest/packages/email/src/templates/digest-email.tsx && grep -c "#000000" /Users/nick/Desktop/ai-digest/packages/email/src/templates/digest-email.tsx /Users/nick/Desktop/ai-digest/packages/email/src/templates/welcome-email.tsx`
  - **Commit**: `feat(theme): update email templates to flat black zinc palette`
  - _Requirements: FR-2.6, AC-6.1.3_
  - _Design: Section 8.2_

- [x] 2.2 [VERIFY] Theme complete: zero cyber/neon + email palette + type-check
  - **Do**: Confirm entire theme migration is complete
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && grep -rc "cyber-\|neon-\|#000000" apps/web/src/ packages/email/src/ 2>/dev/null | grep -v ":0$" | wc -l && pnpm check-types 2>&1 | tail -5`
  - **Done when**: 0 matches; type-check passes
  - **Commit**: `chore(theme): pass theme completion checkpoint` (if fixes needed)

---

## Phase 3: Pipeline Enhancement & Real Execution

- [x] 3.1 Enhance coordinator with per-stage DB cost tracking writes
  - **Do**:
    1. Update `packages/agents/src/coordinator.ts`: ensure StageCallback.onStageComplete writes modelUsed, tokensInput, tokensOutput, costUsd to pipeline_stages table
    2. Update `apps/worker/src/processors/pipeline.ts`: provide callback implementations that use drizzle to insert/update pipeline_stages records with stage metadata (model, tokens, cost)
    3. Ensure each stage returns its tracking data (model, tokens, cost) -- verify categorize/score/dedup/synthesize already return these fields
  - **Files**:
    - `packages/agents/src/coordinator.ts`
    - `apps/worker/src/processors/pipeline.ts`
  - **Done when**: Pipeline stages DB records include modelUsed, tokensInput, tokensOutput, costUsd after a run
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm check-types 2>&1 | tail -5`
  - **Commit**: `feat(pipeline): write per-stage model/token/cost data to pipeline_stages table`
  - _Requirements: FR-4.3, AC-4.2.8_
  - _Design: Section 5.2_

- [x] 3.2 Clear seed data and run real pipeline end-to-end
  - **Do**:
    1. Clear seed data: `psql ai_digest_dev -c "TRUNCATE normalized_items, digest_items, digests, episodes, transcripts, pipeline_stages, pipeline_runs CASCADE;"`
    2. Verify Redis running: `redis-cli ping`
    3. Start worker: `cd /Users/nick/Desktop/ai-digest/apps/worker && npx tsx src/index.ts` (background)
    4. Start web: `cd /Users/nick/Desktop/ai-digest/apps/web && pnpm dev` (background)
    5. Login: `curl -s -c /tmp/ai-cookies.txt -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@digest.ai","password":"Admin123"}'`
    6. Trigger: `curl -s -b /tmp/ai-cookies.txt -X POST http://localhost:3000/api/admin/pipeline/trigger -H 'Content-Type: application/json' -d '{"triggerType":"manual"}'`
    7. Poll status until completed (may take 5-15 min)
    8. Verify real data in DB
  - **Files**: none (runtime verification)
  - **Done when**: pipeline_runs has status=completed; normalized_items has real items; digests has real synthesis text
  - **Verify**:
    ```bash
    psql ai_digest_dev -c "SELECT id, status, items_ingested, cost_usd FROM pipeline_runs WHERE status='completed' ORDER BY started_at DESC LIMIT 1;"
    psql ai_digest_dev -c "SELECT COUNT(*) AS real_items FROM normalized_items WHERE pipeline_run_id IS NOT NULL;"
    psql ai_digest_dev -c "SELECT id, LEFT(synthesis, 120) AS preview FROM digests ORDER BY created_at DESC LIMIT 1;"
    psql ai_digest_dev -c "SELECT stage_name, status, items_processed, model_used, cost_usd FROM pipeline_stages ORDER BY started_at DESC LIMIT 7;"
    ```
  - **Commit**: `feat(pipeline): complete first real end-to-end pipeline run with live data`
  - _Requirements: FR-4.4, US-11.3, AC-11.3.1 through AC-11.3.6_
  - _Design: Section 5_

- [x] 3.3 [VERIFY] Pipeline checkpoint: real data + type-check
  - **Do**: Verify pipeline produced real data and code compiles
  - **Verify**:
    ```bash
    cd /Users/nick/Desktop/ai-digest
    psql ai_digest_dev -c "SELECT COUNT(*) FROM normalized_items WHERE pipeline_run_id IS NOT NULL;" | grep -v "count\|---\|row"
    psql ai_digest_dev -c "SELECT COUNT(*) FROM digests;" | grep -v "count\|---\|row"
    pnpm check-types 2>&1 | tail -5
    ```
  - **Done when**: Items > 0; digests > 0; type-check passes
  - **Commit**: `chore(pipeline): pass real data quality checkpoint` (if fixes needed)

---

## Phase 4: Podcast Generation Fix

- [x] 4.1 Fix TTS request-id bug with raw fetch
  - **Do**:
    1. Rewrite `packages/podcast/src/tts.ts` `generateSegmentAudio()`:
       - Remove ElevenLabs SDK import (`const { ElevenLabsClient } = await import("elevenlabs")`)
       - Remove `collectStream` helper
       - Use raw `fetch()` to `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`
       - Headers: `xi-api-key: process.env.ELEVENLABS_API_KEY!`, `Content-Type: application/json`
       - Body: `{ text, model_id: "eleven_multilingual_v2", voice_settings: { stability, similarity_boost, style }, previous_request_ids: previousRequestIds.slice(-3) }`
       - Extract: `const requestId = response.headers.get("request-id") ?? \`fallback-${Date.now()}\``
       - Convert: `Buffer.from(await response.arrayBuffer())`
       - Add retry logic: 3 retries with exponential backoff for 429/500
    2. Remove `elevenlabs` from `packages/podcast/package.json` dependencies
    3. Run `pnpm install`
  - **Files**:
    - `packages/podcast/src/tts.ts`
    - `packages/podcast/package.json`
  - **Done when**: TTS uses raw fetch; requestId extracted from response header; no ElevenLabs SDK
  - **Verify**: `grep -c "request-id" /Users/nick/Desktop/ai-digest/packages/podcast/src/tts.ts && grep -c "ElevenLabsClient\|elevenlabs" /Users/nick/Desktop/ai-digest/packages/podcast/src/tts.ts /Users/nick/Desktop/ai-digest/packages/podcast/package.json`
  - **Commit**: `fix(podcast): use raw fetch for TTS to capture real request-id headers`
  - _Requirements: FR-5.5_
  - _Design: Section 6.4_

- [x] 4.2 Add podcast script + quality review Zod schemas
  - **Do**:
    1. Create `packages/agents/src/schemas/podcast-script.schema.ts`: PodcastScriptSchema with metadata (episodeDate, totalEstimatedDuration, topicsCovered, storyCount) and segments array (order, speaker enum ["Host A","Host B"], text, estimatedDuration, segmentType enum, relatedStoryTitles, emotion enum)
    2. Create `packages/agents/src/schemas/quality-review.schema.ts`: QualityReviewSchema with overallScore (number), naturalness, coverage, accuracy, engagement, pacing, transitions (all numbers), passed (boolean), feedback (string), segmentsToRevise array
    3. Export both from `packages/agents/src/index.ts`
  - **Files**:
    - `packages/agents/src/schemas/podcast-script.schema.ts` (CREATE)
    - `packages/agents/src/schemas/quality-review.schema.ts` (CREATE)
    - `packages/agents/src/index.ts` (MODIFY -- add exports)
  - **Done when**: Schemas compile; exported from package
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm check-types 2>&1 | tail -5`
  - **Commit**: `feat(podcast): add Zod schemas for script generation and quality review`
  - _Requirements: FR-5.3, FR-5.4_
  - _Design: Section 15.2_

- [x] 4.3 Create separate BullMQ podcast job with 6-stage progress tracking
  - **Do**:
    1. Create `apps/web/src/app/api/admin/podcast/generate/route.ts` POST:
       - Validate `{ digestId: z.string().uuid(), targetDurationMinutes: z.enum(["5","10","15","20"]) }`
       - Verify digest exists; check if episode already exists for digest (warn)
       - Create episode record: status "generating", podcastStages initialized (6 stages all "pending")
       - Add BullMQ "podcast" job with `{ episodeId, digestId, targetDurationMinutes }`
       - Return 201 `{ success: true, data: { episodeId } }`
    2. Create `apps/web/src/app/api/admin/podcast/status/route.ts` GET:
       - Return latest episode with status "generating" or most recent "ready", including podcastStages
    3. Update `apps/worker/src/index.ts`:
       - Import processPodcast
       - Add `const podcastQueue = new Queue("podcast", { connection })`
       - Add `const podcastWorker = new Worker("podcast", processPodcastJob, { connection, concurrency: 1 })`
    4. Rewrite `apps/worker/src/processors/podcast.ts`:
       - 6 stages: content_select, script_gen, quality_review, tts, assembly, upload
       - Each stage updates episodes.podcastStages jsonb in DB
       - Duration config: 5min=3 stories, 10min=5, 15min=7, 20min=9
       - Script gen uses Opus 4.5 + zodOutputFormat(PodcastScriptSchema)
       - Quality review uses Sonnet 4.5, pass >= 7/10, max 3 attempts
       - TTS uses updated generateAllSegments with real request-ids
       - Upload to S3, update episode audioUrl + status "ready"
       - Update default voices: Host A = Brian `nPczCjzI2devNBz1zQrb` (0.70/0.75/0.30), Host B = Sarah `EXAVITQu4vr4xnSDxMaL` (0.60/0.70/0.40)
  - **Files**:
    - `apps/web/src/app/api/admin/podcast/generate/route.ts` (CREATE)
    - `apps/web/src/app/api/admin/podcast/status/route.ts` (CREATE)
    - `apps/worker/src/index.ts` (MODIFY)
    - `apps/worker/src/processors/podcast.ts` (MODIFY)
  - **Done when**: POST generate creates episode + BullMQ job; worker runs 6 stages; GET status returns stage progress
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm check-types 2>&1 | tail -5`
  - **Commit**: `feat(podcast): add separate BullMQ job with 6-stage tracking and configurable duration`
  - _Requirements: FR-5.1, FR-5.2, FR-5.10, FR-5.11, US-5.1, US-5.2, US-5.3_
  - _Design: Section 6.1, 6.2, 6.3_

- [x] 4.4 Improve audio assembly (silence gaps, loudness normalization, ID3 metadata)
  - **Do**:
    1. Update `packages/podcast/src/assembler.ts`:
       - Between different speakers: generate 400ms silence via ffmpeg `anullsrc` and insert in concat list
       - After concat: two-pass EBU R128 loudness normalization targeting -16 LUFS using ffmpeg `loudnorm` filter
       - Add ID3v2 metadata: title "AI Digest - YYYY-MM-DD", artist "AI Digest Podcast", genre "Technology"
       - Change to mono: `-ac 1` (speech content, halves file size)
       - Keep 128kbps MP3, 44.1kHz sample rate
    2. Update `AssembleResult` to include loudness metadata
  - **Files**:
    - `packages/podcast/src/assembler.ts`
  - **Done when**: Assembler includes silence gaps between speakers, loudness normalization, ID3 tags, mono output
  - **Verify**: `grep -c "loudnorm\|LUFS\|metadata\|anullsrc" /Users/nick/Desktop/ai-digest/packages/podcast/src/assembler.ts`
  - **Commit**: `feat(podcast): add silence gaps, loudness normalization, ID3 metadata to assembler`
  - _Requirements: FR-5.6, NFR-5_
  - _Design: Section 6.6_

- [x] 4.5 [VERIFY] Podcast code quality checkpoint
  - **Do**: Type-check entire monorepo after podcast changes
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm check-types 2>&1 | tail -10`
  - **Done when**: Zero type errors
  - **Commit**: `chore(podcast): fix type errors from podcast refactor` (if needed)

- [x] 4.6 Generate real podcast episode
  - **Do**:
    1. Ensure worker is running with podcast queue
    2. Get latest digest ID: `psql -t ai_digest_dev -c "SELECT id FROM digests ORDER BY created_at DESC LIMIT 1;" | tr -d ' '`
    3. Trigger podcast: `curl -s -b /tmp/ai-cookies.txt -X POST http://localhost:3000/api/admin/podcast/generate -H 'Content-Type: application/json' -d "{\"digestId\":\"DIGEST_ID\",\"targetDurationMinutes\":10}"`
    4. Poll status every 30s until complete (may take 10-20 min for TTS)
    5. Verify S3 URL accessible
    6. Download and verify with ffprobe if available
  - **Files**: none (runtime)
  - **Done when**: Real MP3 on S3; episode in DB with audioUrl; transcript with real segments
  - **Verify**:
    ```bash
    psql ai_digest_dev -c "SELECT id, audio_url, duration_seconds, status FROM episodes WHERE status='ready' ORDER BY created_at DESC LIMIT 1;"
    psql ai_digest_dev -c "SELECT COUNT(*) FROM transcripts WHERE episode_id IN (SELECT id FROM episodes WHERE status='ready');"
    ```
  - **Commit**: `feat(podcast): complete first real podcast episode with TTS + S3 upload`
  - _Requirements: FR-5.7, US-11.4, AC-11.4.1 through AC-11.4.5_
  - _Design: Section 6_

---

## Phase 5: Admin API Endpoints

- [x] 5.1 Build admin stats and health endpoints
  - **Do**:
    1. Create `apps/web/src/app/api/admin/stats/route.ts` GET:
       - Count normalized_items, digests, episodes (status='ready'), subscribers (status='active')
       - Latest pipeline_run: status, startedAt, completedAt, itemsIngested, costUsd
       - Source health: count healthy/degraded/erroring from consecutiveErrors + lastFetchAt
       - Return `{ success: true, data: DashboardStats }`
    2. Create `apps/web/src/app/api/admin/health/route.ts` GET:
       - Test PostgreSQL: `SELECT 1`
       - Test Redis: `redis.ping()`
       - Test Anthropic: check ANTHROPIC_API_KEY env var present
       - Test ElevenLabs: `fetch("https://api.elevenlabs.io/v1/user", { headers: { "xi-api-key": key } })` if key present
       - Test S3: check S3_ACCESS_KEY_ID env var
       - Test Resend: check RESEND_API_KEY env var
       - Return `{ success: true, data: ServiceHealth[] }`
  - **Files**:
    - `apps/web/src/app/api/admin/stats/route.ts` (CREATE)
    - `apps/web/src/app/api/admin/health/route.ts` (CREATE)
  - **Done when**: Stats returns real counts; health shows per-service status
  - **Verify**:
    ```bash
    curl -s -b /tmp/ai-cookies.txt http://localhost:3000/api/admin/stats | jq '.data | {totalItems, totalDigests, totalEpisodes}'
    curl -s -b /tmp/ai-cookies.txt http://localhost:3000/api/admin/health | jq '.data | length'
    ```
  - **Commit**: `feat(admin): add stats and health check API endpoints`
  - _Requirements: FR-8.1, FR-8.2, US-8.1, US-8.3_
  - _Design: Section 9_

- [x] 5.2 Build source validation, subscriber delete, and newsletter HTML endpoints
  - **Do**:
    1. Create `apps/web/src/app/api/admin/sources/validate/route.ts` POST:
       - Accept `{ url: z.string().url() }`
       - Fetch URL, attempt RSS/Atom XML parse
       - Return preview: `{ title, description, items: [last 3] }` or error
    2. Create `apps/web/src/app/api/admin/subscribers/[id]/route.ts` DELETE:
       - Soft delete: update subscriber status to "unsubscribed"
       - Return 200 success
    3. Create `apps/web/src/app/api/admin/newsletter/[digestId]/html/route.ts` GET:
       - Load digest + items from DB
       - Render digest-email template to HTML string (use React Email render)
       - Return with Content-Type text/html
  - **Files**:
    - `apps/web/src/app/api/admin/sources/validate/route.ts` (CREATE)
    - `apps/web/src/app/api/admin/subscribers/[id]/route.ts` (CREATE)
    - `apps/web/src/app/api/admin/newsletter/[digestId]/html/route.ts` (CREATE)
  - **Done when**: RSS validation returns preview; subscriber delete works; newsletter HTML renders
  - **Verify**:
    ```bash
    curl -s -b /tmp/ai-cookies.txt -X POST http://localhost:3000/api/admin/sources/validate \
      -H 'Content-Type: application/json' -d '{"url":"https://openai.com/news/rss.xml"}' | jq '.data.title'
    DIGEST_ID=$(psql -t ai_digest_dev -c "SELECT id FROM digests ORDER BY created_at DESC LIMIT 1;" | tr -d ' ')
    curl -s -b /tmp/ai-cookies.txt "http://localhost:3000/api/admin/newsletter/${DIGEST_ID}/html" | head -3
    ```
  - **Commit**: `feat(admin): add source validation, subscriber delete, newsletter HTML endpoints`
  - _Requirements: FR-3.4, FR-6.1, US-3.4, US-6.1, US-6.2, US-6.3_
  - _Design: Section 7, 8_

- [x] 5.3 Add tsvector search index and seed source catalog
  - **Do**:
    1. Add tsvector column + GIN index via raw SQL migration:
       ```sql
       ALTER TABLE normalized_items ADD COLUMN IF NOT EXISTS search_vector tsvector
         GENERATED ALWAYS AS (
           setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
           setweight(to_tsvector('english', coalesce(summary, '')), 'B')
         ) STORED;
       CREATE INDEX IF NOT EXISTS idx_items_search ON normalized_items USING GIN(search_vector);
       ```
    2. Update `apps/web/src/app/api/search/route.ts`:
       - Use `plainto_tsquery('english', query)` with `ts_rank` ordering
       - Support source type filter and dateRange filter
    3. Create `packages/shared/src/seed-sources.ts`:
       - Export `SEED_SOURCES`: 22 source configs from research-sources.md Section 11.1
       - Each with: name, type, url, config, enabled: true
  - **Files**:
    - `apps/web/src/app/api/search/route.ts` (MODIFY)
    - `packages/shared/src/seed-sources.ts` (CREATE)
  - **Done when**: Search uses tsvector ranking; seed sources exported
  - **Verify**:
    ```bash
    psql ai_digest_dev -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='normalized_items' AND column_name='search_vector';"
    curl -s "http://localhost:3000/api/search?q=artificial+intelligence" | jq '.data | length'
    ```
  - **Commit**: `feat(search): add tsvector full-text search index and 22-source seed catalog`
  - _Requirements: FR-7.1, FR-7.2, FR-7.3, FR-3.5, US-7.1_
  - _Design: Section 2.6_

- [x] 5.4 [VERIFY] Admin API checkpoint: type-check + all endpoints respond
  - **Do**: Type-check + verify all new endpoints
  - **Verify**:
    ```bash
    cd /Users/nick/Desktop/ai-digest && pnpm check-types 2>&1 | tail -5
    curl -s -b /tmp/ai-cookies.txt http://localhost:3000/api/admin/stats | jq .success
    curl -s -b /tmp/ai-cookies.txt http://localhost:3000/api/admin/health | jq .success
    curl -s "http://localhost:3000/api/search?q=AI" | jq .success
    ```
  - **Done when**: Type-check passes; all endpoints return `{ success: true }`
  - **Commit**: `chore(api): pass admin API quality checkpoint` (if fixes needed)

---

## Phase 6: Admin Dashboard UI

- [x] 6.1 Wire admin dashboard with real stats and quick actions
  - **Do**:
    1. Update `apps/web/src/app/admin/page.tsx`: fetch `/api/admin/stats` via fetch, display 4 stat cards (items, digests, episodes, subscribers), last pipeline run info, source health summary
    2. Update `apps/web/src/components/admin/dashboard-stats.tsx`: render real numbers from stats API, trend indicators
    3. Update `apps/web/src/components/admin/dashboard-actions.tsx`: "Run Pipeline" with confirmation dialog (POST to trigger), "Generate Podcast" (link to /admin/podcast), "Preview Newsletter"
  - **Files**:
    - `apps/web/src/app/admin/page.tsx`
    - `apps/web/src/components/admin/dashboard-stats.tsx`
    - `apps/web/src/components/admin/dashboard-actions.tsx`
  - **Done when**: Dashboard shows real counts; quick actions fire correct API calls
  - **Verify**: `curl -s -b /tmp/ai-cookies.txt -o /dev/null -w "%{http_code}" http://localhost:3000/admin`
  - **Commit**: `feat(admin): wire dashboard to real stats API with quick actions`
  - _Requirements: US-8.1, US-8.2, AC-8.1.1 through AC-8.2.4_
  - _Design: Stitch screen 7_

- [x] 6.2 Build real-time pipeline monitor page
  - **Do**:
    1. Update `apps/web/src/app/admin/pipeline/page.tsx`: "Run Pipeline" trigger button (disabled while running), real-time monitor polling /api/admin/pipeline/status every 2s, history table below
    2. Update `apps/web/src/components/admin/pipeline-status.tsx`: vertical stage timeline with status icons (pending/running spinner/completed check/failed X), duration, item counts
    3. Update `apps/web/src/components/admin/stage-timeline.tsx`: expandable detail per stage showing model, tokens, cost
    4. Update `apps/web/src/components/admin/pipeline-history.tsx`: paginated table (10/page), status filter, expandable per-stage breakdown
  - **Files**:
    - `apps/web/src/app/admin/pipeline/page.tsx`
    - `apps/web/src/components/admin/pipeline-status.tsx`
    - `apps/web/src/components/admin/stage-timeline.tsx`
    - `apps/web/src/components/admin/pipeline-history.tsx`
  - **Done when**: Pipeline page shows real run data with per-stage tracking; polling updates live
  - **Verify**: `curl -s -b /tmp/ai-cookies.txt http://localhost:3000/api/admin/pipeline/status | jq '.data.stages | length'`
  - **Commit**: `feat(admin): build real-time pipeline monitor with stage tracking`
  - _Requirements: US-4.2, US-4.3, AC-4.2.1 through AC-4.3.5_
  - _Design: Stitch screen 8_

- [x] 6.3 Build podcast admin with trigger, progress monitor, and voice config
  - **Do**:
    1. Update `apps/web/src/app/admin/podcast/page.tsx`: duration selector (5/10/15/20 min buttons), digest dropdown (latest default), "Generate X-min Podcast" button, 6-stage progress timeline polling every 3s, script preview section
    2. Update `apps/web/src/components/admin/voice-selector.tsx`: Host A + Host B voice dropdowns from pre-made list, settings sliders (stability, similarity, style)
    3. Update `apps/web/src/components/admin/voice-preview.tsx`: play 5-second sample button
  - **Files**:
    - `apps/web/src/app/admin/podcast/page.tsx`
    - `apps/web/src/components/admin/voice-selector.tsx`
    - `apps/web/src/components/admin/voice-preview.tsx`
  - **Done when**: Podcast admin triggers generation; shows 6-stage progress; voice config saves
  - **Verify**: `curl -s -b /tmp/ai-cookies.txt -o /dev/null -w "%{http_code}" http://localhost:3000/admin/podcast`
  - **Commit**: `feat(admin): build podcast generation UI with duration config and progress monitor`
  - _Requirements: US-5.1, US-5.2, US-5.3, US-5.5, AC-5.1.1 through AC-5.5.7_
  - _Design: Stitch screen 9_

- [x] 6.4 Wire source management, config, subscriber, and schedule pages
  - **Do**:
    1. `admin/sources/page.tsx` + `source-table.tsx`: health status indicators (green/yellow/red), type badges, enable/disable toggle, expandable fetch log, "Test Connection" button, "Add Source" modal with type-specific config fields
    2. `source-form.tsx`: type dropdown with conditional fields (RSS=url, GitHub=topics/minStars, ArXiv=categories, HN=queries/minPoints, etc.)
    3. `admin/config/page.tsx` + `config-form.tsx`: Pipeline section (batch size, budget), Podcast section (duration, voice link), Schedule section (cron), System section (health checks), save to config API
    4. `admin/subscribers/page.tsx` + `subscriber-table.tsx`: real data, add/remove, count badge
    5. `admin/schedule/page.tsx` + `cron-editor.tsx`: cron expression, human-readable preview, next run time
  - **Files**:
    - `apps/web/src/app/admin/sources/page.tsx`
    - `apps/web/src/components/admin/source-table.tsx`
    - `apps/web/src/components/admin/source-form.tsx`
    - `apps/web/src/app/admin/config/page.tsx`
    - `apps/web/src/components/admin/config-form.tsx`
    - `apps/web/src/app/admin/subscribers/page.tsx`
    - `apps/web/src/components/admin/subscriber-table.tsx`
    - `apps/web/src/app/admin/schedule/page.tsx`
    - `apps/web/src/components/admin/cron-editor.tsx`
  - **Done when**: All admin pages show real data from APIs; forms save correctly
  - **Verify**:
    ```bash
    for page in sources config subscribers schedule; do
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/ai-cookies.txt "http://localhost:3000/admin/$page")
      echo "admin/$page: $STATUS"
    done
    ```
  - **Commit**: `feat(admin): wire source, config, subscriber, and schedule pages to APIs`
  - _Requirements: US-3.1, US-3.2, US-3.3, US-4.6, US-6.3, US-8.4_
  - _Design: Stitch screens 11, 12_

- [x] 6.5 [VERIFY] Admin UI checkpoint: all pages return 200 + type-check
  - **Do**: Verify all admin pages load and type-check passes
  - **Verify**:
    ```bash
    cd /Users/nick/Desktop/ai-digest && pnpm check-types 2>&1 | tail -5
    for page in admin admin/pipeline admin/podcast admin/sources admin/config admin/subscribers admin/schedule; do
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/ai-cookies.txt "http://localhost:3000/$page")
      echo "$page: $STATUS"
    done
    ```
  - **Done when**: All 7 admin pages return 200; type-check passes
  - **Commit**: `chore(admin): pass admin UI quality checkpoint` (if fixes needed)

---

## Phase 7: Consumer Pages Polish

- [ ] 7.1 Polish digest feed and detail pages with real data
  - **Do**:
    1. `apps/web/src/app/digests/page.tsx`: fetch /api/digests, render card per digest (date, count, synthesis preview, topic badges), "Load More" pagination (10/page), empty state CTA
    2. `apps/web/src/components/digest/digest-feed.tsx`, `digest-card.tsx`: real data rendering
    3. `apps/web/src/app/digests/[id]/page.tsx`: full synthesis text, items grouped by topic, score indicators, source badges, "Listen to Podcast" button, share, date nav
    4. `apps/web/src/components/digest/digest-detail.tsx`, `score-indicator.tsx`, `source-badge.tsx`, `topic-section.tsx`: real rendering per design
  - **Files**:
    - `apps/web/src/app/digests/page.tsx`
    - `apps/web/src/app/digests/[id]/page.tsx`
    - `apps/web/src/components/digest/digest-feed.tsx`
    - `apps/web/src/components/digest/digest-card.tsx`
    - `apps/web/src/components/digest/digest-detail.tsx`
    - `apps/web/src/components/digest/score-indicator.tsx`
    - `apps/web/src/components/digest/source-badge.tsx`
    - `apps/web/src/components/digest/topic-section.tsx`
  - **Done when**: Feed shows real digests; detail shows real scored items grouped by topic
  - **Verify**:
    ```bash
    curl -s http://localhost:3000/api/digests | jq '.data | length'
    DIGEST_ID=$(curl -s http://localhost:3000/api/digests | jq -r '.data[0].id')
    curl -s "http://localhost:3000/api/digests/${DIGEST_ID}" | jq '.data | keys'
    ```
  - **Commit**: `feat(consumer): polish digest feed and detail with real pipeline data`
  - _Requirements: US-4.4, US-4.5, AC-4.4.1 through AC-4.5.8_
  - _Design: Stitch screens 1-3_

- [ ] 7.2 Polish podcast player, episode library, and mini-player with real audio
  - **Do**:
    1. `apps/web/src/app/podcasts/page.tsx`: episode library cards (title, date, duration MM:SS, play button), newest first, empty state
    2. `apps/web/src/app/podcasts/[id]/page.tsx`: full player with controls, transcript below
    3. `apps/web/src/components/podcast/podcast-player.tsx`: play/pause, skip +30s/-15s, volume slider, seekable progress bar (elapsed/total in Geist Mono), speed selector (0.5x-2x), download button
    4. `apps/web/src/components/podcast/mini-player.tsx`: fixed 64px bottom bar, episode title, play/pause, thin progress bar, close button
    5. `apps/web/src/components/podcast/transcript-view.tsx`: speaker labels (bold, distinct color), segment highlighting during playback
    6. Wire all to use `episodes.audioUrl` from S3
    7. Add 64px bottom padding to main when mini-player active
  - **Files**:
    - `apps/web/src/app/podcasts/page.tsx`
    - `apps/web/src/app/podcasts/[id]/page.tsx`
    - `apps/web/src/components/podcast/podcast-player.tsx`
    - `apps/web/src/components/podcast/mini-player.tsx`
    - `apps/web/src/components/podcast/player-controls.tsx`
    - `apps/web/src/components/podcast/progress-bar.tsx`
    - `apps/web/src/components/podcast/speed-selector.tsx`
    - `apps/web/src/components/podcast/transcript-view.tsx`
    - `apps/web/src/components/podcast/episode-card.tsx`
  - **Done when**: Player plays real S3 audio; mini-player persists; transcript displays
  - **Verify**:
    ```bash
    curl -s http://localhost:3000/api/episodes | jq '.data[0] | {title, audioUrl, durationSeconds}'
    curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/podcasts
    ```
  - **Commit**: `feat(consumer): polish podcast player with real S3 audio and transcript`
  - _Requirements: US-5.6, US-5.7, US-5.8, US-5.9, AC-5.6.1 through AC-5.9.6_
  - _Design: Stitch screens 4-6_

- [ ] 7.3 Polish search, archive, and subscribe pages
  - **Do**:
    1. `apps/web/src/app/search/page.tsx`: prominent search input, 300ms debounce, grouped results ("Digests" and "Items"), loading indicator, empty state, min 2 chars
    2. `apps/web/src/components/search/search-input.tsx`: header search icon that expands
    3. `apps/web/src/components/search/search-results.tsx`, `search-result-card.tsx`: title, source badge, date, highlighted snippet
    4. `apps/web/src/app/archive/page.tsx`: past digests in newsletter format, "Read" link shows rendered HTML
    5. `apps/web/src/components/subscribe/subscribe-form.tsx`: email input in digest page footer, POST to /api/subscribe
  - **Files**:
    - `apps/web/src/app/search/page.tsx`
    - `apps/web/src/components/search/search-input.tsx`
    - `apps/web/src/components/search/search-results.tsx`
    - `apps/web/src/components/search/search-result-card.tsx`
    - `apps/web/src/app/archive/page.tsx`
    - `apps/web/src/components/subscribe/subscribe-form.tsx`
  - **Done when**: Search returns ranked real results; archive shows newsletter HTML; subscribe form works
  - **Verify**:
    ```bash
    curl -s "http://localhost:3000/api/search?q=model" | jq '.data | length'
    curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/archive
    curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/search
    ```
  - **Commit**: `feat(consumer): polish search, archive, and subscribe with real data`
  - _Requirements: US-7.1, US-6.4, AC-7.1.1 through AC-7.1.8, AC-6.4.1 through AC-6.4.4_
  - _Design: Stitch screens 10, 14_

- [ ] 7.4 [VERIFY] Consumer pages checkpoint: all pages 200 + real data + type-check
  - **Do**: Verify all consumer pages load with real data
  - **Verify**:
    ```bash
    cd /Users/nick/Desktop/ai-digest && pnpm check-types 2>&1 | tail -5
    for page in "" digests podcasts search archive; do
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/$page")
      echo "/$page: $STATUS"
    done
    curl -s http://localhost:3000/api/digests | jq '.data | length'
    curl -s http://localhost:3000/api/episodes | jq '.data | length'
    curl -s "http://localhost:3000/api/search?q=AI" | jq '.data | length'
    ```
  - **Done when**: All 5 pages return 200; APIs return non-empty data; type-check passes
  - **Commit**: `chore(consumer): pass consumer pages quality checkpoint` (if fixes needed)

---

## Phase 8: Playwright E2E & Validation

- [ ] 8.1 [VERIFY] Full build verification
  - **Do**: Type-check + full Next.js production build
  - **Verify**:
    ```bash
    cd /Users/nick/Desktop/ai-digest
    pnpm check-types 2>&1 | tail -10
    pnpm build 2>&1 | tail -20
    ```
  - **Done when**: Both exit code 0
  - **Commit**: `chore(build): pass full build verification` (if fixes needed)

- [ ] 8.2 Playwright screenshot validation: 14 pages x 3 breakpoints
  - **Do**:
    1. Ensure dev server running at http://localhost:3000
    2. Using Playwright MCP browser tools:
       - Navigate to /login, fill credentials, submit to get session
       - For each of 14 pages, at each of 3 breakpoints (375x812, 768x1024, 1440x900):
         - `browser_navigate` to URL
         - `browser_resize` to width x height
         - `browser_take_screenshot`
         - READ screenshot to verify: flat black theme, real data, no layout breaks
       - Pages: `/login`, `/register`, `/digests`, `/digests/:id`, `/podcasts`, `/podcasts/:id`, `/search`, `/archive`, `/admin`, `/admin/pipeline`, `/admin/podcast`, `/admin/sources`, `/admin/config`, `/admin/subscribers`
    3. Save screenshots for evidence
  - **Files**: none (runtime)
  - **Done when**: 42+ screenshots captured; all show flat black professional theme; real data visible; no horizontal scroll
  - **Verify**: `ls /tmp/ai-digest-screenshots/ 2>/dev/null | wc -l || echo "screenshots in browser MCP temp"`
  - **Commit**: none (validation only)
  - _Requirements: US-11.1, AC-11.1.1 through AC-11.1.5, US-2.4, AC-2.4.1 through AC-2.4.7_
  - _Design: Section 13.1_

- [ ] 8.3 cURL verification of all 28 API endpoints
  - **Do**: Test every endpoint:
    - **Public (no auth)**: POST /api/auth/register (duplicate -> 409), POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout, GET /api/digests, GET /api/digests/:id, GET /api/episodes, GET /api/episodes/:id, GET /api/search?q=AI, POST /api/subscribe, POST /api/unsubscribe
    - **Admin (with session)**: GET /api/admin/stats, GET /api/admin/health, GET /api/admin/sources, POST /api/admin/sources, GET /api/admin/sources/:id, PATCH /api/admin/sources/:id, DELETE /api/admin/sources/:id, POST /api/admin/sources/validate, POST /api/admin/pipeline/trigger, GET /api/admin/pipeline/status, GET /api/admin/pipeline/runs, GET /api/admin/config, GET/PUT /api/admin/config/:key, POST /api/admin/podcast/generate, GET /api/admin/podcast/status, GET/POST /api/admin/subscribers, DELETE /api/admin/subscribers/:id, GET /api/admin/newsletter/:digestId/html
    - **Auth enforcement**: without cookie -> 401; non-admin -> 403
  - **Files**: none (runtime)
  - **Done when**: All endpoints return expected responses
  - **Verify**:
    ```bash
    curl -s http://localhost:3000/api/digests | jq .success
    curl -s http://localhost:3000/api/episodes | jq .success
    curl -s "http://localhost:3000/api/search?q=AI" | jq .success
    curl -s http://localhost:3000/api/admin/stats | jq .error
    curl -s -b /tmp/ai-cookies.txt http://localhost:3000/api/admin/stats | jq .success
    curl -s -b /tmp/ai-cookies.txt http://localhost:3000/api/admin/health | jq '.data | length'
    ```
  - **Commit**: none (validation only)
  - _Requirements: US-11.2, AC-11.2.1 through AC-11.2.4_
  - _Design: Section 13.2_

- [ ] 8.4 Database and pipeline evidence verification
  - **Do**: Verify all real data requirements via psql
  - **Verify**:
    ```bash
    echo "=== Zero seed data ==="
    psql ai_digest_dev -c "SELECT COUNT(*) FROM normalized_items WHERE id LIKE 'seed-%';"
    echo "=== Completed pipeline ==="
    psql ai_digest_dev -c "SELECT status, items_ingested, cost_usd FROM pipeline_runs WHERE status='completed' ORDER BY started_at DESC LIMIT 1;"
    echo "=== Real items ==="
    psql ai_digest_dev -c "SELECT source, COUNT(*) FROM normalized_items GROUP BY source ORDER BY count DESC LIMIT 10;"
    echo "=== Real digest ==="
    psql ai_digest_dev -c "SELECT id, LEFT(synthesis, 100) FROM digests ORDER BY created_at DESC LIMIT 1;"
    echo "=== Real episode ==="
    psql ai_digest_dev -c "SELECT audio_url, duration_seconds, status FROM episodes WHERE status='ready' ORDER BY created_at DESC LIMIT 1;"
    echo "=== Zero cyber refs ==="
    cd /Users/nick/Desktop/ai-digest && grep -r "cyber-\|neon-" apps/web/src/ 2>/dev/null | wc -l
    echo "=== Admin user ==="
    psql ai_digest_dev -c "SELECT email, role FROM users LIMIT 5;"
    ```
  - **Done when**: 0 seed items; completed pipeline; real digest; real S3 audio; 0 cyber refs; admin user
  - **Commit**: none (validation only)
  - _Requirements: US-11.3, US-11.4, US-11.5, AC-11.3.1 through AC-11.5.5_
  - _Design: Section 13.3, 13.4, 13.5_

---

## Phase 9: Final Quality Gate

- [ ] 9.1 [VERIFY] Full local CI: type-check + build
  - **Do**: Run complete local CI suite
  - **Verify**:
    ```bash
    cd /Users/nick/Desktop/ai-digest
    pnpm check-types && echo "TYPES OK" || echo "TYPES FAIL"
    pnpm build && echo "BUILD OK" || echo "BUILD FAIL"
    ```
  - **Done when**: Both exit 0
  - **Commit**: `fix(build): address final type/build issues` (if fixes needed)

- [ ] 9.2 [VERIFY] Acceptance criteria checklist
  - **Do**: Programmatically verify all P0 acceptance criteria
  - **Verify**:
    ```bash
    echo "AC-1.1.6 bcrypt:" && grep -c "bcrypt" /Users/nick/Desktop/ai-digest/apps/web/src/app/api/auth/register/route.ts
    echo "AC-1.3.4 first-user-admin:" && grep -c "admin" /Users/nick/Desktop/ai-digest/apps/web/src/app/api/auth/register/route.ts
    echo "AC-2.1.1 zinc-950:" && grep -c "09090B" /Users/nick/Desktop/ai-digest/apps/web/src/app/globals.css
    echo "AC-2.1.9 zero cyber:" && grep -rc "cyber-" /Users/nick/Desktop/ai-digest/apps/web/src/ 2>/dev/null | grep -v ":0$" | wc -l
    echo "AC-2.1.10 effects:" && ls /Users/nick/Desktop/ai-digest/apps/web/src/components/effects/glitch-text.tsx 2>&1 | grep -c "No such"
    echo "AC-2.2.1 Geist:" && grep -c "GeistSans\|GeistMono" /Users/nick/Desktop/ai-digest/apps/web/src/app/layout.tsx
    echo "AC-5.5 request-id:" && grep -c "request-id" /Users/nick/Desktop/ai-digest/packages/podcast/src/tts.ts
    echo "FR-4.7 model IDs:" && grep -c "haiku-4-5\|sonnet-4-5" /Users/nick/Desktop/ai-digest/packages/agents/src/stages/categorize.ts
    echo "FR-4.8 structured:" && grep -rc "zodOutputFormat" /Users/nick/Desktop/ai-digest/packages/agents/src/stages/ | grep -v ":0$" | wc -l
    echo "FR-4.9 caching:" && grep -rc "cache_control" /Users/nick/Desktop/ai-digest/packages/agents/src/stages/ | grep -v ":0$" | wc -l
    ```
  - **Done when**: All checks produce expected non-zero values
  - **Commit**: none (validation only)
  - _Requirements: All P0 ACs_

- [ ] 9.3 Create PR and verify CI
  - **Do**:
    1. Verify on feature branch: `git branch --show-current` (must NOT be main/master)
    2. If on default branch, STOP and alert user
    3. Push: `git push -u origin $(git branch --show-current)`
    4. Create PR: `gh pr create --title "feat: finish full-stack AI Digest platform" --body "..."`
    5. Monitor CI: `gh pr checks --watch`
  - **Verify**: `gh pr checks` shows all green
  - **Done when**: PR created, CI passing
  - **Commit**: none (PR creation)

---

## Phase 10: PR Lifecycle

- [ ] 10.1 Monitor CI and fix failures
  - **Do**: Watch CI with `gh pr checks`, fix any failures, push fixes
  - **Verify**: `gh pr checks`
  - **Done when**: All CI checks green

- [ ] 10.2 Address review comments
  - **Do**: Read PR comments via `gh pr view --comments`, implement fixes, push
  - **Verify**: `gh pr checks` after each push
  - **Done when**: All comments addressed, CI green, PR approved

---

## Notes

### Phases already complete (SKIPPED)
- Phase 0 (Foundation): deps installed, DB tables created, type-check passes
- Phase 1 (Auth): iron-session, register/login/logout/me, middleware migrated, login/register pages
- Phase 2 (Theme): 99% done -- tailwind.config, globals.css, layout.tsx, zero cyber/neon refs, effects deleted

### Already implemented (verified via codebase exploration)
- Model IDs: categorize=Haiku 4.5, score=Sonnet 4.5, dedup=Haiku 4.5, synthesize=Sonnet 4.5
- Structured outputs: zodOutputFormat in all 4 pipeline stages
- Prompt caching: cache_control on system prompts in all 4 stages
- Zod schemas: categorize, score, dedup, synthesize (4 of 6 -- podcast-script and quality-review still needed)
- Auth: iron-session, bcrypt, first-user-admin, middleware, admin-auth.ts
- DB: users, source_fetch_log, sources health columns, episodes podcast columns, pipeline_stages cost columns

### POC shortcuts (acceptable)
- No rate limiting on auth endpoints
- Password reset is UI-only stub (P3)
- Settings/API keys page deferred (P3)
- No Resend email sending (render HTML only)
- Search filters basic (P2)
- Quick Setup seed wizard deferred (P1) -- seed catalog created as constant only
- WebSocket deferred -- using 2-3s polling

### Production TODOs
- Rate limiting on auth endpoints (10 req/min)
- WebSocket for real-time pipeline updates
- Resend email delivery when key configured
- Advanced search filter sidebar
- Source fetch log retention pruning (30 days)
- Podcast regeneration (replace vs archive)

### Key metrics
- 48 total tasks (across 10 phases, starting from Phase 2)
- ~6 files to CREATE (new API endpoints + schemas)
- ~50+ files to MODIFY (admin/consumer UI wiring)
- 28 API endpoints to verify
- 42+ Playwright screenshots at 3 breakpoints
- Real pipeline execution with live Anthropic API
- Real podcast generation with live ElevenLabs TTS
