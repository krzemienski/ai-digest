---
spec: full-platform
phase: requirements
created: 2026-02-07T15:00:00-05:00
---

# Requirements: AI Digest — Full-Stack AI News Aggregation Platform

## Goal

Build a complete AI news aggregation platform that ingests content from 7+ sources, analyzes it via Claude Agent SDK research agents, generates daily digests with editorial synthesis, produces multi-speaker podcasts via ElevenLabs, delivers cyberpunk-themed newsletters, and presents everything through a cyberpunk dark-themed web app with an admin dashboard.

## User Decisions

| Question | Decision |
|----------|----------|
| Primary users | Both: Developer/Admin (configures pipeline) and Consumer (browses, listens, subscribes) |
| Priority tradeoffs | Feature completeness -- ship all planned features before launch |
| Success criteria | All planned features functional as specified |
| Additional context | Proceed with research findings as-is |

---

## User Stories

### Domain 1: Content Ingestion

#### US-1: RSS Feed Ingestion
**As a** Developer/Admin
**I want to** configure RSS feed URLs as content sources
**So that** the platform monitors AI/ML blogs and news sites for new articles

**Acceptance Criteria:**
- [ ] AC-1.1: Admin can add/remove/edit RSS feed URLs via admin dashboard
- [ ] AC-1.2: System fetches new items from all configured RSS feeds on each pipeline run
- [ ] AC-1.3: Items include title, link, published date, summary, and author
- [ ] AC-1.4: Duplicate URLs are detected and skipped (no re-ingestion of seen items)
- [ ] AC-1.5: Failed feeds log an error but do not block other feeds

#### US-2: GitHub Trending Repos
**As a** Developer/Admin
**I want to** ingest trending AI/ML repositories from GitHub
**So that** the digest includes notable new open-source projects

**Acceptance Criteria:**
- [ ] AC-2.1: System queries GitHub Search API for repos with AI/ML topics sorted by stars, filtered to recently created
- [ ] AC-2.2: Results include repo name, description, stars, language, creation date, and URL
- [ ] AC-2.3: System respects GitHub rate limits (5,000 req/hr authenticated, 30 search req/min)
- [ ] AC-2.4: GitHub personal access token configurable via environment variable

#### US-3: ArXiv Paper Ingestion
**As a** Developer/Admin
**I want to** ingest recent papers from ArXiv categories (cs.AI, cs.LG, cs.CL)
**So that** the digest covers cutting-edge research

**Acceptance Criteria:**
- [ ] AC-3.1: System queries ArXiv API for papers in configured categories
- [ ] AC-3.2: Respects 3-second delay between ArXiv API requests
- [ ] AC-3.3: Results include title, authors, abstract, categories, published date, and PDF URL
- [ ] AC-3.4: Admin can configure which ArXiv categories to monitor

#### US-4: Hacker News Ingestion
**As a** Developer/Admin
**I want to** ingest top AI/ML stories from Hacker News
**So that** the digest reflects community discussion and trending topics

**Acceptance Criteria:**
- [ ] AC-4.1: System queries HN Algolia API for stories matching AI/ML keywords
- [ ] AC-4.2: Results include title, URL, points, comment count, and post date
- [ ] AC-4.3: Filterable by minimum point threshold (configurable, default: 50 points)

#### US-5: HuggingFace Model Tracking
**As a** Developer/Admin
**I want to** track recently updated models on HuggingFace
**So that** the digest highlights new and notable AI models

**Acceptance Criteria:**
- [ ] AC-5.1: System queries HuggingFace Hub API for recently modified models
- [ ] AC-5.2: Filterable by task type (text-generation, image-classification, etc.)
- [ ] AC-5.3: Results include model name, author, task, downloads, last modified date, and URL

#### US-6: Reddit AI Communities (RSS Fallback)
**As a** Developer/Admin
**I want to** monitor AI subreddits via RSS feeds
**So that** the digest captures community discussions without API approval hurdles

**Acceptance Criteria:**
- [ ] AC-6.1: System fetches subreddit RSS feeds (e.g., `reddit.com/r/MachineLearning/.rss`)
- [ ] AC-6.2: Admin can configure which subreddits to monitor
- [ ] AC-6.3: Results include post title, score, comment count, author, and URL

#### US-7: Product Hunt AI Launches
**As a** Developer/Admin
**I want to** track AI product launches from Product Hunt
**So that** the digest includes new AI tools and products

**Acceptance Criteria:**
- [ ] AC-7.1: System queries Product Hunt GraphQL API for AI-topic posts
- [ ] AC-7.2: Results include product name, tagline, votes, URL, and launch date
- [ ] AC-7.3: Bearer token configurable via environment variable

