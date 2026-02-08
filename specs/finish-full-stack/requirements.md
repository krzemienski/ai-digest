---
spec: finish-full-stack
phase: requirements
created: 2026-02-07T22:00:00-05:00
---

# Requirements: AI Digest Platform (finish-full-stack)

## Goal

Finish the AI Digest platform as a fully functional, professionally designed full-stack application. Every feature works end-to-end with real data, real API calls, and real audio -- validated through screenshots, cURL, and database evidence. No seed data, no placeholders, no mocks.

---

## Domain 1: Authentication & User Management

### US-1.1: User Registration
**As a** new visitor
**I want to** create an account with email and password
**So that** I can access personalized features and the admin dashboard

**Acceptance Criteria:**
- [ ] AC-1.1.1: Registration form at `/register` with email, password, confirm password fields
- [ ] AC-1.1.2: Email validated (format + uniqueness against `users` table)
- [ ] AC-1.1.3: Password minimum 8 chars, at least one number and one letter
- [ ] AC-1.1.4: On success, redirect to `/digests` with active session
- [ ] AC-1.1.5: On duplicate email, inline error "Account already exists"
- [ ] AC-1.1.6: Password stored as bcrypt hash (cost factor >= 10), never plaintext

**Priority:** P0

### US-1.2: User Login
**As a** registered user
**I want to** log in with my email and password
**So that** I can access my account and admin features

**Acceptance Criteria:**
- [ ] AC-1.2.1: Login form at `/login` with email and password fields
- [ ] AC-1.2.2: On success, redirect to previous page or `/digests`
- [ ] AC-1.2.3: On failure, inline error "Invalid email or password" (no email enumeration)
- [ ] AC-1.2.4: Session persisted via HTTP-only secure cookie (JWT or session token)
- [ ] AC-1.2.5: Session expires after 7 days of inactivity
- [ ] AC-1.2.6: "Remember me" checkbox extends session to 30 days

**Priority:** P0

### US-1.3: Admin Role Authorization
**As an** admin user
**I want** admin pages protected behind role-based access
**So that** only authorized users can trigger pipelines, manage sources, and change config

**Acceptance Criteria:**
- [ ] AC-1.3.1: `users` table includes `role` column: `"user"` (default) or `"admin"`
- [ ] AC-1.3.2: All `/admin/*` routes check for `role === "admin"` in session
- [ ] AC-1.3.3: Non-admin users see 403 page when accessing `/admin/*`
- [ ] AC-1.3.4: First registered user auto-promoted to admin (bootstrap flow)
- [ ] AC-1.3.5: Admin API endpoints validate session + role (replace current static `ADMIN_API_KEY` header)

**Priority:** P0

### US-1.4: Logout
**As a** logged-in user
**I want to** log out
**So that** my session is terminated

**Acceptance Criteria:**
- [ ] AC-1.4.1: Logout button in header (visible when authenticated)
- [ ] AC-1.4.2: Clears session cookie on click
- [ ] AC-1.4.3: Redirects to `/login`

**Priority:** P0

### US-1.5: Password Reset (Future)
**As a** user who forgot their password
**I want to** reset it via email
**So that** I can regain access

**Priority:** P3 -- Design the UI only, do not implement backend email sending

**Acceptance Criteria:**
- [ ] AC-1.5.1: "Forgot password?" link on login page
- [ ] AC-1.5.2: Form accepting email address with "Reset link sent" confirmation
- [ ] AC-1.5.3: Backend stub that logs the reset token (no email delivery)

### Functional Requirements -- Domain 1

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-1.1 | New `users` table: id (uuid), email (unique), passwordHash, role, createdAt, lastLoginAt | P0 | `psql` schema check |
| FR-1.2 | Registration API: `POST /api/auth/register` | P0 | cURL returns 201 + set-cookie |
| FR-1.3 | Login API: `POST /api/auth/login` | P0 | cURL returns 200 + set-cookie |
| FR-1.4 | Logout API: `POST /api/auth/logout` | P0 | cURL clears cookie |
| FR-1.5 | Session middleware: validates token on protected routes | P0 | cURL without cookie returns 401 |
| FR-1.6 | Admin middleware: checks `role === "admin"` on `/api/admin/*` | P0 | cURL with non-admin token returns 403 |
| FR-1.7 | Migrate admin routes from `x-api-key` header to session-based auth | P0 | Old `x-api-key` header no longer accepted |

---

## Domain 2: Theme & Design System

### US-2.1: Flat Black Professional Theme
**As a** user
**I want** a clean, professional dark UI (Linear/Vercel aesthetic)
**So that** the app feels sophisticated and easy to read

**Acceptance Criteria:**
- [ ] AC-2.1.1: Background `#09090B` (zinc-950), not pure black `#000000`
- [ ] AC-2.1.2: Card/surface `#18181B` (zinc-900) with `1px solid #3F3F46` border
- [ ] AC-2.1.3: Elevated surfaces (modals, dropdowns) `#27272A` (zinc-800)
- [ ] AC-2.1.4: Text primary `#FAFAFA` (zinc-50), secondary `#A1A1AA` (zinc-400), muted `#71717A` (zinc-500)
- [ ] AC-2.1.5: Single accent color `#3B82F6` (blue-500) for links, buttons, active states
- [ ] AC-2.1.6: Accent hover `#60A5FA` (blue-400)
- [ ] AC-2.1.7: Success `#22C55E`, warning `#EAB308`, destructive `#EF4444`
- [ ] AC-2.1.8: No glow effects, no neon shadows, no scanlines, no gradients on backgrounds
- [ ] AC-2.1.9: All 131 `cyber-*`/`neon-*` class references removed from 49 files
- [ ] AC-2.1.10: Effects directory deleted (glitch-text.tsx, neon-border.tsx, scanline.tsx)

**Priority:** P0

### US-2.2: Typography System
**As a** user
**I want** clear typographic hierarchy
**So that** content is scannable and headings stand out from body text

