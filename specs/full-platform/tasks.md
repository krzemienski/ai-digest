---
spec: full-platform
phase: tasks
total_tasks: 98
created: 2026-02-07T16:00:00-05:00
---

# Tasks: AI Digest Full-Stack Platform

## Execution Context

| Question | Answer |
|----------|--------|
| Testing depth | FUNCTIONAL VALIDATION ONLY. No test files. For each feature: screenshots at 3 breakpoints (375px, 768px, 1440px), visual inspection, backend log correlation. All 3 must pass. |
| Deployment approach | Not applicable -- focus on building, not deploying |
| Execution priority | Quality first -- clean architecture from the start |
| Prior context | Feature completeness required (all P0 items ship together) |

### Validation Protocol

Every frontend task uses this gate:
1. Start dev server (`pnpm dev`)
2. Take screenshots via browser automation at mobile (375px), tablet (768px), desktop (1440px)
3. Visually inspect each screenshot for UI correctness
4. Correlate with backend logs for data flow
5. ALL must pass

Every backend task uses:
1. Run the service/pipeline
2. Check logs/stdout for expected output
3. Verify database state via `psql` or Drizzle queries
4. Confirm expected behavior

---

## Phase 1: Foundation (Monorepo, DB, Shared Types)

Focus: Scaffold the monorepo, define all shared types, create DB schema, get Turborepo building. This is the bedrock everything else depends on.