#### US-8: Content Normalization
**As a** Developer/Admin
**I want** all ingested content normalized to a uniform schema
**So that** downstream analysis operates on consistent data

**Acceptance Criteria:**
- [ ] AC-8.1: All items stored as `NormalizedItem` with fields: id, source, sourceId, sourceUrl, title, summary, content, authors, publishedAt, fetchedAt, categories, metadata
- [ ] AC-8.2: `id` is a deterministic hash of `source + sourceId` (idempotent)
- [ ] AC-8.3: Source-specific metadata preserved in `metadata` JSONB field

#### US-9: Ingestion Scheduling
**As a** Developer/Admin
**I want to** configure when the ingestion pipeline runs
**So that** content is collected on a predictable schedule

**Acceptance Criteria:**
- [ ] AC-9.1: Default schedule: daily at 6:00 AM (configurable cron expression)
- [ ] AC-9.2: Admin can trigger a manual pipeline run from the dashboard
- [ ] AC-9.3: Pipeline run status (running, completed, failed) visible in admin dashboard
- [ ] AC-9.4: BullMQ job persists across server restarts via Redis

---

### Domain 2: AI Analysis Pipeline

#### US-10: Content Categorization
**As a** Developer/Admin
**I want** ingested items automatically categorized by topic
**So that** the digest organizes content by subject area

**Acceptance Criteria:**
- [ ] AC-10.1: Claude Agent SDK (Sonnet model) classifies items into configured topic categories
- [ ] AC-10.2: Topics configurable via admin dashboard (name, keywords, weight)
- [ ] AC-10.3: Each item receives one or more topic tags
- [ ] AC-10.4: Classification runs as a pipeline stage after normalization

#### US-11: Relevance Scoring
**As a** Developer/Admin
**I want** each item scored on relevance, novelty, and impact
**So that** only high-quality content makes it into the digest

**Acceptance Criteria:**
- [ ] AC-11.1: Each item receives `relevanceScore`, `noveltyScore`, `impactScore` (0.0-1.0)
- [ ] AC-11.2: A `compositeScore` combines the three using configurable weights
- [ ] AC-11.3: Scoring weights configurable via admin dashboard
- [ ] AC-11.4: Items below `minScore` threshold are excluded from the digest
- [ ] AC-11.5: Scoring uses Claude Sonnet model via Agent SDK

#### US-12: Cross-Source Deduplication
**As a** Developer/Admin
**I want** duplicate content detected across sources
**So that** the same story from multiple sources appears only once

**Acceptance Criteria:**
- [ ] AC-12.1: Dedup agent identifies items covering the same story/topic across different sources
- [ ] AC-12.2: The highest-scored version is kept; duplicates are linked but excluded
- [ ] AC-12.3: Dedup runs as a pipeline stage after scoring

#### US-13: Editorial Synthesis
**As a** Developer/Admin
**I want** an AI-written editorial summary of the day's top items
**So that** consumers get a human-readable overview without reading every item

**Acceptance Criteria:**
- [ ] AC-13.1: Claude Opus model generates a written summary of the top N items (configurable, default: 15)
- [ ] AC-13.2: Synthesis includes trend analysis across items (connecting themes)
- [ ] AC-13.3: Output style configurable: "brief", "detailed", or "editorial"
- [ ] AC-13.4: Synthesis runs as the final analysis pipeline stage

#### US-14: Agent Cost Controls
**As a** Developer/Admin
**I want** per-run budget caps on Claude API usage
**So that** costs stay predictable and runaway pipelines are stopped

**Acceptance Criteria:**
- [ ] AC-14.1: Each pipeline run has a `maxBudgetUsd` cap (default: $5.00, configurable)
- [ ] AC-14.2: Each agent uses the cheapest viable model (Haiku for scanning, Sonnet for analysis, Opus for synthesis)
- [ ] AC-14.3: `maxTurns` set per agent to prevent infinite loops
- [ ] AC-14.4: Budget exceeded triggers a graceful stop with partial results saved

#### US-15: Pipeline Resumability
**As a** Developer/Admin
**I want** failed pipeline stages to be retryable without re-running completed stages
**So that** transient failures don't waste time and money

**Acceptance Criteria:**
- [ ] AC-15.1: BullMQ flow tracks completion status of each stage (ingest, normalize, categorize, score, dedup, synthesize, output)
- [ ] AC-15.2: Failed stage can be retried independently
- [ ] AC-15.3: Configurable retry count and backoff per stage (default: 3 retries, exponential backoff)

---

### Domain 3: Digest Generation

#### US-16: Daily Digest Creation
**As a** Consumer
**I want to** read a daily digest of top AI news
**So that** I stay informed without reading dozens of sources