**Acceptance Criteria:**
- [ ] AC-2.2.1: Headings use Geist Sans (semibold 600) via `geist` npm package + `next/font/local`
- [ ] AC-2.2.2: Body text uses Inter (regular 400, medium 500) -- already installed
- [ ] AC-2.2.3: Code/timestamps/scores use Geist Mono (regular 400)
- [ ] AC-2.2.4: Type scale: h1=30px, h2=24px, h3=20px, body=14px, small=12px
- [ ] AC-2.2.5: Line height: headings 1.2, body 1.5, small 1.4

**Priority:** P0

### US-2.3: Component Design Tokens
**As a** developer
**I want** consistent design tokens in tailwind.config.ts
**So that** all components share the same visual language

**Acceptance Criteria:**
- [ ] AC-2.3.1: `tailwind.config.ts` defines semantic color tokens: `bg`, `surface`, `surface-elevated`, `border`, `border-subtle`, `text-primary`, `text-secondary`, `text-muted`, `accent`, `accent-hover`, `success`, `warning`, `destructive`
- [ ] AC-2.3.2: Spacing uses 8px base grid
- [ ] AC-2.3.3: Border radius: cards `6px` (rounded-md), buttons `8px` (rounded-lg), inputs `6px`
- [ ] AC-2.3.4: Shadows removed -- no box-shadow on cards, use borders only
- [ ] AC-2.3.5: Focus rings: `ring-2 ring-blue-500/50 ring-offset-2 ring-offset-zinc-950`

**Priority:** P0

### US-2.4: Responsive Design
**As a** mobile user
**I want** the app to work on all screen sizes
**So that** I can read digests and listen to podcasts on my phone

**Acceptance Criteria:**
- [ ] AC-2.4.1: Mobile: 375px minimum width, single column layout
- [ ] AC-2.4.2: Tablet: 768px, two-column where appropriate
- [ ] AC-2.4.3: Desktop: 1440px, full layout with sidebar
- [ ] AC-2.4.4: Sidebar collapses to hamburger menu on mobile
- [ ] AC-2.4.5: All 14+ pages verified at 3 breakpoints via Playwright screenshots
- [ ] AC-2.4.6: Touch targets minimum 44x44px on mobile
- [ ] AC-2.4.7: No horizontal scroll at any breakpoint

**Priority:** P0

### Functional Requirements -- Domain 2

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-2.1 | Install `geist` npm package, configure in layout.tsx via `next/font/local` | P0 | Font renders in screenshots |
| FR-2.2 | Update tailwind.config.ts: semantic token palette, remove all `cyber-*`/`neon-*` | P0 | `grep -r "cyber-\|neon-" apps/web/src` returns 0 |
| FR-2.3 | Update globals.css: body bg `#09090B`, text `#FAFAFA` | P0 | Screenshot shows zinc-950 bg |
| FR-2.4 | Update all 49 files containing `cyber-*`/`neon-*` references | P0 | grep returns 0 matches |
| FR-2.5 | Delete `apps/web/src/components/effects/` directory (keep reduced-motion hook) | P0 | Directory gone |
| FR-2.6 | Update email templates (digest-email.tsx, welcome-email.tsx) with matching palette | P1 | Email preview shows new palette |

---

## Domain 3: Source Management

### US-3.1: Source Catalog
**As an** admin
**I want to** see all configured sources with their status
**So that** I know which sources are active and healthy

**Acceptance Criteria:**
- [ ] AC-3.1.1: Table at `/admin/sources`: name, type (badge), enabled (toggle), last fetch, item count, error count
- [ ] AC-3.1.2: Source type badges: RSS (blue), GitHub (gray), ArXiv (red), HN (orange), HuggingFace (yellow), Reddit (coral), ProductHunt (brown)
- [ ] AC-3.1.3: Enable/disable toggle per row (PATCH to API)
- [ ] AC-3.1.4: Edit (config modal) and delete (confirmation dialog) actions per row
- [ ] AC-3.1.5: Empty state: "No sources configured. Add your first source." with CTA

**Priority:** P0

### US-3.2: Add/Edit Source
**As an** admin
**I want to** add new sources or edit existing ones
**So that** the pipeline pulls from my chosen feeds

**Acceptance Criteria:**
- [ ] AC-3.2.1: "Add Source" button opens modal with: name, type (dropdown), URL, enabled toggle
- [ ] AC-3.2.2: Type-specific config fields appear on type selection:
  - RSS: `url` only
  - GitHub: `topics[]`, `minStars`, `dateRange`
  - ArXiv: `categories[]` (multi-select from cs.AI, cs.CL, cs.CV, cs.LG, stat.ML, etc.)
  - HN: `queries[]`, `minPoints`
  - HuggingFace: `endpoints[]` (trending models, daily papers, trending spaces)
  - Reddit: `subreddits[]`, `minScore`
  - ProductHunt: `topics[]`
- [ ] AC-3.2.3: URL validation on RSS sources (must be `http://` or `https://`)
- [ ] AC-3.2.4: Save persists to `sources` table via `POST /api/admin/sources`
- [ ] AC-3.2.5: Edit populates form from existing config via `GET /api/admin/sources/:id`
- [ ] AC-3.2.6: Delete requires typing source name to confirm

**Priority:** P0

### US-3.3: Source Health Monitoring
**As an** admin
**I want to** see source health at a glance
**So that** I can identify and fix broken sources quickly

**Acceptance Criteria:**
- [ ] AC-3.3.1: Status indicator per source: green (healthy), yellow (degraded), red (error)
- [ ] AC-3.3.2: Green = last fetch <24h + 0 errors; yellow = 24-48h OR 1-3 errors; red = >48h OR >3 consecutive errors
- [ ] AC-3.3.3: Expandable row shows last 5 fetch attempts: timestamp, items fetched, error if any
- [ ] AC-3.3.4: "Test Connection" button fetches 1 item and shows result inline

**Priority:** P1
**Dependency:** New columns on `sources` table or new `source_fetch_log` table

### US-3.4: Add Custom RSS Feed
**As an** admin
**I want to** add any RSS feed URL
**So that** I can include niche sources not in the defaults