- [x] 1.1 Scaffold Turborepo monorepo root
  - **Do**:
    1. Create root `package.json` with `"workspaces": ["apps/*", "packages/*"]` and scripts: `dev`, `build`, `lint`, `check-types`
    2. Create `turbo.json` with pipelines: `build` (dependsOn ^build), `dev` (persistent), `lint`, `check-types`
    3. Create `tsconfig.base.json` with strict mode, ESNext target, module resolution bundler
    4. Create `.env.example` with all required env vars (ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, RESEND_API_KEY, DATABASE_URL, REDIS_URL, ADMIN_API_KEY, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT, R2_PUBLIC_URL, RESEND_AUDIENCE_ID, GITHUB_TOKEN, PRODUCTHUNT_TOKEN, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
    5. Update `.gitignore` with node_modules, .env.local, .next, dist, .turbo, *.tsbuildinfo
    6. Create empty directory structure for all packages and apps
  - **Files**: `package.json`, `turbo.json`, `tsconfig.base.json`, `.env.example`, `.gitignore`
  - **Done when**: `pnpm install` succeeds, directory structure exists
  - **Verify**: `pnpm install && ls apps/web apps/worker packages/shared packages/db packages/agents packages/email packages/podcast`
  - **Commit**: `feat(root): scaffold turborepo monorepo with workspace config`
  - _Requirements: FR-38, AC-44.1, AC-44.3, AC-44.4_
  - _Design: Turborepo Package Structure, Implementation Step 1_

- [x] 1.2 Create packages/shared with all TypeScript types
  - **Do**:
    1. Create `packages/shared/package.json` with name `@ai-digest/shared`, main `./src/index.ts`
    2. Create `packages/shared/tsconfig.json` extending base
    3. Create all type files from design.md Package Design section:
       - `src/types/normalized-item.ts` -- NormalizedItem, SourceType
       - `src/types/digest.ts` -- Digest, DigestItem, DigestMetadata, SynthesisStyle
       - `src/types/config.ts` -- DigestConfig, TopicConfig, ScoringConfig, SynthesisConfig, PipelineConfig
       - `src/types/episode.ts` -- Episode, TranscriptSegment, Transcript
       - `src/types/pipeline.ts` -- PipelineRun, PipelineStage, StageName
       - `src/types/subscriber.ts` -- Subscriber
       - `src/types/source-config.ts` -- SourceConfig
       - `src/types/voice.ts` -- VoiceConfig, SpeakerVoice
       - `src/types/api.ts` -- ApiResponse, SearchResult
       - `src/types/index.ts` -- re-export all types
    4. Create utility files:
       - `src/utils/hash.ts` -- deterministicId(source, sourceId) using SHA-256
       - `src/utils/date.ts` -- formatDigestDate, isWithinHours
       - `src/utils/index.ts` -- re-export utils
    5. Create `src/index.ts` -- re-export types + utils
  - **Files**: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/types/*.ts`, `packages/shared/src/utils/*.ts`, `packages/shared/src/index.ts`
  - **Done when**: All types compile without errors, exports are accessible
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p packages/shared/tsconfig.json`
  - **Commit**: `feat(shared): add all typescript types and utility functions`
  - _Requirements: FR-8, AC-8.1, AC-8.2_
  - _Design: packages/shared section_

- [x] 1.3 Create packages/db with Drizzle schema for all 10 tables
  - **Do**:
    1. Create `packages/db/package.json` with deps: `drizzle-orm`, `postgres`, `drizzle-kit`, `@ai-digest/shared`
    2. Create `packages/db/tsconfig.json` extending base
    3. Create `packages/db/drizzle.config.ts` pointing to schema dir
    4. Create `packages/db/src/client.ts` -- drizzle + postgres.js connection from DATABASE_URL
    5. Create all schema files from design.md:
       - `src/schema/sources.ts` -- sources table
       - `src/schema/normalized-items.ts` -- normalized_items with indexes
       - `src/schema/digests.ts` -- digests + digest_items tables
       - `src/schema/episodes.ts` -- episodes + transcripts tables
       - `src/schema/subscribers.ts` -- subscribers table
       - `src/schema/pipeline.ts` -- pipeline_runs + pipeline_stages tables
       - `src/schema/config.ts` -- config KV table
       - `src/schema/index.ts` -- re-export all schemas
    6. Create `packages/db/src/index.ts` -- re-export client + schemas
  - **Files**: `packages/db/package.json`, `packages/db/tsconfig.json`, `packages/db/drizzle.config.ts`, `packages/db/src/client.ts`, `packages/db/src/schema/*.ts`, `packages/db/src/index.ts`
  - **Done when**: Schema compiles, drizzle-kit can introspect schemas
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p packages/db/tsconfig.json`
  - **Commit**: `feat(db): define drizzle schema for all 10 database tables`
  - _Requirements: FR-36, AC-45.1, AC-45.2, AC-45.4_
  - _Design: Database Schema, Drizzle Schema section_

- [x] 1.4 Create DB query helpers for all domains
  - **Do**:
    1. Create `packages/db/src/queries/digests.ts` -- getDigests (paginated), getDigestById, getLatestDigest, createDigest, addDigestItems
    2. Create `packages/db/src/queries/items.ts` -- getItemsByPipelineRun, getItemsByScore, updateItemScores, markDuplicate
    3. Create `packages/db/src/queries/episodes.ts` -- getEpisodes (paginated), getEpisodeById, createEpisode, updateEpisodeStatus
    4. Create `packages/db/src/queries/subscribers.ts` -- getSubscribers, createSubscriber, removeSubscriber, getSubscriberCount
    5. Create `packages/db/src/queries/pipeline.ts` -- createPipelineRun, updatePipelineRun, createPipelineStage, updatePipelineStage, getRecentRuns
    6. Create `packages/db/src/queries/config.ts` -- getConfig, setConfig
    7. Create `packages/db/src/queries/search.ts` -- fullTextSearch across items + transcripts
    8. Update `packages/db/src/index.ts` to re-export queries
  - **Files**: `packages/db/src/queries/*.ts`, `packages/db/src/index.ts`
  - **Done when**: All query functions compile, return proper Drizzle types
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p packages/db/tsconfig.json`
  - **Commit**: `feat(db): add query helpers for all database domains`
  - _Requirements: FR-36_
  - _Design: packages/db queries section_

- [x] 1.5 Push DB schema to local PostgreSQL and verify tables
  - **Do**:
    1. Ensure local PostgreSQL is running (use `pg_isready` or start via brew services)
    2. Create database `ai_digest_dev` if not exists
    3. Set DATABASE_URL in `.env.local`
    4. Run `pnpm exec drizzle-kit push` from packages/db to create all tables
    5. Add full-text search migration: create tsvector columns on normalized_items and transcripts with GIN indexes
    6. Verify all 10 tables exist with correct columns
  - **Files**: `.env.local`, `packages/db/src/migrations/` (if generated)
  - **Done when**: All 10 tables created in PostgreSQL with correct columns, indexes, and FTS columns
  - **Verify**: `psql ai_digest_dev -c "\\dt" | grep -c -E "(sources|normalized_items|digests|digest_items|episodes|transcripts|subscribers|pipeline_runs|pipeline_stages|config)"`
  - **Commit**: `feat(db): push schema to postgresql with full-text search indexes`
  - _Requirements: FR-36, AC-45.3_
  - _Design: Full-Text Search SQL section_

- [x] 1.6 [VERIFY] Quality checkpoint: type-check all packages
  - **Do**: Run TypeScript compilation across entire monorepo
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p packages/shared/tsconfig.json && pnpm exec tsc --noEmit -p packages/db/tsconfig.json`
  - **Done when**: Zero type errors across shared and db packages
  - **Commit**: `chore(root): pass phase 1 quality checkpoint` (only if fixes needed)

---

## Phase 2: Pipeline Core (Ingestion, Normalization, BullMQ)

Focus: Build all 7 source fetchers, normalization, and BullMQ orchestration. No AI yet -- pure TypeScript data pipeline.

- [x] 2.1 Create packages/agents skeleton with fetcher interfaces
  - **Do**:
    1. Create `packages/agents/package.json` with deps: `rss-parser`, `fast-xml-parser`, `@ai-digest/shared`, `@ai-digest/db`
    2. Create `packages/agents/tsconfig.json` extending base
    3. Create `packages/agents/src/config.ts` with default DigestConfig (default topics, scoring weights, synthesis settings)
    4. Create `packages/agents/src/budget.ts` with BudgetTracker class (track cost per run, enforce maxBudgetUsd)
    5. Create `packages/agents/src/index.ts`
  - **Files**: `packages/agents/package.json`, `packages/agents/tsconfig.json`, `packages/agents/src/config.ts`, `packages/agents/src/budget.ts`, `packages/agents/src/index.ts`
  - **Done when**: Package compiles, config and budget modules export correctly
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p packages/agents/tsconfig.json`
  - **Commit**: `feat(agents): scaffold agents package with config and budget tracking`
  - _Requirements: FR-39, AC-14.1, AC-14.2_
  - _Design: packages/agents section_

- [x] 2.2 Implement RSS feed fetcher
  - **Do**:
    1. Create `packages/agents/src/fetchers/rss.ts`
    2. Use `rss-parser` to fetch and parse RSS feed URLs
    3. Extract title, link, pubDate, content, author from each item
    4. Return array of raw items conforming to a RawFetchResult type
    5. Handle: feed unreachable (log + skip), malformed XML (catch + skip), timeout (5s)
    6. Accept SourceConfig.rss config (url, ttlMinutes)
  - **Files**: `packages/agents/src/fetchers/rss.ts`
  - **Done when**: Fetcher returns parsed items from a real RSS feed URL
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && node -e "import('./packages/agents/src/fetchers/rss.ts').then(m => m.fetchRss({url:'https://feeds.arstechnica.com/arstechnica/technology-lab'}).then(r => console.log(r.length, 'items')))" --experimental-specifier-resolution=node` (or use tsx runner)
  - **Commit**: `feat(agents): implement RSS feed fetcher with error handling`
  - _Requirements: FR-1, AC-1.2, AC-1.3, AC-1.5_
  - _Design: fetchers/rss.ts_

- [x] 2.3 Implement GitHub trending repos fetcher
  - **Do**:
    1. Create `packages/agents/src/fetchers/github.ts`
    2. Use fetch to query GitHub Search API: `GET /search/repositories?q=topic:ai+created:>{date}&sort=stars`
    3. Extract repo name, description, stars, language, created_at, html_url
    4. Respect rate limits: check X-RateLimit-Remaining header, back off if low
    5. Use GITHUB_TOKEN env var for authenticated requests (5000 req/hr)
    6. Accept SourceConfig.github config (query, minStars, createdAfterDays)
  - **Files**: `packages/agents/src/fetchers/github.ts`
  - **Done when**: Returns trending AI repos from GitHub API
  - **Verify**: Run fetcher with tsx, confirm it returns repos with expected fields (name, stars, url)
  - **Commit**: `feat(agents): implement github trending repos fetcher`
  - _Requirements: FR-4, AC-2.1, AC-2.2, AC-2.3, AC-2.4_
  - _Design: fetchers/github.ts_

- [x] 2.4 Implement ArXiv paper fetcher
  - **Do**:
    1. Create `packages/agents/src/fetchers/arxiv.ts`
    2. Use fetch to query ArXiv API: `http://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL`
    3. Parse Atom XML response with `fast-xml-parser`
    4. Extract title, authors, abstract, categories, published date, PDF URL
    5. Enforce 3-second delay between requests
    6. Accept SourceConfig.arxiv config (categories, maxResults)
  - **Files**: `packages/agents/src/fetchers/arxiv.ts`
  - **Done when**: Returns parsed ArXiv papers with all required fields
  - **Verify**: Run fetcher with tsx, confirm papers returned with title, authors, abstract fields
  - **Commit**: `feat(agents): implement arxiv paper fetcher with rate limiting`
  - _Requirements: FR-3, AC-3.1, AC-3.2, AC-3.3, AC-3.4_
  - _Design: fetchers/arxiv.ts_

- [x] 2.5 Implement Hacker News fetcher
  - **Do**:
    1. Create `packages/agents/src/fetchers/hackernews.ts`
    2. Use fetch to query HN Algolia API: `https://hn.algolia.com/api/v1/search?query=AI&tags=story&numericFilters=points>50`
    3. Extract title, URL, points, num_comments, created_at
    4. Accept SourceConfig.hackernews config (keywords, minPoints)
  - **Files**: `packages/agents/src/fetchers/hackernews.ts`
  - **Done when**: Returns HN stories matching AI/ML keywords above point threshold
  - **Verify**: Run fetcher with tsx, confirm stories returned with points and URLs
  - **Commit**: `feat(agents): implement hacker news algolia fetcher`
  - _Requirements: FR-2, AC-4.1, AC-4.2, AC-4.3_
  - _Design: fetchers/hackernews.ts_

- [x] 2.6 [VERIFY] Quality checkpoint: type-check agents package
  - **Do**: Run TypeScript across agents package
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p packages/agents/tsconfig.json`
  - **Done when**: Zero type errors
  - **Commit**: `chore(agents): pass quality checkpoint` (only if fixes needed)

- [x] 2.7 Implement HuggingFace, Reddit RSS, and Product Hunt fetchers
  - **Do**:
    1. Create `packages/agents/src/fetchers/huggingface.ts` -- query HF Hub API for recently modified models, filter by task
    2. Create `packages/agents/src/fetchers/reddit.ts` -- fetch subreddit RSS feeds (reuses rss-parser), extract post title, score, author, URL
    3. Create `packages/agents/src/fetchers/producthunt.ts` -- GraphQL query to PH API for AI-topic posts, use Bearer token auth
  - **Files**: `packages/agents/src/fetchers/huggingface.ts`, `packages/agents/src/fetchers/reddit.ts`, `packages/agents/src/fetchers/producthunt.ts`
  - **Done when**: All 3 fetchers compile and return structured data
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p packages/agents/tsconfig.json`
  - **Commit**: `feat(agents): implement huggingface, reddit rss, and producthunt fetchers`
  - _Requirements: FR-5, FR-6, FR-7, AC-5.1, AC-5.2, AC-5.3, AC-6.1, AC-6.3, AC-7.1, AC-7.2_
  - _Design: fetchers/huggingface.ts, fetchers/reddit.ts, fetchers/producthunt.ts_

- [x] 2.8 Implement ingestion stage dispatcher and normalization stage
  - **Do**:
    1. Create `packages/agents/src/stages/ingest.ts`:
       - Read enabled sources from DB
       - Dispatch to correct fetcher based on source.type
       - Run all fetchers (parallel where possible, sequential for rate-limited sources)
       - Store raw results associated with pipeline run ID
    2. Create `packages/agents/src/stages/normalize.ts`:
       - Map raw fetcher results to NormalizedItem schema
       - Generate deterministic IDs via deterministicId(source, sourceId)
       - Detect and skip duplicate URLs (items already in DB)
       - Store NormalizedItems in database
  - **Files**: `packages/agents/src/stages/ingest.ts`, `packages/agents/src/stages/normalize.ts`
  - **Done when**: Ingestion dispatches to all 7 fetchers; normalization produces NormalizedItems with deterministic IDs
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p packages/agents/tsconfig.json`
  - **Commit**: `feat(agents): implement ingestion dispatcher and normalization stage`
  - _Requirements: FR-1 through FR-8, AC-8.1, AC-8.2, AC-8.3, AC-1.4_
  - _Design: stages/ingest.ts, stages/normalize.ts_

- [x] 2.9 Create apps/worker with BullMQ pipeline orchestration
  - **Do**:
    1. Create `apps/worker/package.json` with deps: `bullmq`, `ioredis`, `@ai-digest/agents`, `@ai-digest/db`, `@ai-digest/shared`
    2. Create `apps/worker/tsconfig.json` extending base
    3. Create `apps/worker/src/index.ts` -- worker entry: connect to Redis, register processors, log startup
    4. Create `apps/worker/src/processors/pipeline.ts`:
       - FlowProducer for pipeline DAG
       - Ingestion sources as parallel children
       - Sequential stages: normalize -> categorize -> score -> dedup -> synthesize -> output -> podcast -> newsletter
       - Each stage has configurable retry (default 3, exponential backoff)
       - Track pipeline_run and pipeline_stage status in DB
    5. Add `"dev"` script to worker package.json using tsx
  - **Files**: `apps/worker/package.json`, `apps/worker/tsconfig.json`, `apps/worker/src/index.ts`, `apps/worker/src/processors/pipeline.ts`
  - **Done when**: Worker starts, connects to Redis, registers pipeline processor
  - **Verify**: Start worker with tsx, check stdout for "Worker connected to Redis" and "Pipeline processor registered" messages. Ctrl+C to stop.
  - **Commit**: `feat(worker): create bullmq worker with pipeline flow orchestration`
  - _Requirements: FR-34, AC-15.1, AC-15.2, AC-15.3, AC-48.1, AC-48.2, AC-48.3_
  - _Design: Worker Process, BullMQ Pipeline Architecture_

- [x] 2.10 End-to-end ingestion test: run pipeline, verify items in DB
  - **Do**:
    1. Seed a few test sources in the sources table (1 RSS feed, 1 HN query)
    2. Create a simple runner script that triggers the ingest + normalize stages directly (bypass BullMQ for this test)
    3. Run the script
    4. Query normalized_items table and verify items exist with correct fields
    5. Verify deterministic IDs are consistent (run twice, check no duplicates created)
  - **Files**: (no new files -- use existing infrastructure)
  - **Done when**: Items from RSS + HN appear in normalized_items with correct schema, no duplicates on re-run
  - **Verify**: `psql ai_digest_dev -c "SELECT count(*), source FROM normalized_items GROUP BY source"` shows items from both sources
  - **Commit**: `feat(agents): verify end-to-end ingestion pipeline works`
  - _Requirements: FR-1, FR-2, FR-8_
  - _Design: Pipeline Data Flow_

- [x] 2.11 [VERIFY] Quality checkpoint: full monorepo type-check
  - **Do**: Type-check all packages and apps
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p packages/shared/tsconfig.json && pnpm exec tsc --noEmit -p packages/db/tsconfig.json && pnpm exec tsc --noEmit -p packages/agents/tsconfig.json && pnpm exec tsc --noEmit -p apps/worker/tsconfig.json`
  - **Done when**: Zero type errors across all packages
  - **Commit**: `chore(root): pass phase 2 quality checkpoint` (only if fixes needed)

---

## Phase 3: AI Analysis Pipeline (Categorize, Score, Dedup, Synthesize)

Focus: Wire Claude Agent SDK for the 4 AI stages. Each stage gets a prompt template and structured output.

- [x] 3.1 Create Claude Agent SDK prompt templates
  - **Do**:
    1. Create `packages/agents/src/prompts/categorize.ts` -- system prompt for topic classification, JSON output schema (array of {itemId, topics[]})
    2. Create `packages/agents/src/prompts/score.ts` -- scoring rubric prompt (relevance 0-1, novelty 0-1, impact 0-1), JSON output schema
    3. Create `packages/agents/src/prompts/dedup.ts` -- dedup comparison prompt (compare pairs, identify same-story items), JSON output schema
    4. Create `packages/agents/src/prompts/synthesize.ts` -- editorial synthesis prompt (summarize top items, identify trends), configurable style (brief/detailed/editorial)
  - **Files**: `packages/agents/src/prompts/categorize.ts`, `packages/agents/src/prompts/score.ts`, `packages/agents/src/prompts/dedup.ts`, `packages/agents/src/prompts/synthesize.ts`
  - **Done when**: All prompt templates export system prompts and JSON schemas
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p packages/agents/tsconfig.json`
  - **Commit**: `feat(agents): create claude agent prompt templates for all analysis stages`
  - _Requirements: FR-9, FR-10, FR-11, FR-12_
  - _Design: prompts/ directory, Agent Model Routing table_

- [x] 3.2 Implement categorization stage (Claude Sonnet)
  - **Do**:
    1. Create `packages/agents/src/stages/categorize.ts`
    2. Fetch uncategorized items from current pipeline run
    3. Batch items (20-30 per batch to fit context window)
    4. Call Claude Sonnet via Anthropic SDK with categorize prompt + items
    5. Use structured output (JSON schema) for classification results
    6. Update items in DB with assigned topic categories
    7. Track cost via BudgetTracker, abort if budget exceeded
    8. Set maxTurns=10 per agent call
  - **Files**: `packages/agents/src/stages/categorize.ts`
  - **Done when**: Items receive topic categories from Claude, stored in DB
  - **Verify**: Run categorize stage on test items, then `psql ai_digest_dev -c "SELECT id, title, categories FROM normalized_items WHERE categories != '{}' LIMIT 5"` shows categorized items
  - **Commit**: `feat(agents): implement categorization stage with claude sonnet`
  - _Requirements: FR-9, AC-10.1, AC-10.3, AC-10.4_
  - _Design: stages/categorize.ts, Agent Model Routing_

- [x] 3.3 Implement scoring stage (Claude Sonnet)
  - **Do**:
    1. Create `packages/agents/src/stages/score.ts`
    2. Fetch categorized items from current pipeline run
    3. Batch items and call Claude Sonnet with scoring rubric prompt
    4. Extract relevanceScore, noveltyScore, impactScore (0-1 each)
    5. Calculate compositeScore from configurable weights
    6. Update items in DB with all scores
    7. Track cost, respect budget cap
  - **Files**: `packages/agents/src/stages/score.ts`
  - **Done when**: Items have relevance/novelty/impact scores and composite score in DB
  - **Verify**: `psql ai_digest_dev -c "SELECT id, title, composite_score, relevance_score FROM normalized_items WHERE composite_score IS NOT NULL ORDER BY composite_score DESC LIMIT 5"` shows scored items
  - **Commit**: `feat(agents): implement scoring stage with claude sonnet`
  - _Requirements: FR-10, AC-11.1, AC-11.2, AC-11.5_
  - _Design: stages/score.ts_

- [x] 3.4 Implement deduplication stage (Claude Haiku)
  - **Do**:
    1. Create `packages/agents/src/stages/dedup.ts`
    2. Group scored items by topic cluster
    3. Within each cluster, use Claude Haiku to compare pairs and identify duplicates
    4. Mark duplicate items with `duplicate_of` pointing to highest-scored version
    5. Track cost (Haiku is cheapest)
  - **Files**: `packages/agents/src/stages/dedup.ts`
  - **Done when**: Duplicate items marked in DB, highest-scored version preserved
  - **Verify**: `psql ai_digest_dev -c "SELECT count(*) as dupes FROM normalized_items WHERE duplicate_of IS NOT NULL"` shows dedup count
  - **Commit**: `feat(agents): implement deduplication stage with claude haiku`
  - _Requirements: FR-11, AC-12.1, AC-12.2, AC-12.3_
  - _Design: stages/dedup.ts_

- [x] 3.5 Implement editorial synthesis stage (Claude Opus)
  - **Do**:
    1. Create `packages/agents/src/stages/synthesize.ts`
    2. Select top N items (configurable, default 15) above minScore threshold
    3. Call Claude Opus with synthesis prompt including all top items
    4. Generate editorial summary with trend analysis connecting themes
    5. Support configurable style: brief, detailed, editorial
    6. Cap output at 2000 tokens
    7. Track cost, respect budget
  - **Files**: `packages/agents/src/stages/synthesize.ts`
  - **Done when**: Editorial synthesis text generated from top items
  - **Verify**: Run synthesize stage, check output is a coherent multi-paragraph editorial summary. Log output length and content preview.
  - **Commit**: `feat(agents): implement editorial synthesis stage with claude opus`
  - _Requirements: FR-12, AC-13.1, AC-13.2, AC-13.3, AC-13.4_
  - _Design: stages/synthesize.ts_

- [x] 3.6 Implement digest output assembly stage
  - **Do**:
    1. Create `packages/agents/src/stages/output.ts`
    2. Gather top scored, non-duplicate items
    3. Group items by topic section
    4. Rank items within each section by composite score
    5. Create digest record in DB with synthesis text, item count, metadata (topTopics, sourceBreakdown, dateRange)
    6. Create digest_items linking digest to normalized items with rank and section
  - **Files**: `packages/agents/src/stages/output.ts`
  - **Done when**: Digest record created in DB with linked items organized by topic sections
  - **Verify**: `psql ai_digest_dev -c "SELECT d.id, d.digest_date, d.item_count, d.synthesis_style FROM digests d ORDER BY d.created_at DESC LIMIT 1"` shows digest
  - **Commit**: `feat(agents): implement digest assembly output stage`
  - _Requirements: FR-13, AC-16.1, AC-16.2, AC-17.1, AC-17.4_
  - _Design: stages/output.ts_

- [x] 3.7 Wire coordinator to run full analysis pipeline
  - **Do**:
    1. Create `packages/agents/src/coordinator.ts`
    2. Implement `runPipeline(config, triggerType)` that:
       - Creates pipeline_run record
       - Runs stages in order: ingest -> normalize -> categorize -> score -> dedup -> synthesize -> output
       - Updates pipeline_stages with status/timing for each stage
       - Handles budget exceeded (graceful stop with partial results)
       - Returns PipelineResult with run, digestId, error
    3. Update worker processors to call coordinator
  - **Files**: `packages/agents/src/coordinator.ts`, `apps/worker/src/processors/pipeline.ts` (update)
  - **Done when**: Coordinator orchestrates all stages end-to-end, pipeline_run record tracks progress
  - **Verify**: Trigger pipeline via coordinator, check `psql ai_digest_dev -c "SELECT pr.status, pr.items_ingested, pr.items_scored, pr.cost_usd FROM pipeline_runs pr ORDER BY started_at DESC LIMIT 1"` shows completed run
  - **Commit**: `feat(agents): wire coordinator for end-to-end pipeline orchestration`
  - _Requirements: FR-34, FR-39, AC-14.4, AC-15.1_
  - _Design: coordinator.ts_

- [x] 3.8 [VERIFY] Quality checkpoint: full pipeline type-check + E2E run
  - **Do**: Type-check all packages; run one complete pipeline to verify all stages work together
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p packages/agents/tsconfig.json && pnpm exec tsc --noEmit -p apps/worker/tsconfig.json`
  - **Done when**: Zero type errors; pipeline_run shows "completed" status with items scored and digest created
  - **Commit**: `chore(root): pass phase 3 quality checkpoint` (only if fixes needed)

---

## Phase 4: Podcast Production (Script, TTS, ffmpeg, R2)

Focus: Generate podcast from digest -- script generation via Claude, TTS via ElevenLabs, audio assembly via ffmpeg, upload to R2.

- [x] 4.1 Create podcast script generation prompt
  - **Do**:
    1. Create `packages/agents/src/prompts/podcast-script.ts`
    2. System prompt instructs Claude Opus to generate multi-speaker dialogue
    3. Output schema: array of {order, speaker, text, estimatedDuration}
    4. Include intro, topic transitions, and outro
    5. Target duration configurable (default 15 minutes)
    6. Speaker labels: "Host A", "Host B"
  - **Files**: `packages/agents/src/prompts/podcast-script.ts`
  - **Done when**: Prompt template produces well-structured podcast script from digest data
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p packages/agents/tsconfig.json`
  - **Commit**: `feat(agents): create podcast script generation prompt template`
  - _Requirements: FR-14, AC-18.1, AC-18.2, AC-18.3, AC-18.4_
  - _Design: prompts/podcast-script.ts_

- [x] 4.2 Create packages/podcast with script parser
  - **Do**:
    1. Create `packages/podcast/package.json` with deps: `elevenlabs`, `fluent-ffmpeg`, `@ffmpeg-installer/ffmpeg`, `@aws-sdk/client-s3`, `@ai-digest/shared`
    2. Create `packages/podcast/tsconfig.json`
    3. Create `packages/podcast/src/script-parser.ts`:
       - parseScript(rawScript: string): ScriptSegment[]
       - Validate segment ordering and speaker labels
       - Estimate total duration from segment count
    4. Create `packages/podcast/src/index.ts`
  - **Files**: `packages/podcast/package.json`, `packages/podcast/tsconfig.json`, `packages/podcast/src/script-parser.ts`, `packages/podcast/src/index.ts`
  - **Done when**: Script parser correctly splits JSON script into ordered segments
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p packages/podcast/tsconfig.json`
  - **Commit**: `feat(podcast): create podcast package with script parser`
  - _Requirements: AC-19.1_
  - _Design: packages/podcast, script-parser.ts_

- [x] 4.3 Implement ElevenLabs TTS segment generation
  - **Do**:
    1. Create `packages/podcast/src/tts.ts`
    2. Initialize ElevenLabs client with ELEVENLABS_API_KEY
    3. Implement `generateSegmentAudio(segment, voiceId, voiceSettings, previousRequestIds)`:
       - Call textToSpeech.convert with voice_id, text, model_id, previous_request_ids
       - Return audio buffer + requestId for continuity chain
    4. Implement `generateAllSegments(segments, voiceConfig)`:
       - Map each speaker to voiceId from config
       - Generate sequentially (for continuity via previous_request_ids)
       - Accumulate requestIds per speaker
       - Return ordered TTSResult array
  - **Files**: `packages/podcast/src/tts.ts`
  - **Done when**: TTS generates audio buffers for each segment with cross-segment continuity
  - **Verify**: Run TTS on 2-3 short test segments, verify audio buffers are non-empty MP3 data. Log duration and request IDs.
  - **Commit**: `feat(podcast): implement elevenlabs tts with cross-segment continuity`
  - _Requirements: FR-15, AC-19.2, AC-19.3, AC-19.4_
  - _Design: tts.ts_

- [x] 4.4 Implement ffmpeg audio assembly
  - **Do**:
    1. Create `packages/podcast/src/assembler.ts`
    2. Write segment audio buffers to temp files
    3. Use fluent-ffmpeg to concatenate segments in order using concat filter
    4. Support optional intro/outro audio files
    5. Output as MP3 128kbps, 44.1kHz
    6. Return final buffer and calculated duration
    7. Clean up temp files after assembly
  - **Files**: `packages/podcast/src/assembler.ts`
  - **Done when**: Multiple audio segments concatenated into single MP3 file with correct duration
  - **Verify**: Assemble 2-3 test segments, verify output file is valid MP3 using `ffprobe` (check duration, codec, sample rate)
  - **Commit**: `feat(podcast): implement ffmpeg audio assembly with concat filter`
  - _Requirements: FR-16, AC-20.1, AC-20.2_
  - _Design: assembler.ts_

- [x] 4.5 Implement Cloudflare R2 upload
  - **Do**:
    1. Create `packages/podcast/src/r2-upload.ts`
    2. Initialize S3 client with R2 credentials (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)
    3. Implement `uploadToR2(buffer, key, contentType)`:
       - PutObject to R2 bucket
       - Use multipart upload for files >10MB
       - Return public URL: `${R2_PUBLIC_URL}/${key}`
    4. Key format: `episodes/{date}.mp3`
  - **Files**: `packages/podcast/src/r2-upload.ts`
  - **Done when**: Audio buffer uploaded to R2, public URL returned
  - **Verify**: Upload a small test file, verify URL is accessible via curl (HTTP 200)
  - **Commit**: `feat(podcast): implement cloudflare r2 upload via s3 sdk`
  - _Requirements: FR-17, FR-37, AC-20.3, AC-46.1, AC-46.2, AC-46.3, AC-46.4_
  - _Design: r2-upload.ts_

- [x] 4.6 [VERIFY] Quality checkpoint: podcast package type-check
  - **Do**: Type-check podcast package
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p packages/podcast/tsconfig.json`
  - **Done when**: Zero type errors
  - **Commit**: `chore(podcast): pass quality checkpoint` (only if fixes needed)

- [x] 4.7 Wire podcast generation into pipeline worker
  - **Do**:
    1. Create `apps/worker/src/processors/podcast.ts`:
       - Accept digest data from pipeline
       - Call Claude Opus to generate podcast script
       - Store script + transcript segments in DB (episodes + transcripts tables)
       - Parse script into segments
       - Generate TTS audio for all segments
       - Assemble final MP3 via ffmpeg
       - Upload to R2
       - Update episode record with audio_url, duration, status="ready"
    2. Wire into pipeline flow (runs after output stage)
    3. Handle failures: mark episode "failed", log error, continue pipeline
  - **Files**: `apps/worker/src/processors/podcast.ts`, `apps/worker/src/processors/pipeline.ts` (update)
  - **Done when**: Pipeline generates podcast episode from digest, uploads to R2, stores metadata in DB
  - **Verify**: Run full pipeline including podcast stage. Check `psql ai_digest_dev -c "SELECT e.title, e.audio_url, e.duration_seconds, e.status FROM episodes e ORDER BY created_at DESC LIMIT 1"` shows ready episode with audio URL. Verify URL returns audio via `curl -I {audio_url}` (check Content-Type: audio/mpeg).
  - **Commit**: `feat(worker): wire podcast generation into pipeline flow`
  - _Requirements: FR-14, FR-15, FR-16, FR-17, AC-18.1 through AC-20.4_
  - _Design: Audio Generation Flow_

---

## Phase 5: Newsletter (React Email, Resend, Subscribers)

Focus: Build cyberpunk email template, wire Resend sending, subscriber management.

- [x] 5.1 Create packages/email with cyberpunk digest template
  - **Do**:
    1. Create `packages/email/package.json` with deps: `resend`, `@react-email/components`, `react`, `@ai-digest/shared`
    2. Create `packages/email/tsconfig.json`
    3. Create `packages/email/src/templates/digest-email.tsx`:
       - Off-black #0D0D14 background, off-white #F0F0F5 text
       - Neon accents: cyan #00FFFF, green #00FF88, magenta #FF0066
       - All styles inlined for Gmail compatibility
       - Max width 600px
       - Sections: header with date, editorial synthesis, topic sections with item cards, footer with unsubscribe
       - Item cards show: title, one-line summary, source badge, score indicator
       - Use system fonts only (no web fonts)
    4. Create `packages/email/src/templates/welcome-email.tsx` -- simple welcome message with cyberpunk styling
  - **Files**: `packages/email/package.json`, `packages/email/tsconfig.json`, `packages/email/src/templates/digest-email.tsx`, `packages/email/src/templates/welcome-email.tsx`
  - **Done when**: Templates render valid HTML email with cyberpunk styling
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p packages/email/tsconfig.json`
  - **Commit**: `feat(email): create cyberpunk digest and welcome email templates`
  - _Requirements: FR-18, AC-22.1, AC-22.2, AC-22.3, AC-22.4, AC-22.5_
  - _Design: packages/email, digest-email.tsx_

- [x] 5.2 Implement Resend send wrapper and subscriber management
  - **Do**:
    1. Create `packages/email/src/send.ts`:
       - Initialize Resend client with RESEND_API_KEY
       - `sendDigestNewsletter(digest, subscriberEmails)` -- batch send using React Email template
       - Include List-Unsubscribe header for one-click unsubscribe (Gmail 2024+ requirement)
       - Return sent/failed counts
       - Retry failed sends up to 3 times with backoff
    2. Create `packages/email/src/subscribers.ts`:
       - `addSubscriber(email)` -- create contact in Resend audience via Contacts API
       - `removeSubscriber(email)` -- remove from Resend audience
    3. Create `packages/email/src/index.ts` -- re-export all
  - **Files**: `packages/email/src/send.ts`, `packages/email/src/subscribers.ts`, `packages/email/src/index.ts`
  - **Done when**: Send function compiles, subscriber management functions work with Resend API
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p packages/email/tsconfig.json`
  - **Commit**: `feat(email): implement resend send wrapper and subscriber management`
  - _Requirements: FR-19, FR-20, AC-22.6, AC-23.1, AC-23.4, AC-24.2, AC-24.4_
  - _Design: send.ts, subscribers.ts_

- [x] 5.3 Wire newsletter sending into pipeline worker
  - **Do**:
    1. Create `apps/worker/src/processors/newsletter.ts`:
       - Read active subscribers from DB
       - Render digest email template with latest digest data
       - Send via Resend to all subscribers
       - Track delivery status in pipeline_stages
       - Handle: no subscribers (skip), send failure (retry, log)
    2. Wire into pipeline flow (runs after podcast stage)
  - **Files**: `apps/worker/src/processors/newsletter.ts`, `apps/worker/src/processors/pipeline.ts` (update)
  - **Done when**: Pipeline sends newsletter after digest generation
  - **Verify**: Run pipeline with at least one test subscriber email, check Resend dashboard for delivery status (or check logs for send confirmation)
  - **Commit**: `feat(worker): wire newsletter sending into pipeline flow`
  - _Requirements: FR-19, AC-23.1, AC-23.2, AC-23.3_
  - _Design: Newsletter Stage in Pipeline Data Flow_

- [x] 5.4 [VERIFY] Quality checkpoint: email + worker type-check
  - **Do**: Type-check email package and worker
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p packages/email/tsconfig.json && pnpm exec tsc --noEmit -p apps/worker/tsconfig.json`
  - **Done when**: Zero type errors
  - **Commit**: `chore(root): pass phase 5 quality checkpoint` (only if fixes needed)

---

## Phase 6: Web App -- Consumer (Next.js App Router)

Focus: Build consumer-facing pages -- digest feed, detail, podcast player, mini-player, transcript, search, archive. All with cyberpunk theme.

- [x] 6.1 Scaffold Next.js app with cyberpunk Tailwind config
  - **Do**:
    1. Create `apps/web/package.json` with deps: `next`, `react`, `react-dom`, `tailwindcss`, `postcss`, `autoprefixer`, `zustand`, `@ai-digest/db`, `@ai-digest/shared`, `@t3-oss/env-nextjs`, `zod`
    2. Create `apps/web/tsconfig.json` extending base
    3. Create `apps/web/next.config.ts` with transpilePackages for all @ai-digest/* packages
    4. Create `apps/web/tailwind.config.ts` with cyberpunk design tokens (all colors, fonts, shadows, animations from design.md)
    5. Create `apps/web/postcss.config.mjs`
    6. Create `apps/web/src/app/globals.css` with Tailwind directives + cyberpunk custom utilities (neon glow, scanline overlay, reduced-motion media queries)
    7. Create `apps/web/src/lib/env.ts` with @t3-oss/env-nextjs validation for all env vars
  - **Files**: `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/next.config.ts`, `apps/web/tailwind.config.ts`, `apps/web/postcss.config.mjs`, `apps/web/src/app/globals.css`, `apps/web/src/lib/env.ts`
  - **Done when**: `pnpm dev` starts Next.js without errors, Tailwind compiles with cyberpunk tokens
  - **Verify**: Start dev server (`cd apps/web && pnpm dev`), navigate to localhost:3000, take screenshot confirming dark background renders
  - **Commit**: `feat(web): scaffold next.js app with cyberpunk tailwind config`
  - _Requirements: FR-40, AC-43.3, AC-43.4_
  - _Design: Cyberpunk Design Tokens, Component Architecture_

- [x] 6.2 Build UI primitives and layout components
  - **Do**:
    1. Create `apps/web/src/components/ui/button.tsx` -- cyberpunk button with neon glow on hover
    2. Create `apps/web/src/components/ui/card.tsx` -- dark surface card with border glow
    3. Create `apps/web/src/components/ui/input.tsx` -- styled input with neon focus ring
    4. Create `apps/web/src/components/ui/badge.tsx` -- source type badge (colored per source)
    5. Create `apps/web/src/components/ui/skeleton.tsx` -- loading skeleton with pulse
    6. Create `apps/web/src/components/ui/progress.tsx` -- progress bar with neon fill
    7. Create `apps/web/src/components/ui/dialog.tsx` -- modal dialog
    8. Create `apps/web/src/components/ui/dropdown.tsx` -- dropdown menu
    9. Create `apps/web/src/components/ui/tooltip.tsx` -- tooltip
    10. Create layout components:
        - `apps/web/src/components/layout/header.tsx` -- site header with nav + search link
        - `apps/web/src/components/layout/footer.tsx` -- footer with subscribe CTA
        - `apps/web/src/components/layout/container.tsx` -- max-width wrapper
    11. Create `apps/web/src/components/effects/neon-border.tsx` -- CSS glow wrapper
    12. Create `apps/web/src/components/effects/scanline.tsx` -- scanline overlay
    13. Create `apps/web/src/components/effects/glitch-text.tsx` -- glitch animation
    14. Create `apps/web/src/components/effects/reduced-motion.tsx` -- useReducedMotion hook
    15. Create root layout `apps/web/src/app/layout.tsx`:
        - Load JetBrains Mono + Inter via next/font/google
        - Apply dark background, global styles
        - Include header, footer, MiniPlayer slot
  - **Files**: `apps/web/src/components/ui/*.tsx`, `apps/web/src/components/layout/*.tsx`, `apps/web/src/components/effects/*.tsx`, `apps/web/src/app/layout.tsx`
  - **Done when**: All UI primitives render with cyberpunk styling, layout wraps pages
  - **Verify**: Start dev server, take screenshots at 375px, 768px, 1440px showing header, footer, dark theme. Confirm JetBrains Mono heading font renders.
  - **Commit**: `feat(web): build cyberpunk ui primitives and layout components`
  - _Requirements: FR-40, AC-34.1, AC-34.2, AC-34.3, AC-34.4_
  - _Design: Key React Components, Cyberpunk Design Tokens_

- [ ] 6.3 Build public API routes for digests and episodes
  - **Do**:
    1. Create `apps/web/src/app/api/digests/route.ts` -- GET paginated digests
    2. Create `apps/web/src/app/api/digests/[id]/route.ts` -- GET single digest with items
    3. Create `apps/web/src/app/api/digests/latest/route.ts` -- GET latest digest
    4. Create `apps/web/src/app/api/episodes/route.ts` -- GET paginated episodes
    5. Create `apps/web/src/app/api/episodes/[id]/route.ts` -- GET single episode with transcript
    6. All routes use DB queries from packages/db
    7. All responses follow ApiResponse<T> format
    8. Add Cache-Control: public, max-age=300 headers
  - **Files**: `apps/web/src/app/api/digests/route.ts`, `apps/web/src/app/api/digests/[id]/route.ts`, `apps/web/src/app/api/digests/latest/route.ts`, `apps/web/src/app/api/episodes/route.ts`, `apps/web/src/app/api/episodes/[id]/route.ts`
  - **Done when**: API routes return correct data from DB
  - **Verify**: With dev server running, `curl http://localhost:3000/api/digests | python3 -m json.tool` returns valid JSON with success:true. Similarly for /api/episodes.
  - **Commit**: `feat(web): build public api routes for digests and episodes`
  - _Requirements: FR-21, FR-22_
  - _Design: Public API routes table_

- [x] 6.4 Build digest feed page with card-based layout
  - **Do**:
    1. Create `apps/web/src/components/digest/source-badge.tsx` -- colored badge per source type
    2. Create `apps/web/src/components/digest/score-indicator.tsx` -- visual 0-1 score bar
    3. Create `apps/web/src/components/digest/topic-section.tsx` -- section header + item list
    4. Create `apps/web/src/components/digest/digest-card.tsx` -- card with title, summary, source badge, score, date
    5. Create `apps/web/src/components/digest/digest-feed.tsx` -- card-based feed with editorial synthesis at top, items grouped by topic
    6. Create `apps/web/src/app/digests/page.tsx` -- Server Component fetching latest digest, rendering feed
    7. Create `apps/web/src/app/page.tsx` -- redirect to /digests
  - **Files**: `apps/web/src/components/digest/*.tsx`, `apps/web/src/app/digests/page.tsx`, `apps/web/src/app/page.tsx`
  - **Done when**: Digest feed renders with cards grouped by topic, editorial synthesis at top
  - **Verify**: Start dev server, navigate to localhost:3000/digests. Take screenshots at 375px, 768px, 1440px. Confirm: editorial synthesis visible at top, cards show title/summary/source/score, single-column on mobile, multi-column on desktop.
  - **Commit**: `feat(web): build digest feed page with cyberpunk card layout`
  - _Requirements: FR-21, AC-26.1, AC-26.2, AC-26.3, AC-26.4, AC-26.5_
  - _Design: digest/ components_

- [x] 6.5 Build digest detail page
  - **Do**:
    1. Create `apps/web/src/components/digest/digest-detail.tsx` -- full digest view with synthesis, all items, scores, source links
    2. Create `apps/web/src/app/digests/[id]/page.tsx` -- Server Component fetching digest by ID, rendering detail view
    3. Include related items from same topic at bottom
    4. Link to original source for each item
  - **Files**: `apps/web/src/components/digest/digest-detail.tsx`, `apps/web/src/app/digests/[id]/page.tsx`
  - **Done when**: Detail page shows full digest with all items, source links, scores
  - **Verify**: Navigate to a digest detail page. Take screenshots at 3 breakpoints. Confirm: full summary visible, items show scores and source links, related items listed.
  - **Commit**: `feat(web): build digest detail page with full item view`
  - _Requirements: AC-27.1, AC-27.2, AC-27.3_
  - _Design: digest-detail.tsx_

- [x] 6.6 [VERIFY] Quality checkpoint: web app type-check + visual
  - **Do**: Type-check web app, verify pages render
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p apps/web/tsconfig.json`
  - **Done when**: Zero type errors, digest pages render at all breakpoints
  - **Commit**: `chore(web): pass phase 6a quality checkpoint` (only if fixes needed)

- [x] 6.7 Build Zustand audio store and podcast player
  - **Do**:
    1. Create `apps/web/src/stores/audio-store.ts` -- Zustand store with all state and actions from design.md
    2. Create `apps/web/src/components/podcast/player-controls.tsx` -- play/pause, skip forward 30s, skip back 15s
    3. Create `apps/web/src/components/podcast/progress-bar.tsx` -- seekable progress bar with elapsed/remaining time
    4. Create `apps/web/src/components/podcast/speed-selector.tsx` -- 0.5x, 1x, 1.25x, 1.5x, 2x
    5. Create `apps/web/src/components/podcast/podcast-player.tsx` -- full-screen player combining controls, progress, speed, episode title/date/duration. Cyberpunk neon glow on active controls.
    6. Wire HTML5 `<audio>` element to Zustand store (play, pause, seek, speed, time update)
  - **Files**: `apps/web/src/stores/audio-store.ts`, `apps/web/src/components/podcast/player-controls.tsx`, `apps/web/src/components/podcast/progress-bar.tsx`, `apps/web/src/components/podcast/speed-selector.tsx`, `apps/web/src/components/podcast/podcast-player.tsx`
  - **Done when**: Full-screen player renders, controls work (play/pause/seek/speed), audio state persists via Zustand
  - **Verify**: Navigate to podcast player page, take screenshots at 3 breakpoints. Confirm: controls visible with neon styling, touch targets >= 44x44px on mobile, speed selector visible.
  - **Commit**: `feat(web): build podcast player with zustand audio state management`
  - _Requirements: FR-22, AC-28.1, AC-28.2, AC-28.3, AC-28.4, AC-28.5, AC-28.6, AC-29.5_
  - _Design: Zustand Audio Player Store, podcast/ components_

- [x] 6.8 Build mini player and episode library
  - **Do**:
    1. Create `apps/web/src/components/podcast/mini-player.tsx`:
       - Fixed bottom bar (56-64px height)
       - Shows truncated episode title, play/pause, progress indicator
       - Appears only when audio is playing (reads from Zustand store)
       - Tap to expand to full player
    2. Create `apps/web/src/components/podcast/episode-card.tsx` -- list item with title, date, duration, play button
    3. Create `apps/web/src/app/podcasts/page.tsx` -- episode library listing episodes by date (newest first)
    4. Create `apps/web/src/app/podcasts/[id]/page.tsx` -- full player page for specific episode
    5. Add MiniPlayer to root layout (renders globally when audio playing)
  - **Files**: `apps/web/src/components/podcast/mini-player.tsx`, `apps/web/src/components/podcast/episode-card.tsx`, `apps/web/src/app/podcasts/page.tsx`, `apps/web/src/app/podcasts/[id]/page.tsx`, `apps/web/src/app/layout.tsx` (update)
  - **Done when**: Mini player appears during playback, episode library lists episodes, navigation between pages preserves audio state
  - **Verify**: Start playback, navigate to digest page, confirm mini player persists at bottom. Take screenshots at 3 breakpoints of episode library and mini player.
  - **Commit**: `feat(web): build mini player and episode library`
  - _Requirements: AC-29.1, AC-29.2, AC-29.3, AC-29.4, AC-29.5, AC-31.1, AC-31.2, AC-31.3_
  - _Design: mini-player.tsx, episode-card.tsx_

- [x] 6.9 Build transcript viewer
  - **Do**:
    1. Create `apps/web/src/components/podcast/transcript-view.tsx`:
       - Display speaker-labeled segments with timestamps
       - Each speaker gets distinct color label
       - Tapping timestamp jumps audio playback to that position
       - Current segment highlighted and auto-scrolled during playback
    2. Create `apps/web/src/components/podcast/transcript-search.tsx`:
       - In-transcript text search input
       - Highlight matching text in transcript
    3. Wire transcript view into podcast player page
  - **Files**: `apps/web/src/components/podcast/transcript-view.tsx`, `apps/web/src/components/podcast/transcript-search.tsx`, `apps/web/src/app/podcasts/[id]/page.tsx` (update)
  - **Done when**: Transcript renders below player with speaker labels, timestamps clickable, search highlights matches
  - **Verify**: Navigate to podcast player with transcript. Take screenshots at 3 breakpoints. Confirm: speaker labels with distinct colors, timestamps visible, search input present.
  - **Commit**: `feat(web): build transcript viewer with speaker labels and search`
  - _Requirements: FR-23, AC-30.1, AC-30.2, AC-30.3, AC-30.4, AC-30.5_
  - _Design: transcript-view.tsx, transcript-search.tsx_

- [x] 6.10 Build search page and API
  - **Do**:
    1. Create `apps/web/src/app/api/search/route.ts` -- GET with query param `q`, uses PostgreSQL FTS on normalized_items + transcripts
    2. Create `apps/web/src/components/search/search-input.tsx` -- search bar with debounce (300ms)
    3. Create `apps/web/src/components/search/search-result-card.tsx` -- result card showing title, matched snippet, date, source/type indicator
    4. Create `apps/web/src/components/search/search-results.tsx` -- mixed results list (items + transcript segments)
    5. Create `apps/web/src/app/search/page.tsx` -- search page with input and results
    6. Add search link to header navigation
  - **Files**: `apps/web/src/app/api/search/route.ts`, `apps/web/src/components/search/*.tsx`, `apps/web/src/app/search/page.tsx`, `apps/web/src/components/layout/header.tsx` (update)
  - **Done when**: Search returns relevant results from digests and transcripts
  - **Verify**: With dev server running, `curl "http://localhost:3000/api/search?q=transformer" | python3 -m json.tool` returns results. Take screenshots of search page at 3 breakpoints.
  - **Commit**: `feat(web): build full-text search page and api route`
  - _Requirements: FR-24, AC-32.1, AC-32.2, AC-32.3, AC-32.4_
  - _Design: search/ components, Search API route_

- [x] 6.11 Build newsletter archive and subscribe form
  - **Do**:
    1. Create `apps/web/src/app/archive/page.tsx` -- list past digests by date, each renders content in web cyberpunk theme (not email HTML)
    2. Create `apps/web/src/app/api/subscribe/route.ts` -- POST with email validation (Zod), creates subscriber in DB + Resend audience
    3. Create `apps/web/src/app/api/unsubscribe/route.ts` -- DELETE with signed token validation
    4. Create `apps/web/src/components/subscribe/subscribe-form.tsx` -- email input + submit, cyberpunk styled, success/error states
    5. Create `apps/web/src/components/subscribe/unsubscribe-confirm.tsx` -- confirmation page
    6. Add subscribe form to footer or dedicated section
  - **Files**: `apps/web/src/app/archive/page.tsx`, `apps/web/src/app/api/subscribe/route.ts`, `apps/web/src/app/api/unsubscribe/route.ts`, `apps/web/src/components/subscribe/*.tsx`
  - **Done when**: Archive shows past digests, subscribe/unsubscribe flows work
  - **Verify**: `curl -X POST http://localhost:3000/api/subscribe -H "Content-Type: application/json" -d '{"email":"test@example.com"}' | python3 -m json.tool` returns success. Take screenshots of archive page at 3 breakpoints.
  - **Commit**: `feat(web): build newsletter archive and subscribe/unsubscribe flows`
  - _Requirements: FR-20, FR-25, AC-24.1, AC-24.3, AC-33.1, AC-33.2, AC-33.3_
  - _Design: archive page, subscribe components_

- [x] 6.12 [VERIFY] Quality checkpoint: full web app type-check + all consumer pages
  - **Do**: Type-check web app, verify all consumer pages render
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p apps/web/tsconfig.json`
  - **Done when**: Zero type errors, all consumer pages (digests, detail, podcasts, player, search, archive) render at all breakpoints
  - **Commit**: `chore(web): pass phase 6 quality checkpoint` (only if fixes needed)

---

## Phase 7: Web App -- Admin Dashboard

Focus: Build all admin pages -- source management, pipeline monitoring, config, voice settings, subscribers.

- [x] 7.1 Build admin layout with sidebar and auth gate
  - **Do**:
    1. Create `apps/web/src/components/layout/sidebar.tsx` -- admin sidebar nav with links: Dashboard, Sources, Pipeline, Config, Podcast, Schedule, Subscribers
    2. Create `apps/web/src/app/admin/layout.tsx` -- admin layout wrapping sidebar + content area
    3. Create `apps/web/src/app/admin/login/page.tsx` -- login form accepting API key, sets admin-token cookie on success
    4. Auth gate: if no valid admin-token cookie, redirect to login
  - **Files**: `apps/web/src/components/layout/sidebar.tsx`, `apps/web/src/app/admin/layout.tsx`, `apps/web/src/app/admin/login/page.tsx`
  - **Done when**: Admin layout renders with sidebar, login page accepts API key
  - **Verify**: Navigate to localhost:3000/admin, get redirected to login. Enter API key, get redirected to dashboard. Take screenshots at 3 breakpoints.
  - **Commit**: `feat(web): build admin layout with sidebar and login page`
  - _Requirements: FR-32, AC-41.1, AC-41.4_
  - _Design: Admin layout, AdminLogin_

- [x] 7.2 Build admin API routes
  - **Do**:
    1. Create `apps/web/src/app/api/admin/sources/route.ts` -- GET list sources, POST create source
    2. Create `apps/web/src/app/api/admin/sources/[id]/route.ts` -- PUT update, DELETE remove
    3. Create `apps/web/src/app/api/admin/pipeline/trigger/route.ts` -- POST trigger pipeline (add job to BullMQ)
    4. Create `apps/web/src/app/api/admin/pipeline/status/route.ts` -- GET current + recent statuses
    5. Create `apps/web/src/app/api/admin/pipeline/runs/route.ts` -- GET run history with stages
    6. Create `apps/web/src/app/api/admin/config/route.ts` -- GET all config
    7. Create `apps/web/src/app/api/admin/config/[key]/route.ts` -- PUT update config section
    8. Create `apps/web/src/app/api/admin/subscribers/route.ts` -- GET subscriber list with stats
    9. Create `apps/web/src/app/api/admin/podcast/preview/route.ts` -- POST generate TTS preview
    10. Create `apps/web/src/lib/queue.ts` -- BullMQ queue client for enqueuing from API routes
  - **Files**: `apps/web/src/app/api/admin/**/*.ts`, `apps/web/src/lib/queue.ts`
  - **Done when**: All admin API routes return correct data and accept mutations
  - **Verify**: `curl -H "x-api-key: $ADMIN_API_KEY" http://localhost:3000/api/admin/sources | python3 -m json.tool` returns sources list. Similarly test pipeline status and config endpoints.
  - **Commit**: `feat(web): build all admin api routes`
  - _Requirements: FR-26, FR-27, FR-28, FR-29, FR-30, FR-31_
  - _Design: Admin API routes table_

- [x] 7.3 Build admin dashboard overview page
  - **Do**:
    1. Create `apps/web/src/components/admin/dashboard-stats.tsx` -- overview cards: total items, total runs, subscriber count, last run status, next scheduled run
    2. Create `apps/web/src/app/admin/page.tsx` -- dashboard page combining stats, recent run summary, quick actions (trigger pipeline)
  - **Files**: `apps/web/src/components/admin/dashboard-stats.tsx`, `apps/web/src/app/admin/page.tsx`
  - **Done when**: Dashboard shows key metrics and recent activity
  - **Verify**: Navigate to /admin after login. Take screenshots at 3 breakpoints. Confirm stats cards visible with data.
  - **Commit**: `feat(web): build admin dashboard overview with stats cards`
  - _Requirements: FR-27_
  - _Design: AdminDashboard_

- [x] 7.4 Build source management page
  - **Do**:
    1. Create `apps/web/src/components/admin/source-table.tsx` -- table listing sources with type, name, config, enabled toggle, edit/delete actions
    2. Create `apps/web/src/components/admin/source-form.tsx` -- dialog form for add/edit source (type selector, config fields per type, name, enabled)
    3. Create `apps/web/src/app/admin/sources/page.tsx` -- page with table + add button
  - **Files**: `apps/web/src/components/admin/source-table.tsx`, `apps/web/src/components/admin/source-form.tsx`, `apps/web/src/app/admin/sources/page.tsx`
  - **Done when**: Admin can list, add, edit, delete, and toggle sources
  - **Verify**: Navigate to /admin/sources. Add a new RSS source, verify it appears in table. Toggle enabled state. Take screenshots at 3 breakpoints.
  - **Commit**: `feat(web): build source management page with crud operations`
  - _Requirements: FR-26, AC-35.1, AC-35.2, AC-35.3, AC-35.4_
  - _Design: SourceManager_

- [x] 7.5 Build pipeline monitoring page
  - **Do**:
    1. Create `apps/web/src/components/admin/pipeline-status.tsx` -- current status badge (idle/running/failed/completed)
    2. Create `apps/web/src/components/admin/pipeline-history.tsx` -- table of recent runs with date, duration, items, status
    3. Create `apps/web/src/components/admin/stage-timeline.tsx` -- expandable per-stage visual timeline with timing and status
    4. Create `apps/web/src/app/admin/pipeline/page.tsx` -- page with status, "Run Now" button, history table
  - **Files**: `apps/web/src/components/admin/pipeline-status.tsx`, `apps/web/src/components/admin/pipeline-history.tsx`, `apps/web/src/components/admin/stage-timeline.tsx`, `apps/web/src/app/admin/pipeline/page.tsx`
  - **Done when**: Pipeline page shows current status, run history, per-stage details, and manual trigger button
  - **Verify**: Navigate to /admin/pipeline. Click "Run Now" and verify status changes. Take screenshots at 3 breakpoints showing pipeline history.
  - **Commit**: `feat(web): build pipeline monitoring page with stage timeline`
  - _Requirements: FR-27, AC-36.1, AC-36.2, AC-36.3, AC-36.4, AC-36.5_
  - _Design: PipelineMonitor_

- [x] 7.6 [VERIFY] Quality checkpoint: admin pages type-check
  - **Do**: Type-check web app with admin pages
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p apps/web/tsconfig.json`
  - **Done when**: Zero type errors
  - **Commit**: `chore(web): pass phase 7a quality checkpoint` (only if fixes needed)

- [x] 7.7 Build analysis config page
  - **Do**:
    1. Create `apps/web/src/components/admin/config-form.tsx` -- form with:
       - Topic categories: add/edit/remove (name, keywords, weight)
       - Scoring weights: sliders for novelty, impact, relevance weights + minScore threshold
       - Synthesis: style selector (brief/detailed/editorial), maxItems input
       - Budget: maxBudgetUsd input
    2. Create `apps/web/src/app/admin/config/page.tsx` -- config page with form, saves to config table via API
  - **Files**: `apps/web/src/components/admin/config-form.tsx`, `apps/web/src/app/admin/config/page.tsx`
  - **Done when**: Admin can configure topics, scoring weights, synthesis style, and budget
  - **Verify**: Navigate to /admin/config. Change a scoring weight, save, reload page, confirm value persisted. Take screenshots at 3 breakpoints.
  - **Commit**: `feat(web): build analysis configuration page with topics and weights`
  - _Requirements: FR-28, AC-37.1, AC-37.2, AC-37.3, AC-37.4, AC-10.2, AC-11.3_
  - _Design: AnalysisConfig_

- [x] 7.8 Build podcast voice settings page
  - **Do**:
    1. Create `apps/web/src/components/admin/voice-selector.tsx` -- dropdown to pick ElevenLabs voice IDs for each speaker
    2. Create `apps/web/src/components/admin/voice-preview.tsx` -- play short TTS sample via API route
    3. Create `apps/web/src/app/admin/podcast/page.tsx` -- voice config page with:
       - Speaker role assignment (Host A, Host B)
       - Voice ID selection per speaker
       - Settings sliders: stability, similarity_boost, speed, style
       - Preview button for each voice
       - Target episode duration input
       - Audio format selector
       - Enable/disable podcast generation toggle
  - **Files**: `apps/web/src/components/admin/voice-selector.tsx`, `apps/web/src/components/admin/voice-preview.tsx`, `apps/web/src/app/admin/podcast/page.tsx`
  - **Done when**: Admin can configure voices, preview audio samples, set episode parameters
  - **Verify**: Navigate to /admin/podcast. Adjust voice settings, click preview, confirm audio plays. Take screenshots at 3 breakpoints.
  - **Commit**: `feat(web): build podcast voice configuration with preview`
  - _Requirements: FR-30, AC-21.1, AC-21.2, AC-21.3, AC-21.4, AC-39.1, AC-39.2, AC-39.3, AC-39.4_
  - _Design: VoiceConfig_

- [x] 7.9 Build schedule config and subscriber dashboard pages
  - **Do**:
    1. Create `apps/web/src/components/admin/cron-editor.tsx` -- cron expression input with human-readable preview of next run times
    2. Create `apps/web/src/app/admin/schedule/page.tsx` -- schedule page showing current cron, next run time, editor to change
    3. Create `apps/web/src/components/admin/subscriber-table.tsx` -- subscriber list with email, status, subscribed date, export button
    4. Create `apps/web/src/app/admin/subscribers/page.tsx` -- subscriber dashboard with total count, new (7d), unsubscribes (7d), subscriber table
  - **Files**: `apps/web/src/components/admin/cron-editor.tsx`, `apps/web/src/app/admin/schedule/page.tsx`, `apps/web/src/components/admin/subscriber-table.tsx`, `apps/web/src/app/admin/subscribers/page.tsx`
  - **Done when**: Schedule page shows/edits cron; subscriber page shows metrics and list
  - **Verify**: Navigate to /admin/schedule, confirm cron editor shows current schedule. Navigate to /admin/subscribers, confirm subscriber count and table. Take screenshots at 3 breakpoints for both pages.
  - **Commit**: `feat(web): build schedule config and subscriber dashboard`
  - _Requirements: FR-29, FR-31, AC-38.1, AC-38.2, AC-38.3, AC-40.1, AC-40.2, AC-40.3_
  - _Design: ScheduleConfig, SubscriberDashboard_

- [x] 7.10 [VERIFY] Quality checkpoint: full admin type-check + page renders
  - **Do**: Type-check web app, verify all admin pages render
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p apps/web/tsconfig.json`
  - **Done when**: Zero type errors, all admin pages render at all breakpoints
  - **Commit**: `chore(web): pass phase 7 quality checkpoint` (only if fixes needed)

---

## Phase 8: Auth & Security

Focus: Admin middleware, rate limiting, env validation. Security hardening.

- [x] 8.1 Implement Next.js middleware for admin auth
  - **Do**:
    1. Create `apps/web/src/middleware.ts`:
       - Match paths: `/admin/*`, `/api/admin/*`
       - Check for admin-token cookie or x-api-key header
       - Compare against ADMIN_API_KEY env var
       - API routes: return 401 JSON if invalid
       - Page routes: redirect to /admin/login if invalid
    2. Set cookie as httpOnly, secure, sameSite=strict, maxAge=7 days
  - **Files**: `apps/web/src/middleware.ts`
  - **Done when**: Unauthenticated requests to admin routes return 401 or redirect to login
  - **Verify**: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/admin/sources` returns 401. `curl -s -o /dev/null -w "%{http_code}" -H "x-api-key: $ADMIN_API_KEY" http://localhost:3000/api/admin/sources` returns 200.
  - **Commit**: `feat(web): implement admin auth middleware with cookie and api key`
  - _Requirements: FR-32, AC-41.1, AC-41.2, AC-41.3_
  - _Design: Auth Middleware_

- [x] 8.2 Implement API rate limiting
  - **Do**:
    1. Create `apps/web/src/lib/rate-limit.ts`:
       - Initialize Upstash Redis with UPSTASH_REDIS_REST_URL/TOKEN
       - `publicLimiter`: 60 req/min per IP for public endpoints
       - `subscribeLimiter`: 10 req/min per IP for subscribe endpoint
    2. Add rate limiting to:
       - `/api/subscribe` -- subscribeLimiter
       - `/api/digests/*`, `/api/episodes/*`, `/api/search` -- publicLimiter
    3. Return 429 with Retry-After header when limit exceeded
  - **Files**: `apps/web/src/lib/rate-limit.ts`, update relevant API routes
  - **Done when**: Rate limiting enforced on public endpoints
  - **Verify**: Use a loop to send 65 rapid requests to /api/digests, confirm the last few return 429 with Retry-After header.
  - **Commit**: `feat(web): implement api rate limiting with upstash redis`
  - _Requirements: FR-33, AC-42.1, AC-42.2, AC-42.3_
  - _Design: Rate Limiting_

- [x] 8.3 Harden env validation and input validation
  - **Do**:
    1. Ensure `apps/web/src/lib/env.ts` validates ALL required env vars using @t3-oss/env-nextjs + Zod:
       - Server: DATABASE_URL, REDIS_URL, ADMIN_API_KEY, ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, RESEND_API_KEY, R2_*, UPSTASH_*
       - Missing vars cause clear startup error with var name
    2. Review all API routes: ensure Zod validation on all request bodies
    3. Ensure subscribe endpoint validates email format
    4. Ensure admin source create/edit validates source config per type
    5. Add signed token to unsubscribe URLs (prevent unauthorized unsubscribes)
  - **Files**: `apps/web/src/lib/env.ts` (update), various API routes (update)
  - **Done when**: Missing env vars fail fast with clear errors, all inputs validated
  - **Verify**: Temporarily remove DATABASE_URL from env, start server, confirm it fails with a clear error message mentioning DATABASE_URL. Restore env. Send malformed email to subscribe endpoint, confirm 400 error with validation message.
  - **Commit**: `feat(web): harden env validation and zod input validation`
  - _Requirements: FR-43, AC-43.1, AC-43.2, AC-43.3, AC-43.4_
  - _Design: Security Considerations_

- [x] 8.4 [VERIFY] Quality checkpoint: security verification
  - **Do**: Verify all security measures
  - **Verify**: Run all three checks:
    1. `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/admin/sources` returns 401
    2. `curl -X POST http://localhost:3000/api/subscribe -H "Content-Type: application/json" -d '{"email":"notanemail"}' -s -o /dev/null -w "%{http_code}"` returns 400
    3. Grep for hardcoded secrets: `grep -r "sk-ant\|xi-\|re_\|password" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".env"` returns empty
  - **Done when**: Auth blocks unauthorized, validation rejects bad input, no hardcoded secrets
  - **Commit**: `chore(web): pass security quality checkpoint` (only if fixes needed)

---

## Phase 9: Polish & Integration

Focus: Responsive refinement, cyberpunk effects, full end-to-end pipeline run, final quality.

- [x] 9.1 Polish responsive layout across all pages
  - **Do**:
    1. Review all consumer pages at 375px, 768px, 1440px breakpoints
    2. Fix any layout issues: single-column mobile, multi-column desktop at 768px
    3. Ensure all touch targets are minimum 44x44px on mobile
    4. Verify JetBrains Mono headings and Inter body text render correctly
    5. Test mini player doesn't overlap content on mobile
    6. Verify all admin pages are usable at all breakpoints
  - **Files**: Various component and page files (fixes only)
  - **Done when**: All pages render correctly at all 3 breakpoints
  - **Verify**: Take screenshots of every page (digests, detail, podcasts, player, search, archive, admin/*) at 375px, 768px, 1440px. Visually confirm layout correctness, no overflow, no truncation of critical content.
  - **Commit**: `fix(web): polish responsive layout across all pages and breakpoints`
  - _Requirements: FR-40, AC-34.1, AC-34.2, AC-34.3_
  - _Design: Performance Considerations_

- [ ] 9.2 Enhance cyberpunk effects with reduced-motion support
  - **Do**:
    1. Add neon glow effects to active player controls
    2. Add scanline overlay option to card surfaces
    3. Add subtle glitch text animation on page headers
    4. Gate ALL animations behind `@media (prefers-reduced-motion: no-preference)`
    5. Verify useReducedMotion hook disables all effects
    6. Ensure WCAG AA contrast ratios on all text (check neon text on dark backgrounds)
  - **Files**: `apps/web/src/components/effects/*.tsx` (update), `apps/web/src/app/globals.css` (update)
  - **Done when**: Cyberpunk effects visible in default mode, disabled with reduced-motion preference
  - **Verify**: Take screenshots with effects enabled. Set prefers-reduced-motion, retake screenshots confirming animations disabled. Use contrast checker on neon-on-dark text combinations.
  - **Commit**: `feat(web): enhance cyberpunk effects with reduced-motion support`
  - _Requirements: AC-28.5, AC-34.4, NFR-8, NFR-9_
  - _Design: Cyberpunk Design Tokens, Performance Considerations_

- [ ] 9.3 [VERIFY] Quality checkpoint: full monorepo type-check
  - **Do**: Type-check entire monorepo
  - **Verify**: `cd /Users/nick/Desktop/ai-digest && pnpm exec tsc --noEmit -p packages/shared/tsconfig.json && pnpm exec tsc --noEmit -p packages/db/tsconfig.json && pnpm exec tsc --noEmit -p packages/agents/tsconfig.json && pnpm exec tsc --noEmit -p packages/podcast/tsconfig.json && pnpm exec tsc --noEmit -p packages/email/tsconfig.json && pnpm exec tsc --noEmit -p apps/web/tsconfig.json && pnpm exec tsc --noEmit -p apps/worker/tsconfig.json`
  - **Done when**: Zero type errors across entire monorepo
  - **Commit**: `chore(root): pass full monorepo type-check` (only if fixes needed)

- [ ] 9.4 Full end-to-end pipeline run with all outputs
  - **Do**:
    1. Ensure local Postgres + Redis running
    2. Seed sources table with at least 3 sources (1 RSS, 1 HN, 1 ArXiv)
    3. Start worker process
    4. Trigger pipeline via admin API: `curl -X POST -H "x-api-key: $ADMIN_API_KEY" http://localhost:3000/api/admin/pipeline/trigger`
    5. Monitor pipeline_runs and pipeline_stages tables until completion
    6. Verify: items ingested and scored, digest created, podcast episode generated (or marked failed if no ElevenLabs key), newsletter sent (or skipped if no subscribers)
    7. Verify web app shows: digest on feed page, episode in library, search returns results
  - **Files**: (no new files -- integration verification)
  - **Done when**: Full pipeline completes, all outputs visible in web app
  - **Verify**:
    1. `psql ai_digest_dev -c "SELECT status FROM pipeline_runs ORDER BY started_at DESC LIMIT 1"` shows "completed"
    2. `curl http://localhost:3000/api/digests/latest | python3 -m json.tool | head -20` shows latest digest
    3. `curl http://localhost:3000/api/episodes | python3 -m json.tool | head -10` shows episodes
    4. Take screenshots of digest feed page at 3 breakpoints showing real data
  - **Commit**: `feat(root): verify full end-to-end pipeline with all outputs`
  - _Requirements: All success criteria_
  - _Design: Pipeline Data Flow, Audio Generation Flow_

- [ ] 9.5 Add BullMQ cron scheduling for daily pipeline
  - **Do**:
    1. Add cron scheduling to worker: `pipelineQueue.upsertJobScheduler('daily-digest', { pattern: '0 6 * * *' })`
    2. Read schedule from config table (admin can change via dashboard)
    3. Ensure schedule changes take effect without server restart (poll config or use BullMQ scheduler update)
  - **Files**: `apps/worker/src/index.ts` (update)
  - **Done when**: Worker registers cron job, next run time visible
  - **Verify**: Start worker, check logs for "Scheduled daily pipeline at 0 6 * * *". Verify in admin dashboard the next run time is displayed.
  - **Commit**: `feat(worker): add bullmq cron scheduling for daily pipeline`
  - _Requirements: AC-9.1, AC-9.4, AC-38.3_
  - _Design: BullMQ Pipeline Architecture_

---

## Phase 10: Quality Gates

- [ ] 10.1 [VERIFY] Full local CI: type-check all packages + build
  - **Do**: Run complete local quality suite
  - **Verify**: All commands must pass:
    1. Type-check each package: `pnpm exec tsc --noEmit -p packages/shared/tsconfig.json && pnpm exec tsc --noEmit -p packages/db/tsconfig.json && pnpm exec tsc --noEmit -p packages/agents/tsconfig.json && pnpm exec tsc --noEmit -p packages/podcast/tsconfig.json && pnpm exec tsc --noEmit -p packages/email/tsconfig.json && pnpm exec tsc --noEmit -p apps/web/tsconfig.json && pnpm exec tsc --noEmit -p apps/worker/tsconfig.json`
    2. Build web app: `cd apps/web && pnpm build`
    3. Lint (if configured): `pnpm lint` or skip if not yet configured
  - **Done when**: All commands pass with zero errors, web app builds successfully
  - **Commit**: `chore(root): pass full local CI` (if fixes needed)

- [ ] 10.2 Create PR and verify CI
  - **Do**:
    1. Verify current branch is a feature branch: `git branch --show-current`
    2. If on default branch, STOP and alert user
    3. Push branch: `git push -u origin <branch-name>`
    4. Create PR using gh CLI: `gh pr create --title "feat: AI Digest full-stack platform" --body "## Summary\n- Complete AI news aggregation platform\n- 7 source ingestion + Claude AI analysis pipeline\n- Multi-speaker podcast via ElevenLabs + ffmpeg\n- Cyberpunk newsletter via Resend + React Email\n- Consumer web app: digest feed, player, search, archive\n- Admin dashboard: sources, pipeline, config, voices, subscribers\n- Auth middleware + rate limiting + env validation\n\n## Test Plan\n- [ ] Full pipeline run produces digest, podcast, newsletter\n- [ ] All consumer pages render at 3 breakpoints\n- [ ] Admin CRUD operations work\n- [ ] Auth blocks unauthorized access\n- [ ] Rate limiting enforced"`
    5. If gh CLI unavailable, provide URL for manual PR creation
  - **Verify**: `gh pr checks --watch` shows all checks passing (or `gh pr checks` for current status)
  - **Done when**: All CI checks green, PR ready for review
  - **If CI fails**: Read failure details with `gh pr checks`, fix issues, push fixes, re-verify

---

## Phase 11: PR Lifecycle

- [ ] 11.1 Monitor CI and fix failures
  - **Do**:
    1. Run `gh pr checks` to see CI status
    2. If any check fails, read details, fix locally, push
    3. Repeat until all green
  - **Verify**: `gh pr checks` shows all passing
  - **Done when**: All CI checks green
  - **Commit**: `fix(root): address ci failures` (only if fixes needed)

- [ ] 11.2 Address review comments
  - **Do**:
    1. Check for PR review comments: `gh pr view --comments`
    2. Address each comment with code changes
    3. Push fixes
    4. Re-verify CI passes
  - **Verify**: `gh pr checks` all green, no unresolved review threads
  - **Done when**: All review comments addressed, CI green
  - **Commit**: `fix(root): address review feedback`

- [ ] 11.3 [VERIFY] Final AC checklist
  - **Do**: Programmatically verify each major acceptance criteria:
    1. FR-1 through FR-7: Fetchers exist for all 7 sources -- `ls packages/agents/src/fetchers/` shows 7 files
    2. FR-8: NormalizedItem schema -- `grep -l "NormalizedItem" packages/shared/src/types/`
    3. FR-9 through FR-12: AI stages exist -- `ls packages/agents/src/stages/` shows categorize, score, dedup, synthesize
    4. FR-13: Digest assembly -- `ls packages/agents/src/stages/output.ts`
    5. FR-14 through FR-17: Podcast pipeline -- `ls packages/podcast/src/` shows tts, assembler, r2-upload
    6. FR-18 through FR-20: Email -- `ls packages/email/src/` shows templates, send, subscribers
    7. FR-21: Digest feed -- `ls apps/web/src/app/digests/`
    8. FR-22: Podcast player -- `ls apps/web/src/components/podcast/`
    9. FR-26 through FR-31: Admin pages -- `ls apps/web/src/app/admin/`
    10. FR-32: Auth middleware -- `ls apps/web/src/middleware.ts`
    11. FR-33: Rate limiting -- `ls apps/web/src/lib/rate-limit.ts`
    12. FR-34: BullMQ pipeline -- `ls apps/worker/src/processors/`
    13. FR-36: Database schema -- `ls packages/db/src/schema/` shows 7+ files
    14. FR-38: Turborepo structure -- `ls turbo.json`
  - **Verify**: All file existence checks pass
  - **Done when**: All acceptance criteria files exist, pipeline runs end-to-end
  - **Commit**: None

---

## Notes

### POC Shortcuts
- None intentional -- quality-first approach per interview directive

### Architecture Decisions
- Claude Agent SDK used via direct Anthropic SDK calls (not the full query() CLI agent) for structured pipeline stages
- BullMQ flow producer models pipeline as parent-child DAG
- Server Components for all read-only pages; "use client" only for interactive components
- Upstash Redis for rate limiting (separate from Railway Redis for BullMQ)

### Risk Areas
- **Podcast generation** is the most complex pipeline stage (script -> parse -> TTS -> ffmpeg -> R2). Highest failure probability.
- **Claude API costs** must be monitored via BudgetTracker. Default $5/run cap.
- **ElevenLabs quality** depends on voice selection and cross-segment continuity params
- **Full-text search** relies on PostgreSQL GIN indexes; may need tuning for large datasets

### Validation Protocol Reminder
Every frontend task requires:
1. Screenshots at 375px (mobile), 768px (tablet), 1440px (desktop)
2. Visual inspection of each screenshot
3. Backend log correlation for data flow
4. ALL THREE must pass

No test files. No test frameworks. Real system validation only.