**Acceptance Criteria:**
- [ ] AC-16.1: System generates one digest per pipeline run containing top scored items + editorial synthesis
- [ ] AC-16.2: Digest stored in database with date, items, synthesis text, and metadata
- [ ] AC-16.3: Digest accessible via web app and newsletter

#### US-17: Digest Formatting
**As a** Consumer
**I want** the digest formatted with sections, summaries, and source links
**So that** I can scan quickly and deep-dive on interesting items

**Acceptance Criteria:**
- [ ] AC-17.1: Digest organized by topic sections
- [ ] AC-17.2: Each item shows: title, one-line summary, source, score indicator, and link
- [ ] AC-17.3: Editorial synthesis appears at the top as an overview
- [ ] AC-17.4: Digest includes item count and date range

---

### Domain 4: Podcast Production

#### US-18: Podcast Script Generation
**As a** Developer/Admin
**I want** Claude to generate a conversational podcast script from the digest
**So that** the podcast feels like a natural dialogue between hosts

**Acceptance Criteria:**
- [ ] AC-18.1: Claude Opus generates a multi-speaker dialogue script from the digest items
- [ ] AC-18.2: Script labels each segment with speaker name (e.g., "Host A", "Host B")
- [ ] AC-18.3: Script includes intro, topic transitions, and outro
- [ ] AC-18.4: Script length configurable (default: ~15 minutes of spoken content)

#### US-19: Multi-Speaker TTS Generation
**As a** Developer/Admin
**I want** the script converted to audio using distinct ElevenLabs voices
**So that** the podcast sounds like a real multi-host show

**Acceptance Criteria:**
- [ ] AC-19.1: Script parsed into ordered segments by speaker
- [ ] AC-19.2: Each speaker mapped to a distinct ElevenLabs voice ID (configurable)
- [ ] AC-19.3: TTS uses `previous_request_ids` for cross-segment continuity
- [ ] AC-19.4: Audio generated at mp3_44100_128 quality (configurable)
- [ ] AC-19.5: Generation completes within 10 minutes for a 15-minute episode

#### US-20: Audio Assembly
**As a** Developer/Admin
**I want** TTS segments concatenated into a single podcast episode
**So that** consumers get one continuous audio file

**Acceptance Criteria:**
- [ ] AC-20.1: Segments joined in order using ffmpeg
- [ ] AC-20.2: Optional intro/outro audio files prepended/appended
- [ ] AC-20.3: Final audio uploaded to Cloudflare R2 with a public URL
- [ ] AC-20.4: Episode metadata (title, date, duration, R2 URL) stored in database

#### US-21: Podcast Voice Configuration
**As a** Developer/Admin
**I want to** configure podcast voice settings from the admin dashboard
**So that** I can tune the podcast sound without code changes

**Acceptance Criteria:**
- [ ] AC-21.1: Admin can select ElevenLabs voice IDs for each speaker role
- [ ] AC-21.2: Admin can adjust stability, similarity_boost, speed, and style per voice
- [ ] AC-21.3: Admin can preview a short TTS sample before committing settings
- [ ] AC-21.4: Changes apply to the next episode generation

---

### Domain 5: Newsletter Delivery

#### US-22: Newsletter Template
**As a** Consumer
**I want** the newsletter to have a visually appealing cyberpunk design
**So that** the email matches the platform's aesthetic

**Acceptance Criteria:**
- [ ] AC-22.1: Email template built with React Email components
- [ ] AC-22.2: Uses off-black `#0D0D14` background and off-white `#F0F0F5` text (avoids Gmail dark-mode inversion)
- [ ] AC-22.3: Neon accent colors (cyan `#00FFFF`, green `#00FF88`, magenta `#FF0066`) used for highlights
- [ ] AC-22.4: All styles inlined for Gmail compatibility
- [ ] AC-22.5: Max width 600px
- [ ] AC-22.6: Includes one-click unsubscribe header (Gmail 2024+ requirement)

#### US-23: Newsletter Sending
**As a** Developer/Admin
**I want** the newsletter sent automatically after each digest is generated
**So that** subscribers receive the digest without manual intervention

**Acceptance Criteria:**
- [ ] AC-23.1: Resend API sends the newsletter to all active subscribers
- [ ] AC-23.2: Sending triggered as the final pipeline output stage
- [ ] AC-23.3: Send status (delivered, bounced, failed) tracked per recipient
- [ ] AC-23.4: Failed sends retried up to 3 times with backoff

#### US-24: Subscriber Management
**As a** Consumer
**I want to** subscribe to the newsletter with my email address
**So that** I receive daily digests in my inbox