**Acceptance Criteria:**
- [ ] AC-3.4.1: RSS type pre-selected when "Add RSS Feed" shortcut used
- [ ] AC-3.4.2: System validates by fetching and parsing the feed before saving
- [ ] AC-3.4.3: Preview shows: feed title, description, last 3 items
- [ ] AC-3.4.4: Non-RSS URL shows error: "Not a valid RSS/Atom feed"

**Priority:** P1

### US-3.5: Seed Sources on First Run
**As a** new admin
**I want** recommended sources pre-loaded
**So that** I can generate digests immediately

**Acceptance Criteria:**
- [ ] AC-3.5.1: On first admin login (0 sources exist), show "Quick Setup" wizard
- [ ] AC-3.5.2: 22 Phase 1 sources presented with checkboxes (from research-sources.md seed config)
- [ ] AC-3.5.3: All checked by default; admin deselects unwanted
- [ ] AC-3.5.4: "Activate Sources" creates all selected in `sources` table with full config
- [ ] AC-3.5.5: Wizard only shown once (dismissed state stored in `config` table)

**Priority:** P1

### Functional Requirements -- Domain 3

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-3.1 | Source CRUD API: GET/POST/PATCH/DELETE `/api/admin/sources` | P0 | cURL all 4 methods |
| FR-3.2 | Add columns to `sources`: `lastFetchAt`, `lastFetchItemCount`, `lastFetchError`, `consecutiveErrors` | P1 | `psql` schema check |
| FR-3.3 | New `source_fetch_log` table: id, sourceId, fetchedAt, itemCount, error, durationMs | P1 | `psql` schema check |
| FR-3.4 | RSS feed validation endpoint: `POST /api/admin/sources/validate` | P1 | cURL with valid/invalid URL |
| FR-3.5 | Seed source catalog as JSON constant (22 sources from research) | P1 | Import + verify count |

---

## Domain 4: Pipeline & Digest

### US-4.1: Manual Pipeline Trigger
**As an** admin
**I want to** trigger the pipeline on demand
**So that** I can generate a digest whenever I want

**Acceptance Criteria:**
- [ ] AC-4.1.1: "Run Pipeline" button on admin dashboard
- [ ] AC-4.1.2: Confirmation dialog: "This will ingest from all enabled sources and generate a digest. Estimated cost: ~$0.25. Continue?"
- [ ] AC-4.1.3: Button disabled while pipeline already running
- [ ] AC-4.1.4: `POST /api/admin/pipeline/trigger` with `triggerType: "manual"`
- [ ] AC-4.1.5: Response includes `pipelineRunId` for tracking
- [ ] AC-4.1.6: Redirect to pipeline monitor page

**Priority:** P0

### US-4.2: Real-Time Pipeline Monitor
**As an** admin
**I want to** watch pipeline progress in real-time
**So that** I can see what's happening, debug issues, and know when it's done

**Acceptance Criteria:**
- [ ] AC-4.2.1: Pipeline monitor at `/admin/pipeline` shows current run
- [ ] AC-4.2.2: Vertical stage timeline: ingest -> normalize -> categorize -> score -> dedup -> synthesize -> output -> podcast -> newsletter
- [ ] AC-4.2.3: Each stage shows: name, status icon (pending/running/completed/failed), duration, items processed
- [ ] AC-4.2.4: Running stage has animated spinner + live item counter
- [ ] AC-4.2.5: Completed stages show green checkmark + duration
- [ ] AC-4.2.6: Failed stages show red X with expandable error message
- [ ] AC-4.2.7: Live updates via polling every 2 seconds
- [ ] AC-4.2.8: Stage detail expandable: model used, tokens consumed, cost
- [ ] AC-4.2.9: Overall progress bar: `completedStages / totalStages`
- [ ] AC-4.2.10: Completion summary: total items ingested, digest items, cost, duration

**Priority:** P0

### US-4.3: Pipeline History
**As an** admin
**I want to** see past pipeline runs
**So that** I can review performance, costs, and errors

**Acceptance Criteria:**
- [ ] AC-4.3.1: History table on `/admin/pipeline` below current run
- [ ] AC-4.3.2: Columns: date, trigger type (manual/scheduled), status, items ingested, items in digest, cost, duration
- [ ] AC-4.3.3: Expandable row shows per-stage breakdown
- [ ] AC-4.3.4: Pagination: 10 runs per page
- [ ] AC-4.3.5: Filter by status (all/completed/failed)

**Priority:** P1

### US-4.4: Digest Feed (Consumer)
**As a** reader
**I want to** see a list of daily digests
**So that** I can browse AI news by date

**Acceptance Criteria:**
- [ ] AC-4.4.1: Feed at `/digests` (also home page `/`)
- [ ] AC-4.4.2: Card per digest: date, item count, synthesis preview (200 chars), topic badges
- [ ] AC-4.4.3: Newest first
- [ ] AC-4.4.4: "Load More" or infinite scroll (10 per page)
- [ ] AC-4.4.5: Empty state: "No digests yet. Check back tomorrow!" + subscribe CTA
- [ ] AC-4.4.6: Each card links to `/digests/:id`

**Priority:** P0

### US-4.5: Digest Detail (Consumer)
**As a** reader
**I want to** read a full digest with all topics and source links
**So that** I can stay informed about AI developments

**Acceptance Criteria:**
- [ ] AC-4.5.1: Full synthesis text at `/digests/:id`
- [ ] AC-4.5.2: Items grouped by section/topic with headings
- [ ] AC-4.5.3: Each item: title (linked to source URL), source badge, score (Geist Mono), summary
- [ ] AC-4.5.4: Score indicator: color bar (green >0.7, yellow 0.4-0.7, red <0.4)
- [ ] AC-4.5.5: "Listen to Podcast" button if episode exists for this digest
- [ ] AC-4.5.6: Share button (copy link to clipboard)
- [ ] AC-4.5.7: Date nav: "Previous Day" / "Next Day"
- [ ] AC-4.5.8: Open Graph meta tags for social sharing

**Priority:** P0

