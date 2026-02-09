---
title: "Podcast Time Windows, Source Expansion & AI Discovery"
status: draft
version: "1.0"
---

# Product Requirements Document

## Validation Checklist

### CRITICAL GATES (Must Pass)

- [x] All required sections are complete
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Problem statement is specific and measurable
- [x] Every feature has testable acceptance criteria (Gherkin format)
- [x] No contradictions between sections

### QUALITY CHECKS (Should Pass)

- [x] Problem is validated by evidence (not assumptions)
- [x] Context → Problem → Solution flow makes sense
- [x] Every persona has at least one user journey
- [x] All MoSCoW categories addressed (Must/Should/Could/Won't)
- [x] Every metric has corresponding tracking events
- [x] No feature redundancy (check for duplicates)
- [x] No technical implementation details included
- [x] A new team member could understand this PRD

---

## Product Overview

### Vision

AI Digest users can generate podcasts covering any time window of AI news — from yesterday's headlines to a week-long deep dive — powered by 50+ curated sources that users can expand via AI-assisted discovery, all using their own API keys.

### Problem Statement

Today, podcast generation is locked to a single day's digest. The pipeline fetches news, creates a daily digest, and podcasts can only reference that one day's content. This creates three concrete problems:

1. **No weekly recap option**: Users who want a comprehensive weekly AI podcast cannot generate one — the system only knows about today's articles (70 items from 5 sources). A weekly podcast covering 7 days of news from 50+ sources would be dramatically richer.
2. **Thin source coverage**: Only 5 sources are configured in production (Ars Technica, HN, GitHub, ArXiv, HuggingFace), despite 7 fetcher types being implemented. The seed file has 21 sources but they were never inserted. Users cannot easily discover and add new sources.
3. **No self-service**: API keys are hardcoded in server environment variables. Open-source deployers must manually edit `.env` files — there's no UI for key management.

### Value Proposition

AI Digest becomes the only open-source AI news podcast platform where users control the time window (daily brief vs. weekly deep dive), choose from 50+ pre-configured sources or discover new ones via AI, and manage everything through a self-service dashboard without touching config files.

## User Personas

### Primary Persona: Self-Hosted Admin ("Alex")
- **Demographics:** Tech-savvy developer or team lead, 25-45, runs AI Digest on their own infrastructure
- **Goals:** Generate high-quality AI news podcasts on a schedule they control, with sources tailored to their interests
- **Pain Points:** Currently limited to daily-only podcasts; adding sources requires database knowledge; API keys require server access to change

### Secondary Persona: Open-Source Deployer ("Sam")
- **Demographics:** DevOps engineer or hobby developer, 20-50, clones repo and deploys via Docker or bare metal
- **Goals:** Get a working AI podcast pipeline up and running quickly with minimal configuration
- **Pain Points:** First-run experience is thin (only 5 sources); no onboarding for API key setup; no guidance on what sources to add

### Tertiary Persona: Casual Listener ("Jordan")
- **Demographics:** Non-technical professional, 25-55, consumes the podcast output but doesn't manage the platform
- **Goals:** Listen to AI news podcasts that match their preferred cadence (daily brief or weekly deep dive)
- **Pain Points:** Current daily-only format may be too granular or miss stories from days they didn't generate

## User Journey Maps

### Primary Journey: Configuring a Weekly Podcast
1. **Awareness:** Alex notices the podcast only covers today's news and wants a comprehensive weekly recap
2. **Configuration:** Alex navigates to Admin → Podcast, sees a new "Time Window" selector with options: Last 24h, Last 3 days, Last 7 days, Custom range
3. **Selection:** Alex picks "Last 7 days" and configures 30-minute duration with Professional style
4. **Generation:** System queries all normalized items from the past 7 days across all enabled sources, generates a richer, longer-form podcast
5. **Listening:** The resulting podcast covers the week's most important AI developments with proper context and cross-referencing

### Secondary Journey: Expanding Sources via AI Discovery
1. **Trigger:** Sam has 5 default sources and wants more diversity — clicks "Discover Sources" button in Admin → Sources
2. **Input:** A modal asks for topic preferences (e.g., "robotics, computer vision, AI ethics") and desired source count
3. **Discovery:** An AI agent researches the web, finds RSS feeds, subreddits, GitHub topics, and ArXiv categories matching the preferences
4. **Review:** Agent presents 20-30 candidate sources with validation status (feed reachable, last updated date)
5. **Approval:** Sam reviews the list, toggles sources on/off, clicks "Add Selected" to bulk-insert into the database
6. **Enrichment:** Next pipeline run fetches from the newly added sources, enriching future digests and podcasts

### Tertiary Journey: First-Run Setup with API Keys
1. **Deploy:** Sam clones the repo and runs `docker compose up`
2. **Onboarding:** Admin dashboard shows a setup wizard for API keys (Anthropic, ElevenLabs)
3. **Entry:** Sam enters their API keys through the UI — keys are stored encrypted in the database
4. **Validation:** System tests each key with a lightweight API call and shows green/red status
5. **Ready:** Sam can now generate podcasts without ever editing a `.env` file

## Feature Requirements

### Must Have Features

#### Feature 1: Time Window Selector for Podcast Generation
- **User Story:** As an admin, I want to choose how many days of news to include in a podcast so that I can generate daily briefs or weekly deep dives.
- **Acceptance Criteria:**
  - [x] Given the admin is on the Podcast Dashboard, When they view the generation form, Then they see a "Time Window" selector with options: Last 24h, Last 3 days, Last 7 days, Last 14 days, Custom range
  - [x] Given the admin selects "Last 7 days", When they click Generate, Then the system queries normalized_items where publishedAt >= (now - 7 days) regardless of which digest they belong to
  - [x] Given the admin selects "Custom range", When they pick Feb 1 to Feb 7, Then only items published in that date range are used for script generation
  - [x] Given a time window of 7 days with 50+ sources enabled, When the podcast is generated, Then the script references items from multiple days and multiple source types
  - [x] Given no items exist in the selected time window, When the admin clicks Generate, Then a clear error message is shown: "No items found for the selected date range"

#### Feature 2: 50+ Default Sources
- **User Story:** As a new deployer, I want the platform to ship with at least 50 high-quality AI/ML sources pre-configured so that I get rich content from day one.
- **Acceptance Criteria:**
  - [x] Given a fresh installation, When the database is seeded, Then at least 50 sources exist across all 7 fetcher types (RSS, GitHub, ArXiv, HN, HuggingFace, Reddit, ProductHunt)
  - [x] Given the seed sources, When I examine them, Then they include: AI labs (OpenAI, Anthropic, DeepMind, Meta, Google, Microsoft, NVIDIA, Apple), major tech publications (Verge, Ars, TechCrunch, VentureBeat, MIT TR, Wired, IEEE), research blogs (BAIR, Stanford HAI, fast.ai, Distill), newsletters (Import AI, The Batch, Last Week in AI), subreddits (r/MachineLearning, r/LocalLLaMA, r/artificial, r/deeplearning), and academic sources (ArXiv cs.AI/CL/CV/LG, Nature ML)
  - [x] Given each seed source, When the pipeline runs, Then the source successfully returns items without errors (validated by functional test)
  - [x] Given the 50+ sources are enabled, When a full pipeline run completes, Then at least 200 normalized items are ingested

#### Feature 3: AI-Powered Source Discovery
- **User Story:** As an admin, I want to click a button that uses AI to find new high-quality sources based on my interests so that I can expand coverage without manual research.
- **Acceptance Criteria:**
  - [x] Given the admin is on Admin → Sources, When they click "Discover Sources", Then a modal appears asking for topic preferences and maximum number of sources to find
  - [x] Given the admin enters "robotics, autonomous vehicles" and limit 20, When they click "Start Discovery", Then an AI agent searches for relevant RSS feeds, subreddits, GitHub topics, and ArXiv categories
  - [x] Given the agent completes discovery, When results are displayed, Then each candidate shows: name, type, URL/config, validation status (reachable/unreachable), and a toggle to include/exclude
  - [x] Given the admin selects 15 of 20 candidates, When they click "Add Selected", Then all 15 are inserted into the sources table with enabled=true
  - [x] Given a discovered source duplicates an existing one (same URL or config), When displayed, Then it is flagged as "Already exists" and excluded by default

#### Feature 4: Self-Service API Key Management
- **User Story:** As a self-hosted deployer, I want to manage my Anthropic and ElevenLabs API keys through the admin UI so that I don't need to edit environment variables.
- **Acceptance Criteria:**
  - [x] Given the admin navigates to Admin → Config, When they view the page, Then they see an "API Keys" section with fields for Anthropic API Key and ElevenLabs API Key
  - [x] Given the admin enters a new Anthropic API key, When they click Save, Then the key is stored encrypted in the database and used for subsequent AI operations
  - [x] Given the admin enters an API key, When they click "Test", Then the system makes a lightweight validation call and shows success/failure status
  - [x] Given both API keys are saved in the database, When the worker processes a job, Then it reads keys from DB first, falling back to environment variables if not set
  - [x] Given API keys are stored, When displayed in the UI, Then they are masked (showing only last 4 characters)

### Should Have Features

#### Feature 5: Bulk Source Import/Export
- **User Story:** As an admin, I want to import sources from a JSON file or export my current sources so that I can share configurations between instances.
- **Acceptance Criteria:**
  - [x] Given the admin clicks "Export Sources", When the download completes, Then a JSON file containing all sources (name, type, config, enabled) is downloaded
  - [x] Given the admin uploads a JSON file via "Import Sources", When the file is valid, Then new sources are added (skipping duplicates) and a summary shows "X added, Y skipped (duplicate)"

#### Feature 6: Source Health Dashboard
- **User Story:** As an admin, I want to see which sources are healthy, degraded, or failing so that I can manage my source list proactively.
- **Acceptance Criteria:**
  - [x] Given the Sources page, When sources are listed, Then each shows a health indicator: green (last fetch successful), yellow (1-2 consecutive errors), red (3+ consecutive errors)
  - [x] Given a source has been failing, When the admin hovers over the status, Then they see the last error message and timestamp

### Could Have Features

#### Feature 7: Scheduled Auto-Discovery
- **User Story:** As an admin, I want the system to automatically discover new sources weekly so that my coverage stays current without manual effort.

#### Feature 8: Source Category Tags
- **User Story:** As an admin, I want to tag sources with categories (e.g., "research", "industry", "open-source") so that I can filter podcast content by category.

### Won't Have (This Phase)

- **Multi-user accounts** — This phase assumes a single admin user per deployment
- **Source-level API key management** — API keys are global, not per-source (except ProductHunt which already has its own token)
- **Podcast scheduling by time window** — Users manually select time window; automatic "generate weekly podcast every Monday" is deferred
- **Source credibility scoring** — AI-assisted evaluation of source reliability/authority

## Detailed Feature Specifications

### Feature: Time Window Selector (Most Complex)

**Description:** Extends the podcast generation flow to accept a date range instead of being locked to a single digest. The system queries all normalized items within the date range across all sources, regardless of which digest (if any) they were part of.

**User Flow:**
1. Admin opens Podcast Dashboard → Generate tab
2. Sees new "Content Window" section above duration selector
3. Picks a preset (Last 24h / Last 3 days / Last 7 days / Last 14 days) or toggles "Custom Range"
4. If custom, date pickers appear for start and end dates
5. System shows a live count: "~247 items available in this window"
6. Admin configures remaining options (duration, model, style, voices) and generates

**Business Rules:**
- Rule 1: When time window is selected, content is queried from `normalized_items` by `published_at` date range, NOT by `digest_id`
- Rule 2: Story count mapping still applies (5 min = 3 stories, 30 min = 15 stories), but from a larger pool
- Rule 3: Items are ranked by `composite_score` descending within the date range
- Rule 4: If the time window returns fewer items than the story count, the system warns but proceeds with available items
- Rule 5: The default time window is "Last 24h" to preserve existing behavior

**Edge Cases:**
- No items in range → Show error message, disable Generate button
- Only 2 items in range for a 30-min podcast → Warn: "Only 2 items found. Consider widening the time window."
- Time window spans a period with no pipeline runs → Items still exist in normalized_items from previous runs; they are available
- Custom range with end date in the future → Clamp to today
- Custom range start > end → Validation error

### Feature: AI Source Discovery (Second Most Complex)

**Description:** An agent-powered feature that searches the web for AI/ML news sources matching user-specified topics, validates them (checks if feeds are reachable and recently updated), and presents candidates for admin approval.

**User Flow:**
1. Admin clicks "Discover Sources" button on Sources page
2. Modal opens with: topic input (comma-separated), max sources slider (10-50), source type checkboxes (RSS, Reddit, GitHub, etc.)
3. Admin clicks "Start Discovery" → loading state with progress messages
4. Agent returns candidates → displayed in a review table
5. Admin toggles candidates on/off, clicks "Add Selected"
6. Sources inserted, page refreshes with new sources

**Business Rules:**
- Rule 1: Discovery agent must validate each source (test fetch for RSS, check existence for subreddits)
- Rule 2: Sources with duplicate URLs or configs are flagged and excluded by default
- Rule 3: Agent runs as a BullMQ job to avoid HTTP timeouts
- Rule 4: Results are persisted and retrievable even if admin navigates away
- Rule 5: Maximum of 50 discovered sources per run to avoid overwhelming the admin

**Edge Cases:**
- Agent finds no sources for obscure topic → Show: "No sources found. Try broader topics."
- RSS feed exists but hasn't been updated in 6+ months → Flag as "Stale" in results
- Agent times out (>5 minutes) → Show partial results with "Discovery timed out — showing partial results"
- Network error during validation → Mark source as "Unvalidated" rather than excluding it

## Success Metrics

### Key Performance Indicators

- **Source Coverage:** Platform ships with >=50 verified sources (up from 5)
- **Content Volume:** Pipeline run with 50+ sources produces >=200 items (up from 70)
- **Time Window Usage:** >=30% of podcast generations use non-default (>24h) time windows within first month
- **Discovery Adoption:** >=20% of admins use AI source discovery within first month
- **API Key Self-Service:** 100% of new deployments configure keys via UI (no .env editing required)

### Tracking Requirements

| Event | Properties | Purpose |
|-------|------------|---------|
| `podcast.generated` | `timeWindowDays`, `itemCount`, `sourceCount`, `duration` | Measure time window adoption and content richness |
| `sources.discovered` | `topicCount`, `candidateCount`, `addedCount`, `agentModel` | Measure discovery feature adoption |
| `sources.bulk_imported` | `sourceCount`, `duplicateCount` | Measure import/export usage |
| `api_keys.configured` | `provider`, `validationResult` | Measure self-service adoption |
| `pipeline.completed` | `totalItems`, `sourceCount`, `duration`, `errorCount` | Measure source health at scale |

---

## Constraints and Assumptions

### Constraints
- Open-source project — must work with user-supplied API keys, no SaaS billing
- ElevenLabs free tier has limited characters/month — 30-min podcasts consume significant quota
- Anthropic API costs scale with content volume — 50+ sources with weekly windows could be expensive
- No user authentication beyond single admin — multi-tenant not in scope
- All validation must be functional (Playwright browser + cURL) — no mocks or unit tests per project constitution

### Assumptions
- Users have Anthropic and ElevenLabs API keys with sufficient quota
- Most RSS feeds and Reddit endpoints are publicly accessible without authentication
- GitHub API rate limits (60/hour unauthenticated) are sufficient for the configured source count
- ProductHunt API requires a separate token (already supported)
- Pipeline runs complete within a reasonable time (<30 min) even with 50+ sources
- The `normalized_items` table has a `published_at` column suitable for date range filtering

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| RSS feeds go stale or change URLs | Medium | High | Source health monitoring with auto-disable after N failures |
| AI discovery agent suggests low-quality sources | Medium | Medium | Validation step (reachability check, staleness check) before insertion |
| 50+ sources overwhelm pipeline (timeouts, rate limits) | High | Medium | Parallel fetching with per-source timeouts, backoff on rate-limited APIs |
| Weekly time window produces too many items for AI to process | Medium | Low | Score-based filtering limits items to top N regardless of time window |
| API key storage security | High | Low | Encrypt keys at rest, mask in UI, never log |
| Cost surprise from large time window + many sources | Medium | Medium | Show estimated cost before generation, daily/weekly spend tracking |

## Open Questions

- [x] Should time window be selectable per-generation or also configurable as a default preference? → **Per-generation with a saved default preference**
- [x] Should discovered sources be enabled by default or require manual enablement? → **Enabled by default after admin approval in discovery UI**
- [x] Should the seed sources replace existing DB sources on fresh deploy or merge? → **Merge (skip duplicates by URL/config)**

---

## Supporting Research

### Competitive Analysis
- **NotebookLM (Google):** Generates podcasts from uploaded documents — no source management, no time windows, no self-hosting
- **PodcastAI / ElevenLabs:** TTS-only — no content aggregation, no source discovery
- **AI Digest (this project):** Unique in combining: automated source ingestion → AI synthesis → podcast generation → self-hosted deployment

### User Research
- Existing podcast generation at 30-minute length with 15 stories from a single day produces good content but lacks temporal depth
- Users deploying open-source projects expect a rich default dataset and a UI-first configuration experience
- Weekly AI news recap is the most commonly requested podcast format in similar projects

### Market Data
- AI podcast listenership grew 240% in 2025 (Edison Research)
- 67% of tech professionals prefer curated AI news over raw feeds (Stack Overflow Developer Survey 2025)
- Open-source AI tools see highest adoption when they ship with sensible defaults and require minimal configuration