**Acceptance Criteria:**
- [ ] AC-24.1: Subscribe form on web app collects email address
- [ ] AC-24.2: Subscriber created in Resend audience via Contacts API
- [ ] AC-24.3: Duplicate emails rejected with user-friendly message
- [ ] AC-24.4: Unsubscribe link in every email removes subscriber from audience
- [ ] AC-24.5: Admin can view subscriber count and list in admin dashboard

#### US-25: Email Domain Setup
**As a** Developer/Admin
**I want** emails sent from a custom domain
**So that** deliverability is high and emails don't land in spam

**Acceptance Criteria:**
- [ ] AC-25.1: DKIM, SPF, and DMARC DNS records documented in setup guide
- [ ] AC-25.2: Domain verified in Resend before production sending
- [ ] AC-25.3: Sender address format: `digest@{custom-domain}`

---

### Domain 6: Web Application

#### US-26: Digest Feed View
**As a** Consumer
**I want to** browse the daily digest in a card-based feed
**So that** I can scan headlines and click into interesting items

**Acceptance Criteria:**
- [ ] AC-26.1: Feed displays digest items as cards with title, summary, source badge, score indicator, and publish date
- [ ] AC-26.2: Cards grouped by topic section
- [ ] AC-26.3: Editorial synthesis shown at the top of the feed
- [ ] AC-26.4: Feed loads the latest digest by default; previous digests navigable by date
- [ ] AC-26.5: Cyberpunk dark theme with neon accents applied (background `#0D0D14`, card surface `#12121A`)

#### US-27: Digest Item Detail
**As a** Consumer
**I want to** view full details of a digest item
**So that** I can read the summary and follow the source link

**Acceptance Criteria:**
- [ ] AC-27.1: Detail view shows full summary, source metadata, scores, and direct link to original source
- [ ] AC-27.2: Related items from the same topic listed below
- [ ] AC-27.3: Accessible via card tap/click from the feed

#### US-28: Podcast Player (Full Screen)
**As a** Consumer
**I want to** listen to podcast episodes in a full-screen player
**So that** I have controls for playback, speed, and progress

**Acceptance Criteria:**
- [ ] AC-28.1: Player shows episode title, date, and duration
- [ ] AC-28.2: Controls: play/pause, skip forward 30s, skip back 15s, seek bar
- [ ] AC-28.3: Speed selector: 0.5x, 1x, 1.25x, 1.5x, 2x
- [ ] AC-28.4: Progress bar shows elapsed and remaining time
- [ ] AC-28.5: Cyberpunk styling with neon glow effects on active controls
- [ ] AC-28.6: Touch targets minimum 44x44px

#### US-29: Mini Player
**As a** Consumer
**I want** a persistent mini player bar while browsing other pages
**So that** I can continue listening while reading the feed

**Acceptance Criteria:**
- [ ] AC-29.1: Mini player appears at bottom of screen when audio is playing
- [ ] AC-29.2: Shows episode title (truncated), play/pause button, and progress indicator
- [ ] AC-29.3: Tapping mini player expands to full-screen player
- [ ] AC-29.4: Mini player height: 56-64px
- [ ] AC-29.5: Audio state managed via Zustand store (persists across page navigation)

#### US-30: Podcast Transcript View
**As a** Consumer
**I want to** read the podcast transcript while listening
**So that** I can follow along, search for topics, and jump to specific moments

**Acceptance Criteria:**
- [ ] AC-30.1: Transcript displays speaker-labeled segments with timestamps
- [ ] AC-30.2: Tapping a timestamp jumps audio playback to that position
- [ ] AC-30.3: Current segment highlighted and auto-scrolled during playback
- [ ] AC-30.4: Each speaker has a distinct color label
- [ ] AC-30.5: In-transcript text search with match highlighting

#### US-31: Episode Library
**As a** Consumer
**I want to** browse past podcast episodes
**So that** I can listen to episodes I missed

**Acceptance Criteria:**
- [ ] AC-31.1: Library lists episodes by date (newest first)
- [ ] AC-31.2: Each entry shows title, date, duration, and play button
- [ ] AC-31.3: Tapping an episode opens the full-screen player

#### US-32: Search
**As a** Consumer
**I want to** search across digests and podcast transcripts
**So that** I can find specific topics or articles

**Acceptance Criteria:**
- [ ] AC-32.1: Search input accepts free-text queries
- [ ] AC-32.2: Results include matching digest items and transcript segments
- [ ] AC-32.3: Results show title, matched snippet, date, and source
- [ ] AC-32.4: PostgreSQL full-text search on titles, summaries, and transcript text

#### US-33: Newsletter Archive
**As a** Consumer
**I want to** browse past newsletters on the web
**So that** I can read digests I missed or didn't subscribe to