### US-4.6: Scheduled Pipeline
**As an** admin
**I want** the pipeline to run automatically on a schedule
**So that** digests are generated daily without manual intervention

**Acceptance Criteria:**
- [ ] AC-4.6.1: Schedule config at `/admin/schedule` with cron expression editor
- [ ] AC-4.6.2: Default: daily at 6:00 AM UTC
- [ ] AC-4.6.3: BullMQ cron job triggers pipeline
- [ ] AC-4.6.4: Schedule saved to `config` table key `schedule`
- [ ] AC-4.6.5: Next scheduled run time shown on admin dashboard

**Priority:** P1

### Functional Requirements -- Domain 4

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-4.1 | Trigger API: `POST /api/admin/pipeline/trigger` creates `pipeline_runs` + BullMQ job | P0 | cURL 201, DB record, worker log |
| FR-4.2 | Status API: `GET /api/admin/pipeline/status` returns current run + stages | P0 | cURL returns stages |
| FR-4.3 | `pipeline_stages` updated in real-time as each stage completes | P0 | DB records during run |
| FR-4.4 | Clear seed data before first real run: truncate all tables except `config` + `sources` | P0 | `psql` counts = 0 |
| FR-4.5 | Digest list API: `GET /api/digests` with pagination | P0 | cURL paginated |
| FR-4.6 | Digest detail API: `GET /api/digests/:id` with items | P0 | cURL returns full digest |
| FR-4.7 | Update model IDs: Haiku 4.5 (categorize/dedup), Sonnet 4.5 (score/synthesize), Opus 4.5 (scripts) | P0 | Source check |
| FR-4.8 | Structured outputs (Zod schemas) on all AI stages | P1 | No regex JSON stripping |
| FR-4.9 | Prompt caching (`cache_control`) on system prompts | P1 | API params include cache_control |
| FR-4.10 | Cost tracking uses current pricing: Opus $5/$25, Sonnet $3/$15, Haiku $1/$5 MTok | P0 | Source check |

---

## Domain 5: Podcast Generation

### US-5.1: Configurable Podcast Length
**As an** admin
**I want to** choose episode duration
**So that** I can generate shorter or longer episodes based on content volume

**Acceptance Criteria:**
- [ ] AC-5.1.1: Duration selector on `/admin/podcast`: 5 min, 10 min, 15 min, 20 min
- [ ] AC-5.1.2: Stored in `config` table key `podcast` as `targetDurationMinutes`
- [ ] AC-5.1.3: Duration drives script word count: `duration * 150` words
- [ ] AC-5.1.4: Duration drives story count: 5min=3, 10min=5, 15min=7, 20min=9
- [ ] AC-5.1.5: Default: 10 minutes
- [ ] AC-5.1.6: Trigger button shows duration: "Generate 10-min Podcast"

**Priority:** P0

### US-5.2: One-Off Podcast Trigger
**As an** admin
**I want to** trigger podcast generation for a specific digest
**So that** I can create a podcast on demand

**Acceptance Criteria:**
- [ ] AC-5.2.1: "Generate Podcast" button on `/admin/podcast`
- [ ] AC-5.2.2: Dropdown selects which digest (defaults to latest)
- [ ] AC-5.2.3: Warning if episode already exists for selected digest
- [ ] AC-5.2.4: `POST /api/admin/podcast/generate` with `digestId` + `targetDurationMinutes`
- [ ] AC-5.2.5: Redirects to generation monitor
- [ ] AC-5.2.6: BullMQ job created

**Priority:** P0

### US-5.3: Real-Time Generation Monitor
**As an** admin
**I want to** watch podcast generation in real-time
**So that** I can see progress and debug issues

**Acceptance Criteria:**
- [ ] AC-5.3.1: Stage timeline: content selection -> script generation -> quality review -> TTS -> audio assembly -> upload
- [ ] AC-5.3.2: Script gen stage shows: model (Opus 4.5), word count, topic count
- [ ] AC-5.3.3: Quality review shows: score (x/10), pass/fail, feedback if failed
- [ ] AC-5.3.4: TTS shows: segment progress ("Generating 5/24"), current speaker, ETA
- [ ] AC-5.3.5: Assembly shows: ffmpeg progress, output file size
- [ ] AC-5.3.6: Upload shows: S3 progress, final URL
- [ ] AC-5.3.7: Completion: "Episode ready!" with play button + episode link
- [ ] AC-5.3.8: Updates via polling every 3 seconds

**Priority:** P0

### US-5.4: Script Preview
**As an** admin
**I want to** see the generated script before TTS
**So that** I can review quality

**Acceptance Criteria:**
- [ ] AC-5.4.1: Script displayed in monitor after generation completes
- [ ] AC-5.4.2: Conversation format: speaker name (bold) + dialogue
- [ ] AC-5.4.3: Different bg per speaker for readability
- [ ] AC-5.4.4: Segment type badges (intro, topic, transition, quick_hit, outro)
- [ ] AC-5.4.5: Word count + estimated duration shown
- [ ] AC-5.4.6: "Regenerate Script" button

**Priority:** P1

### US-5.5: Voice Selection
**As an** admin
**I want to** choose podcast host voices
**So that** I can customize the podcast personality

**Acceptance Criteria:**
- [ ] AC-5.5.1: Voice config panel on `/admin/podcast`
- [ ] AC-5.5.2: Host A + Host B voice selectors from ElevenLabs pre-made voices
- [ ] AC-5.5.3: Each shows: voice name, gender, preview button
- [ ] AC-5.5.4: Preview plays 5-second sample
- [ ] AC-5.5.5: Settings sliders: stability (0-1), similarity boost (0-1), style (0-1)
- [ ] AC-5.5.6: Defaults: Host A = Brian (0.70/0.75/0.30), Host B = Sarah (0.60/0.70/0.40)
- [ ] AC-5.5.7: Config saved to `config` key `podcast.voiceConfig`

**Priority:** P1

### US-5.6: Episode Player
**As a** listener
**I want** a full podcast player
**So that** I can listen to AI news