**Acceptance Criteria:**
- [ ] AC-33.1: Archive lists past digests by date
- [ ] AC-33.2: Each entry renders the digest content in the cyberpunk web theme (not email HTML)
- [ ] AC-33.3: Archive is publicly accessible (no auth required)

#### US-34: Responsive Layout
**As a** Consumer
**I want** the web app to work well on mobile and desktop
**So that** I can use it on any device

**Acceptance Criteria:**
- [ ] AC-34.1: Layout adapts from single-column (mobile) to multi-column (desktop) at 768px breakpoint
- [ ] AC-34.2: Touch targets minimum 44x44px on mobile
- [ ] AC-34.3: Typography uses JetBrains Mono for headings and Inter for body text
- [ ] AC-34.4: All cyberpunk effects respect `prefers-reduced-motion: reduce`

---

### Domain 7: Admin Dashboard

#### US-35: Source Management
**As a** Developer/Admin
**I want to** manage content sources from a dashboard
**So that** I can add, remove, and configure sources without code changes

**Acceptance Criteria:**
- [ ] AC-35.1: Dashboard lists all configured sources with type, URL/config, and enabled/disabled toggle
- [ ] AC-35.2: Admin can add new sources (RSS URL, GitHub query, ArXiv categories, HN keywords, etc.)
- [ ] AC-35.3: Admin can edit or delete existing sources
- [ ] AC-35.4: Changes take effect on the next pipeline run

#### US-36: Pipeline Monitoring
**As a** Developer/Admin
**I want to** see pipeline run status, logs, and history
**So that** I can diagnose failures and monitor system health

**Acceptance Criteria:**
- [ ] AC-36.1: Dashboard shows current pipeline status (idle, running, failed, completed)
- [ ] AC-36.2: Run history lists recent runs with date, duration, items processed, and status
- [ ] AC-36.3: Each run expandable to show per-stage status and timing
- [ ] AC-36.4: Error details shown for failed stages
- [ ] AC-36.5: Manual "Run Now" button triggers an immediate pipeline execution

#### US-37: Analysis Configuration
**As a** Developer/Admin
**I want to** configure scoring weights, topic categories, and synthesis settings
**So that** I can tune the digest output without code changes

**Acceptance Criteria:**
- [ ] AC-37.1: Admin can add/edit/remove topic categories (name, keywords, weight)
- [ ] AC-37.2: Admin can adjust scoring weights (novelty, impact, relevance) and minimum score threshold
- [ ] AC-37.3: Admin can set synthesis style (brief/detailed/editorial) and max items
- [ ] AC-37.4: Admin can set per-run budget cap (`maxBudgetUsd`)

#### US-38: Schedule Configuration
**As a** Developer/Admin
**I want to** configure the pipeline schedule
**So that** I can change run frequency without redeploying

**Acceptance Criteria:**
- [ ] AC-38.1: Admin can set cron expression for the pipeline schedule
- [ ] AC-38.2: Current schedule displayed with next run time
- [ ] AC-38.3: Schedule changes take effect without server restart

#### US-39: Voice & Podcast Settings
**As a** Developer/Admin
**I want to** configure podcast generation settings
**So that** I can change voices, episode length, and audio quality

**Acceptance Criteria:**
- [ ] AC-39.1: Admin can select voices for each speaker from available ElevenLabs voices
- [ ] AC-39.2: Admin can set target episode duration (minutes)
- [ ] AC-39.3: Admin can configure audio format and quality
- [ ] AC-39.4: Admin can toggle podcast generation on/off per pipeline run

#### US-40: Subscriber Dashboard
**As a** Developer/Admin
**I want to** view newsletter subscriber metrics
**So that** I can track growth and deliverability

**Acceptance Criteria:**
- [ ] AC-40.1: Dashboard shows total subscriber count, new subscribers (7d), and unsubscribe count (7d)
- [ ] AC-40.2: Recent send history with delivery/bounce/open rates (via Resend webhooks)
- [ ] AC-40.3: Admin can export subscriber list

---

### Domain 8: Authentication & Security

#### US-41: Admin Authentication
**As a** Developer/Admin
**I want** the admin dashboard protected by authentication
**So that** only authorized users can configure the platform

**Acceptance Criteria:**
- [ ] AC-41.1: Admin routes (`/admin/*`, `/api/admin/*`) require authentication
- [ ] AC-41.2: v1 uses API key authentication (stored as env var, validated via middleware)
- [ ] AC-41.3: Unauthenticated requests return 401
- [ ] AC-41.4: Admin login page accepts API key and sets a session cookie

#### US-42: API Rate Limiting
**As a** Developer/Admin
**I want** public API endpoints rate-limited
**So that** the system is protected from abuse