**Acceptance Criteria:**
- [ ] AC-5.6.1: Full player at `/podcasts/:id`
- [ ] AC-5.6.2: Controls: play/pause, skip +30s, skip -15s, volume slider
- [ ] AC-5.6.3: Seekable progress bar with elapsed/total time (Geist Mono)
- [ ] AC-5.6.4: Speed selector: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
- [ ] AC-5.6.5: Episode metadata: title, date, duration, digest link
- [ ] AC-5.6.6: Audio from S3 URL in `episodes.audioUrl`
- [ ] AC-5.6.7: Player state persists across pages (mini-player takes over)
- [ ] AC-5.6.8: Download MP3 button

**Priority:** P0

### US-5.7: Episode Library
**As a** listener
**I want to** browse all podcast episodes
**So that** I can find past episodes

**Acceptance Criteria:**
- [ ] AC-5.7.1: Library at `/podcasts`
- [ ] AC-5.7.2: Card per episode: title, date, duration (MM:SS), play button
- [ ] AC-5.7.3: Newest first
- [ ] AC-5.7.4: Play starts mini-player without navigating
- [ ] AC-5.7.5: Empty state: "No episodes yet. Generate your first podcast from the admin panel."

**Priority:** P0

### US-5.8: Mini-Player
**As a** listener
**I want** persistent bottom bar playback
**So that** audio continues while browsing

**Acceptance Criteria:**
- [ ] AC-5.8.1: Fixed bottom bar (64px) appears when audio playing
- [ ] AC-5.8.2: Shows: episode title, play/pause, thin progress bar, elapsed time, close
- [ ] AC-5.8.3: Title click navigates to full player
- [ ] AC-5.8.4: Close stops playback, hides bar
- [ ] AC-5.8.5: Page content has 64px bottom padding when active
- [ ] AC-5.8.6: State via React context shared with full player

**Priority:** P0

### US-5.9: Transcript View
**As a** listener
**I want to** read the transcript
**So that** I can follow along or reference points

**Acceptance Criteria:**
- [ ] AC-5.9.1: Transcript below player on `/podcasts/:id`
- [ ] AC-5.9.2: Speaker labels ("Alex"/"Jamie") bold, distinct color per speaker
- [ ] AC-5.9.3: Clickable timestamps to seek audio
- [ ] AC-5.9.4: Current segment highlighted during playback
- [ ] AC-5.9.5: Search within transcript
- [ ] AC-5.9.6: Data from `transcripts.segments`

**Priority:** P1

### Functional Requirements -- Domain 5

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-5.1 | Generate API: `POST /api/admin/podcast/generate` with digestId + duration | P0 | cURL 201, BullMQ job |
| FR-5.2 | BullMQ job with stage tracking (content_select, script_gen, quality_review, tts, assembly, upload) | P0 | Worker logs |
| FR-5.3 | Script gen uses Opus 4.5 + structured outputs (Zod PodcastScriptSchema) | P0 | Valid JSON output |
| FR-5.4 | Quality review: Sonnet 4.5, pass >= 7/10, max 3 attempts | P1 | Review logged |
| FR-5.5 | TTS uses real ElevenLabs with real `request-id` headers (fix current synthetic ID bug) | P0 | Real IDs in `previous_request_ids` |
| FR-5.6 | ffmpeg: silence gaps (300-500ms), loudness normalization (-16 LUFS), ID3 metadata | P1 | `ffprobe` output |
| FR-5.7 | Upload to S3 `ai-digest-audio`, store URL in `episodes.audioUrl` | P0 | S3 object accessible |
| FR-5.8 | Episode list API: `GET /api/episodes` with pagination | P0 | cURL |
| FR-5.9 | Episode detail API: `GET /api/episodes/:id` with transcript | P0 | cURL |
| FR-5.10 | Generation status API: `GET /api/admin/podcast/status` | P0 | cURL during generation |
| FR-5.11 | Content selection: diversity-aware, respects duration config | P1 | Multiple topics selected |

---

## Domain 6: Newsletter

### US-6.1: Email Template Preview
**As an** admin
**I want to** preview the newsletter
**So that** I can see what subscribers would receive

**Acceptance Criteria:**
- [ ] AC-6.1.1: Preview on admin config page or `/admin/newsletter`
- [ ] AC-6.1.2: Rendered HTML in iframe with digest content
- [ ] AC-6.1.3: Uses flat black palette (#09090B bg, #FAFAFA text, #3B82F6 links)
- [ ] AC-6.1.4: Includes: header, synthesis, top items by topic, podcast link, unsubscribe footer
- [ ] AC-6.1.5: Digest selector dropdown to preview any digest

**Priority:** P1

### US-6.2: HTML Export
**As an** admin
**I want to** export newsletter as HTML
**So that** I can send manually via any provider

**Acceptance Criteria:**
- [ ] AC-6.2.1: "Export HTML" button on preview
- [ ] AC-6.2.2: Downloads `.html` with fully inlined CSS
- [ ] AC-6.2.3: Self-contained: no external stylesheets
- [ ] AC-6.2.4: API: `GET /api/admin/newsletter/:digestId/html`

**Priority:** P1

### US-6.3: Subscriber Management
**As an** admin
**I want to** manage subscribers
**So that** I can see who's signed up

**Acceptance Criteria:**
- [ ] AC-6.3.1: Table at `/admin/subscribers`: email, status, subscribed date
- [ ] AC-6.3.2: "Add Subscriber" button
- [ ] AC-6.3.3: Remove = soft delete (status -> `unsubscribed`)
- [ ] AC-6.3.4: Count displayed
- [ ] AC-6.3.5: Status badge for Resend API: "configured"/"not configured"
- [ ] AC-6.3.6: Public subscribe form on `/digests` page footer

**Priority:** P1

### US-6.4: Newsletter Archive
**As a** reader
**I want to** browse past editions
**So that** I can read ones I missed

**Acceptance Criteria:**
- [ ] AC-6.4.1: Archive at `/archive`: past digests in newsletter format
- [ ] AC-6.4.2: Each entry: date, preview, "Read" link
- [ ] AC-6.4.3: "Read" shows rendered email as web page
- [ ] AC-6.4.4: Newest first, paginated

**Priority:** P1

### Functional Requirements -- Domain 6

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-6.1 | Newsletter render API: `GET /api/admin/newsletter/:digestId/html` | P1 | cURL returns HTML |
| FR-6.2 | Update email templates with flat black palette | P1 | Visual check |
| FR-6.3 | Subscribe API (exists): `POST /api/subscribe` | P0 | cURL 201 |
| FR-6.4 | Unsubscribe API (exists): `POST /api/unsubscribe` | P0 | cURL 200 |

---

## Domain 7: Search & Discovery

### US-7.1: Full-Text Search
**As a** reader
**I want to** search across digests and items
**So that** I can find specific topics

**Acceptance Criteria:**
- [ ] AC-7.1.1: Search page at `/search` with prominent input
- [ ] AC-7.1.2: Header search icon (expands on click, mobile)
- [ ] AC-7.1.3: Searches `normalized_items.title`, `normalized_items.summary`, `digests.synthesis`
- [ ] AC-7.1.4: Results grouped: "Digests" and "Items"
- [ ] AC-7.1.5: Each result: title, source badge, date, snippet with highlighted terms
- [ ] AC-7.1.6: Debounced 300ms with loading indicator
- [ ] AC-7.1.7: Empty: "No results for '[query]'. Try different keywords."
- [ ] AC-7.1.8: Minimum 2 characters

**Priority:** P1

### US-7.2: Search Filters
**As a** reader
**I want to** filter results
**So that** I can narrow down

**Acceptance Criteria:**
- [ ] AC-7.2.1: Filter sidebar (desktop) / sheet (mobile)
- [ ] AC-7.2.2: Source type checkboxes
- [ ] AC-7.2.3: Date range: "24h", "7 days", "30 days", "All"
- [ ] AC-7.2.4: Topic checkboxes
- [ ] AC-7.2.5: Active filters as dismissable badges
- [ ] AC-7.2.6: URL params for shareable filtered searches

**Priority:** P2

### Functional Requirements -- Domain 7

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-7.1 | Search API: `GET /api/search?q=&source=&dateRange=&topic=` | P1 | cURL returns results |
| FR-7.2 | PostgreSQL `tsvector` on `normalized_items` (title + summary) | P1 | `EXPLAIN ANALYZE` shows index |
| FR-7.3 | Results sorted by `ts_rank` relevance | P1 | Results ordered correctly |

---

## Domain 8: Admin Dashboard

### US-8.1: Dashboard Overview
**As an** admin
**I want** system health at a glance
**So that** I can quickly assess status

**Acceptance Criteria:**
- [ ] AC-8.1.1: Dashboard at `/admin` with 4 stat cards: Total Items, Digests, Episodes, Subscribers
- [ ] AC-8.1.2: Each card: number, label, trend vs previous period
- [ ] AC-8.1.3: "Last Pipeline Run": status, date, duration, items, cost
- [ ] AC-8.1.4: "Next Scheduled Run": countdown
- [ ] AC-8.1.5: Source health summary: X healthy, Y degraded, Z erroring

**Priority:** P0

### US-8.2: Quick Actions
**As an** admin
**I want** quick buttons for common tasks
**So that** I don't navigate to separate pages

**Acceptance Criteria:**
- [ ] AC-8.2.1: Action bar: "Run Pipeline", "Generate Podcast", "Preview Newsletter"
- [ ] AC-8.2.2: "Run Pipeline" with confirmation dialog
- [ ] AC-8.2.3: "Generate Podcast" links to `/admin/podcast`
- [ ] AC-8.2.4: "Preview Newsletter" opens latest email preview

**Priority:** P0

### US-8.3: System Health
**As an** admin
**I want** service connection status
**So that** I know what's working

**Acceptance Criteria:**
- [ ] AC-8.3.1: Health section on `/admin/config`
- [ ] AC-8.3.2: Services: PostgreSQL, Redis, Anthropic API, ElevenLabs, S3, Resend
- [ ] AC-8.3.3: Green = configured+connected, yellow = configured+untested, red = not configured
- [ ] AC-8.3.4: "Test Connection" button per service

**Priority:** P1

### US-8.4: Config Management
**As an** admin
**I want to** manage platform config
**So that** I can adjust behavior

**Acceptance Criteria:**
- [ ] AC-8.4.1: Config at `/admin/config` with sections: Pipeline, Podcast, Schedule, System
- [ ] AC-8.4.2: Pipeline: batch size, budget limit, model per stage
- [ ] AC-8.4.3: Podcast: duration, voice config link
- [ ] AC-8.4.4: Schedule: cron with human-readable preview
- [ ] AC-8.4.5: Saved to `config` table as JSON
- [ ] AC-8.4.6: "Save" with success/error toast
- [ ] AC-8.4.7: "Reset to Defaults" per section

**Priority:** P1

### Functional Requirements -- Domain 8

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-8.1 | Stats API: `GET /api/admin/stats` returns counts + trends | P0 | cURL |
| FR-8.2 | Health API: `GET /api/admin/health` tests each service | P1 | cURL per-service status |
| FR-8.3 | Config API (exists): `GET/PUT /api/admin/config/:key` | P0 | Verify with session auth |

---

## Domain 9: Settings & API Keys (Future Phase)

### US-9.1: Settings Page
**As a** user
**I want** a settings page for account and API keys
**So that** I can customize and connect services

**Priority:** P3 -- Design the UI only. No backend key storage.

**Acceptance Criteria:**
- [ ] AC-9.1.1: `/settings` page, authenticated users only
- [ ] AC-9.1.2: Sections: Account, API Keys, Preferences
- [ ] AC-9.1.3: Account: email (read-only), change password (stub)
- [ ] AC-9.1.4: API Keys: Anthropic, ElevenLabs, Resend, S3 (access key + secret)
- [ ] AC-9.1.5: Masked values (last 4 chars) if configured
- [ ] AC-9.1.6: "Test" button per key (stub)
- [ ] AC-9.1.7: Banner: "API keys are stored encrypted and never shared."
- [ ] AC-9.1.8: Preferences: notification toggle, delivery time
- [ ] AC-9.1.9: Save shows "Coming soon" toast

---

## Domain 10: Stitch Design Generation

### US-10.1: Stitch Project
**As a** developer
**I want** a Stitch project with the design system
**So that** screens are consistent

**Acceptance Criteria:**
- [ ] AC-10.1.1: Project created via `mcp__stitch__create_project`
- [ ] AC-10.1.2: Project ID stored in `.progress.md`
- [ ] AC-10.1.3: Design system prompt template established

**Priority:** P0

### US-10.2: Screen Generation

**Acceptance Criteria:**
- [ ] AC-10.2.1: 15 screens generated in priority order:

| # | Screen | Device | Model | Priority |
|---|--------|--------|-------|----------|
| 1 | Digest Feed (home) | DESKTOP | PRO | P0 |
| 2 | Digest Feed (mobile) | MOBILE | PRO | P0 |
| 3 | Digest Detail | DESKTOP | PRO | P0 |
| 4 | Podcast Player | DESKTOP | FLASH | P0 |
| 5 | Podcast Player (mobile) | MOBILE | FLASH | P0 |
| 6 | Episode Library | DESKTOP | FLASH | P0 |
| 7 | Admin Dashboard | DESKTOP | FLASH | P0 |
| 8 | Admin Pipeline Monitor | DESKTOP | FLASH | P0 |
| 9 | Admin Podcast Settings | DESKTOP | FLASH | P0 |
| 10 | Search Results | DESKTOP | FLASH | P1 |
| 11 | Admin Sources | DESKTOP | FLASH | P1 |
| 12 | Admin Config | DESKTOP | FLASH | P1 |
| 13 | Login / Register | DESKTOP | FLASH | P1 |
| 14 | Newsletter Archive | DESKTOP | FLASH | P1 |
| 15 | Email Template | AGNOSTIC | FLASH | P1 |

- [ ] AC-10.2.2: All use consistent design system prompt prefix
- [ ] AC-10.2.3: PRO model for first 3 (establish DNA), FLASH for rest
- [ ] AC-10.2.4: Each reviewed before implementation

**Priority:** P0

### US-10.3: Design System Prompt

**Acceptance Criteria:**
- [ ] AC-10.3.1: Prefix includes: zinc scale colors, Geist/Inter/Geist Mono fonts, blue-500 accent, 1px zinc-700 borders, 6px/8px radius, 8px grid
- [ ] AC-10.3.2: References: Linear, Vercel Dashboard, Raycast
- [ ] AC-10.3.3: Exclusions: "No glow, no neon, no scanlines, no gradients"
- [ ] AC-10.3.4: Documented in `specs/finish-full-stack/design-system-prompt.md`

**Priority:** P0

---

## Domain 11: Validation Protocol

### US-11.1: Playwright Screenshots
**As a** developer
**I want** automated visual validation
**So that** every page is verified

**Acceptance Criteria:**
- [ ] AC-11.1.1: Every page at 3 viewports: 375x812, 768x1024, 1440x900
- [ ] AC-11.1.2: Playwright MCP `browser_take_screenshot`
- [ ] AC-11.1.3: Screenshots visually inspected (READ the image) before completion
- [ ] AC-11.1.4: 15+ pages x 3 breakpoints = 45+ screenshots
- [ ] AC-11.1.5: Admin pages require login state

**Priority:** P0

### US-11.2: API Verification
**As a** developer
**I want** every endpoint verified with cURL
**So that** backend is proven

**Acceptance Criteria:**
- [ ] AC-11.2.1: Every route tested (success + error)
- [ ] AC-11.2.2: Auth routes tested with valid + invalid tokens
- [ ] AC-11.2.3: Responses match `ApiResponse<T>`
- [ ] AC-11.2.4: Full endpoint matrix:

| Endpoint | Method | Auth |
|----------|--------|------|
| `/api/auth/register` | POST | No |
| `/api/auth/login` | POST | No |
| `/api/auth/logout` | POST | Yes |
| `/api/digests` | GET | No |
| `/api/digests/:id` | GET | No |
| `/api/digests/latest` | GET | No |
| `/api/episodes` | GET | No |
| `/api/episodes/:id` | GET | No |
| `/api/search` | GET | No |
| `/api/subscribe` | POST | No |
| `/api/unsubscribe` | POST | No |
| `/api/admin/stats` | GET | Admin |
| `/api/admin/health` | GET | Admin |
| `/api/admin/sources` | GET/POST | Admin |
| `/api/admin/sources/:id` | GET/PATCH/DELETE | Admin |
| `/api/admin/sources/validate` | POST | Admin |
| `/api/admin/pipeline/trigger` | POST | Admin |
| `/api/admin/pipeline/status` | GET | Admin |
| `/api/admin/pipeline/runs` | GET | Admin |
| `/api/admin/config/:key` | GET/PUT | Admin |
| `/api/admin/podcast/generate` | POST | Admin |
| `/api/admin/podcast/status` | GET | Admin |
| `/api/admin/podcast/preview` | GET | Admin |
| `/api/admin/subscribers` | GET/POST/DELETE | Admin |
| `/api/admin/newsletter/:digestId/html` | GET | Admin |

**Priority:** P0

### US-11.3: Pipeline Evidence
**As a** developer
**I want** proof the pipeline ran with real data
**So that** end-to-end is validated

**Acceptance Criteria:**
- [ ] AC-11.3.1: Seed data cleared (no deterministic UUIDs remain)
- [ ] AC-11.3.2: `pipeline_runs` has `status: "completed"` record
- [ ] AC-11.3.3: `pipeline_stages` all `completed` with `itemsProcessed > 0`
- [ ] AC-11.3.4: `normalized_items` has real items (real URLs, real titles)
- [ ] AC-11.3.5: `digests` has real synthesis (not placeholder text)
- [ ] AC-11.3.6: `digest_items` links real items with ranked sections

**Priority:** P0

### US-11.4: Audio Verification
**As a** developer
**I want** proof real audio was generated
**So that** TTS pipeline is validated

**Acceptance Criteria:**
- [ ] AC-11.4.1: `episodes.audioUrl` is real S3 URL (not `/placeholder-episode.mp3`)
- [ ] AC-11.4.2: S3 object returns HTTP 200
- [ ] AC-11.4.3: `ffprobe` shows valid MP3 codec, duration, bitrate
- [ ] AC-11.4.4: Duration within 20% of target
- [ ] AC-11.4.5: Transcript exists with real segments
- [ ] AC-11.4.6: Playable in web player (Playwright verify)

**Priority:** P0

### US-11.5: Gate Discipline
**As a** project lead
**I want** strict evidence for every task
**So that** nothing passes without proof

**Acceptance Criteria:**
- [ ] AC-11.5.1: Frontend: screenshots at 3 breakpoints, visually inspected
- [ ] AC-11.5.2: Backend: cURL showing success response
- [ ] AC-11.5.3: Pipeline: DB records + worker logs
- [ ] AC-11.5.4: Podcast: playable audio + ffprobe
- [ ] AC-11.5.5: No task complete without evidence

**Priority:** P0

---

## Non-Functional Requirements

| ID | Requirement | Metric | Target |
|----|-------------|--------|--------|
| NFR-1 | Page load | LCP | < 2.5s desktop |
| NFR-2 | Contrast | WCAG AA | All text >= 4.5:1 |
| NFR-3 | Touch targets | Size | >= 44x44px mobile |
| NFR-4 | Pipeline cost | USD/run | < $5.00 (budget cap) |
| NFR-5 | Audio quality | Format | 128kbps MP3, -16 LUFS |
| NFR-6 | API latency | p95 | < 500ms non-pipeline |
| NFR-7 | Errors | Format | All return `ApiResponse` with error field |
| NFR-8 | Password storage | Algorithm | bcrypt, cost >= 10 |
| NFR-9 | Sessions | Cookie | HTTP-only, Secure, SameSite=Lax |
| NFR-10 | Input validation | Library | Zod on all user inputs |

---

## Glossary

- **Digest**: Daily compilation of AI news items, scored and synthesized by AI
- **Episode**: Podcast audio generated from a digest via TTS
- **Pipeline**: Multi-stage process: ingest -> normalize -> categorize -> score -> dedup -> synthesize -> output -> podcast -> newsletter
- **Pipeline Run**: Single execution (manual or scheduled)
- **Pipeline Stage**: One step in the pipeline
- **Normalized Item**: Source article/paper/post in standard format
- **Composite Score**: Weighted combination of relevance, novelty, impact (0-1)
- **TTS**: Text-to-Speech via ElevenLabs API
- **Synthesis**: AI-generated editorial summary
- **Source**: Configured feed (RSS, GitHub, ArXiv, HN, HuggingFace, Reddit, ProductHunt)
- **Stitch**: MCP tool for AI screen design generation
- **Gate Validation**: Evidence required before marking work complete

---

## Out of Scope

- Multi-tenant / per-user personalization
- Real email delivery (Resend deferred; render HTML only)
- OAuth social login (email/password only)
- Password reset email sending (design UI only)
- API key encryption backend (design settings UI only)
- YouTube fetcher (research documented, not in current 7 fetchers)
- Semantic Scholar / conference proceedings fetchers
- Twitter/X integration (cost prohibitive)
- Native mobile app (responsive web only)
- Internationalization
- Payment / billing
- WebSocket real-time (use polling; WS is P2)
- RSS output of digests
- User bookmarks / saved items
- Comments / discussion
- CI/CD pipeline
- Deployment to cloud (local only)

---

## Dependencies

| Dependency | Blocks | Status |
|------------|--------|--------|
| PostgreSQL (port 5432) | All DB ops | Configured |
| Redis (port 6379) | BullMQ jobs | Configured |
| ANTHROPIC_API_KEY | AI stages | Configured |
| ELEVENLABS_API_KEY | Podcast TTS | Configured |
| S3 `ai-digest-audio` (us-east-1) | Audio upload | Created |
| RESEND_API_KEY | Email delivery | NOT configured (deferred) |
| `geist` npm package | Typography | Not yet installed |
| `@anthropic-ai/sdk` >= 0.35.0 | Structured outputs | Needs version check |
| Stitch MCP | Design generation | Available |
| Playwright MCP | Screenshots | Available |
| Seed data cleared | Clean state | Pending |

---

## Success Criteria

1. Full pipeline runs end-to-end: 50+ real items from enabled sources
2. Real podcast episode (10-15 min) uploaded to S3, playable in web player
3. All 15+ pages render at 3 breakpoints (45+ screenshots, visually verified)
4. All 25+ API endpoints return correct responses (cURL verified)
5. Auth works: register, login, admin access, logout
6. Admin triggers pipeline and podcast on demand
7. Pipeline monitor shows real-time stage progress
8. Zero `cyber-*`/`neon-*` references in codebase
9. Design matches flat black professional aesthetic (zinc scale, Geist fonts, blue accent)
10. No seed data remains -- all content from real pipeline runs

---

## Unresolved Questions

1. **Session library**: next-auth, iron-session, or custom JWT? (Rec: iron-session)
2. **First admin bootstrap**: auto-promote first user or setup token? (Rec: first user = admin)
3. **Source fetch log retention**: how long? (Rec: 30 days, then prune)
4. **Concurrent pipeline runs**: allow? (Rec: no, queue them)
5. **Podcast regeneration**: replace or keep both episodes? (Rec: replace, archive old)
6. **Search engine**: PostgreSQL tsvector or external? (Rec: tsvector)

---

## Next Steps

1. Review and approve these requirements
2. Generate Stitch designs for P0 screens (visual reference)
3. Create design document (architecture decisions, DB migrations, component structure)
4. Break down into executable tasks ordered by dependency
5. Implement: auth -> theme -> pipeline -> podcast -> remaining domains