**Acceptance Criteria:**
- [ ] AC-42.1: Subscribe endpoint rate-limited to 10 requests per minute per IP
- [ ] AC-42.2: Public digest/podcast API endpoints rate-limited to 60 requests per minute per IP
- [ ] AC-42.3: Rate limit exceeded returns 429 with `Retry-After` header

#### US-43: Environment Variable Security
**As a** Developer/Admin
**I want** all secrets stored as environment variables
**So that** no credentials are hardcoded or committed to source control

**Acceptance Criteria:**
- [ ] AC-43.1: All API keys (Anthropic, ElevenLabs, Resend, GitHub, R2) read from env vars
- [ ] AC-43.2: `.env.local` file included in `.gitignore`
- [ ] AC-43.3: Env vars validated at startup using `@t3-oss/env-nextjs` with Zod schemas
- [ ] AC-43.4: Missing required env vars cause a clear startup error with the var name

---

### Domain 9: Infrastructure & Deployment

#### US-44: Monorepo Setup
**As a** Developer/Admin
**I want** the project organized as a Turborepo monorepo
**So that** packages share types and build efficiently

**Acceptance Criteria:**
- [ ] AC-44.1: Turborepo config with packages: `agents`, `db`, `email`, `podcast`, `shared`
- [ ] AC-44.2: Apps: `web` (Next.js App Router)
- [ ] AC-44.3: Shared TypeScript config (`tsconfig.base.json`)
- [ ] AC-44.4: `turbo.json` defines build, dev, and lint pipelines

#### US-45: Database Schema
**As a** Developer/Admin
**I want** the database schema defined with Drizzle ORM
**So that** schema changes are version-controlled and type-safe

**Acceptance Criteria:**
- [ ] AC-45.1: Tables: `sources`, `normalized_items`, `digests`, `digest_items`, `episodes`, `transcripts`, `subscribers`, `pipeline_runs`, `pipeline_stages`, `config`
- [ ] AC-45.2: Drizzle schema files in `packages/db/src/schema/`
- [ ] AC-45.3: Migrations generated via `drizzle-kit generate` and applied via `drizzle-kit push`
- [ ] AC-45.4: JSONB columns for flexible metadata storage

#### US-46: Audio File Storage
**As a** Developer/Admin
**I want** podcast audio files stored on Cloudflare R2
**So that** streaming is fast and egress costs are zero

**Acceptance Criteria:**
- [ ] AC-46.1: Audio files uploaded to R2 bucket after generation
- [ ] AC-46.2: Public URLs generated for each episode
- [ ] AC-46.3: R2 credentials (access key, secret, endpoint, bucket) configurable via env vars
- [ ] AC-46.4: S3-compatible SDK used for uploads (`@aws-sdk/client-s3`)

#### US-47: Railway Deployment
**As a** Developer/Admin
**I want** the platform deployed to Railway
**So that** I have persistent containers, built-in Postgres/Redis, and cron support

**Acceptance Criteria:**
- [ ] AC-47.1: Railway project with services: `web` (Next.js), `worker` (BullMQ), `postgres`, `redis`
- [ ] AC-47.2: Git-push triggers automatic deploys
- [ ] AC-47.3: Environment variables configured in Railway dashboard
- [ ] AC-47.4: Cron service triggers daily pipeline at configured schedule

#### US-48: Pipeline Worker
**As a** Developer/Admin
**I want** a dedicated worker process for the agent pipeline
**So that** long-running pipeline jobs don't block the web server

**Acceptance Criteria:**
- [ ] AC-48.1: Worker process runs BullMQ workers consuming from pipeline queues
- [ ] AC-48.2: Worker runs independently of the Next.js web process
- [ ] AC-48.3: Worker logs pipeline progress to database (`pipeline_runs`, `pipeline_stages`)
- [ ] AC-48.4: Worker restarts automatically on crash (Railway health checks)

---

## Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-1 | Ingest content from RSS feeds | P0 | RSS parser fetches, normalizes, and stores items |
| FR-2 | Ingest content from Hacker News (Algolia API) | P0 | HN stories fetched, normalized, stored |
| FR-3 | Ingest content from ArXiv API | P0 | Papers fetched with 3s delay, normalized, stored |
| FR-4 | Ingest content from GitHub Search API | P0 | Trending repos fetched, normalized, stored |
| FR-5 | Ingest content from HuggingFace Hub API | P1 | Models fetched, filtered by task, normalized, stored |
| FR-6 | Ingest content from Reddit via RSS | P1 | Subreddit RSS feeds parsed, normalized, stored |
| FR-7 | Ingest content from Product Hunt GraphQL API | P2 | AI products fetched, normalized, stored |
| FR-8 | Normalize all items to uniform schema | P0 | `NormalizedItem` schema with deterministic ID |
| FR-9 | Categorize items by topic (Claude Sonnet) | P0 | Items tagged with configured topic categories |
| FR-10 | Score items on relevance/novelty/impact (Claude Sonnet) | P0 | 0-1 scores with configurable weights |
| FR-11 | Deduplicate across sources | P0 | Same story from multiple sources collapsed to one |
| FR-12 | Generate editorial synthesis (Claude Opus) | P0 | Written summary with trend analysis |
| FR-13 | Generate daily digest | P0 | Digest object with items + synthesis + metadata |
| FR-14 | Generate podcast script from digest (Claude Opus) | P0 | Multi-speaker dialogue script |
| FR-15 | Convert script to audio via ElevenLabs TTS | P0 | Per-speaker TTS with continuity params |
| FR-16 | Concatenate audio segments with ffmpeg | P0 | Single MP3 file from ordered segments |
| FR-17 | Upload audio to Cloudflare R2 | P0 | Public URL for streaming |
| FR-18 | Build cyberpunk email template (React Email) | P0 | Dark-theme, inline styles, 600px max-width |
| FR-19 | Send newsletter via Resend API | P0 | Batch send to all active subscribers |
| FR-20 | Subscriber sign-up and unsubscribe | P0 | Add/remove from Resend audience |
| FR-21 | Web app digest feed (Next.js) | P0 | Card-based feed with cyberpunk theme |
| FR-22 | Web app podcast player | P0 | Full-screen + mini player with Zustand state |
| FR-23 | Web app transcript viewer | P1 | Speaker labels, timestamps, auto-scroll |
| FR-24 | Web app search | P1 | Full-text search across digests and transcripts |
| FR-25 | Web app newsletter archive | P1 | Browse past digests on web |
| FR-26 | Admin dashboard: source management | P0 | CRUD sources via UI |
| FR-27 | Admin dashboard: pipeline monitoring | P0 | Status, history, logs, manual trigger |
| FR-28 | Admin dashboard: analysis config | P0 | Topics, weights, synthesis style |
| FR-29 | Admin dashboard: schedule config | P1 | Cron expression editor |
| FR-30 | Admin dashboard: voice config | P1 | ElevenLabs voice selection and tuning |
| FR-31 | Admin dashboard: subscriber metrics | P1 | Count, growth, deliverability stats |
| FR-32 | Admin authentication (API key) | P0 | Middleware + login page |
| FR-33 | API rate limiting | P1 | Per-IP limits on public endpoints |
| FR-34 | BullMQ pipeline orchestration | P0 | Job flows with retry and resumability |
| FR-35 | Railway deployment config | P0 | Web + worker + postgres + redis services |
| FR-36 | Drizzle ORM database schema | P0 | All tables defined, migrations working |
| FR-37 | Cloudflare R2 audio storage | P0 | Upload + public URL generation |
| FR-38 | Turborepo monorepo structure | P0 | Packages: agents, db, email, podcast, shared |
| FR-39 | Agent cost controls (maxBudgetUsd, model routing) | P0 | Budget cap per run, cheapest viable model per task |
| FR-40 | Responsive web layout (mobile + desktop) | P0 | Single-column mobile, multi-column desktop at 768px |

---

## Non-Functional Requirements

| ID | Requirement | Metric | Target |
|----|-------------|--------|--------|
| NFR-1 | Pipeline completion time | End-to-end duration | < 30 minutes per daily run |
| NFR-2 | Web app page load | Time to Interactive (TTI) | < 3 seconds on 4G |
| NFR-3 | Audio streaming start | Time to first byte | < 2 seconds from R2 CDN |
| NFR-4 | Agent API cost | Daily Claude API spend | < $5.00 per run (default cap) |
| NFR-5 | Email deliverability | Inbox placement rate | > 95% (via DKIM/SPF/DMARC) |
| NFR-6 | Uptime | Service availability | > 99% (Railway managed) |
| NFR-7 | Data freshness | Content age at digest time | < 24 hours for all sources |
| NFR-8 | Accessibility (web) | WCAG compliance | AA for all text contrast ratios |
| NFR-9 | Accessibility (motion) | Reduced motion | All animations disabled when `prefers-reduced-motion: reduce` |
| NFR-10 | Security | Secrets management | Zero hardcoded secrets; all via env vars |
| NFR-11 | Security | Auth bypass | Zero unauthenticated admin access |
| NFR-12 | Database performance | Query response | < 200ms for feed/search queries |
| NFR-13 | Audio file size | Episode storage | < 50MB per 15-min episode (MP3 128kbps) |
| NFR-14 | Monthly infrastructure cost | Total platform cost | < $100/month at launch |
| NFR-15 | Build time | Turborepo full build | < 5 minutes |

---

## Glossary

- **Digest**: A curated collection of top AI news items with editorial synthesis, produced once per pipeline run
- **NormalizedItem**: Uniform data schema for content from any source (RSS, GitHub, ArXiv, etc.)
- **Pipeline**: The multi-stage process: ingest -> normalize -> categorize -> score -> dedup -> synthesize -> output
- **Pipeline Run**: A single execution of the full pipeline, typically triggered daily
- **Composite Score**: Weighted combination of relevance, novelty, and impact scores (0.0-1.0)
- **Editorial Synthesis**: AI-written summary connecting themes across digest items
- **Episode**: A single podcast audio file generated from a digest
- **Transcript**: Speaker-labeled text segments with timestamps from a podcast script
- **Subscriber**: A user who has opted in to receive newsletters via email
- **BullMQ Flow**: A parent-child job graph where children must complete before the parent proceeds
- **R2**: Cloudflare's S3-compatible object storage with zero egress fees
- **Agent**: A Claude SDK subagent with a specific role, model, and tool set

---

## Out of Scope

- Native mobile app (Expo/React Native) -- web-only for v1
- User accounts / multi-user auth (admin-only auth for v1)
- Payment / billing / monetization
- Social features (comments, likes, sharing between users)
- Push notifications
- Voice cloning / custom voice training
- Real-time / streaming podcast playback during generation
- Multi-language support (English only for v1)
- A/B testing of digest content
- Analytics dashboards for consumer behavior
- RSS feed output (providing an RSS feed of digests)
- Offline support / PWA caching
- OAuth2 Reddit API integration (using RSS fallback instead)

---

## Dependencies

| Dependency | Type | Risk | Mitigation |
|------------|------|------|------------|
| Anthropic Claude API | External service | Medium -- cost variability | `maxBudgetUsd` cap, model routing (Haiku/Sonnet/Opus) |
| ElevenLabs TTS API | External service | Low -- quality/availability | Test voice settings, fallback to skip podcast on failure |
| Resend Email API | External service | Low | Free tier covers early usage; SendGrid as backup |
| Cloudflare R2 | External service | Low | S3-compatible; easily swap to AWS S3 |
| GitHub API | External service | Low | Authenticated rate limits generous (5K/hr) |
| ArXiv API | External service | Low | No auth, but 3s delay required |
| HN Algolia API | External service | Low | No auth, generous limits |
| Product Hunt API | External service | Medium | Auth required; limited docs on rate limits |
| Redis | Infrastructure | Low | Railway includes Redis add-on |
| PostgreSQL | Infrastructure | Low | Railway includes Postgres add-on |
| ffmpeg | System dependency | Low | Available on Railway containers |
| Custom domain + DNS | Setup | Medium | Required for email deliverability; manual DNS setup |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Claude API costs exceed $5/day default | Medium | High | `maxBudgetUsd` enforced; Haiku for cheap tasks; prompt caching |
| ElevenLabs audio quality inconsistent | Low | Medium | Cross-segment continuity params; admin-tunable voice settings |
| Pipeline exceeds 30-min target | Medium | Medium | Parallelize ingestion; timeout per stage; skip low-priority sources |
| Reddit API access blocked | Medium | Low | RSS fallback already planned as primary approach |
| BullMQ/Redis failure loses jobs | Low | High | Redis persistence (AOF); retry policies; alerting |
| Email deliverability issues | Low | Medium | DKIM/SPF/DMARC setup; Resend reputation management |
| Stitch design generation inconsistency | Medium | Low | Prompt templates; manual design tokens; reference-only usage |

---

## Success Criteria

1. All 7 sources (RSS, GitHub, ArXiv, HN, HuggingFace, Reddit RSS, Product Hunt) successfully ingested and normalized
2. AI analysis pipeline produces scored, deduplicated, synthesized digest daily
3. Podcast episode (10-20 min) generated with 2 distinct voices and uploaded to R2
4. Newsletter delivered to subscribers via Resend with cyberpunk template
5. Web app displays digest feed, podcast player (full + mini), transcript, search, and archive
6. Admin dashboard allows configuration of sources, pipeline, voices, schedule, and subscribers
7. Pipeline runs on schedule (daily) and on manual trigger
8. Total monthly cost under $100 at launch
9. All web UI text passes WCAG AA contrast ratios
10. Pipeline completes within 30 minutes per run

---

## Next Steps

1. Review and approve requirements
2. Proceed to architecture/design phase -- define database schema, API routes, component tree
3. Implement in phases: pipeline MVP -> web UI -> podcast -> newsletter -> admin dashboard
