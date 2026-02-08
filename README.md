# AI Digest

A full-stack AI news aggregation platform that automatically fetches content from multiple sources, processes it through a multi-stage Claude AI pipeline, generates podcast episodes with ElevenLabs TTS, and delivers newsletters via email.

## Architecture

```
ai-digest/
├── apps/
│   ├── web/          # Next.js 15 frontend + API routes
│   └── worker/       # BullMQ background job processor
├── packages/
│   ├── shared/       # TypeScript types, utilities, constants
│   ├── db/           # Drizzle ORM schema, queries, migrations
│   ├── agents/       # Source fetchers + Claude AI pipeline stages
│   ├── email/        # Resend email delivery + subscriber management
│   └── podcast/      # TTS generation, audio assembly, S3 upload
├── turbo.json        # Turborepo task configuration
└── pnpm-workspace.yaml
```

### Monorepo Structure

Built as a **Turborepo monorepo** with **pnpm workspaces**. Each package is independently typed and built, with cross-package imports via `@ai-digest/*` namespace.

| Package | Purpose |
|---------|---------|
| `@ai-digest/web` | Next.js 15 App Router — pages, API routes, middleware, auth |
| `@ai-digest/worker` | BullMQ workers for `pipeline` and `podcast` job queues |
| `@ai-digest/shared` | Shared TypeScript types (pipeline, episode, source, subscriber, digest) |
| `@ai-digest/db` | Drizzle ORM — 10 tables, query functions, migrations |
| `@ai-digest/agents` | 7 source fetchers + 7 AI pipeline stages |
| `@ai-digest/email` | Resend SDK — newsletter rendering, delivery, subscriber management |
| `@ai-digest/podcast` | ElevenLabs TTS, ffmpeg assembly, S3 upload |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+, TypeScript 5.7 (strict mode) |
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Database | PostgreSQL with Drizzle ORM |
| Job Queue | BullMQ + Redis |
| AI | Anthropic Claude API (Haiku 4.5, Sonnet 4.5) with Zod structured outputs |
| TTS | ElevenLabs (raw fetch API for voice continuity) |
| Audio | ffmpeg (segment concatenation, silence gaps, loudness normalization) |
| Storage | AWS S3 (podcast audio files) |
| Email | Resend (newsletter delivery with one-click unsubscribe) |
| Auth | iron-session (encrypted cookies, bcrypt password hashing) |
| Search | PostgreSQL tsvector (full-text search with GIN index) |
| Package Manager | pnpm 8.6 |
| Build | Turborepo |

## Features

### Content Aggregation

Seven source fetchers pull AI/ML content from across the web:

| Fetcher | Source | Method |
|---------|--------|--------|
| RSS | Configurable RSS/Atom feeds | `rss-parser` |
| GitHub | Trending AI repositories | GitHub API |
| ArXiv | Latest AI/ML papers | ArXiv API |
| Hacker News | Top AI-related stories | HN API |
| HuggingFace | Trending models & datasets | HF API |
| Reddit | AI subreddit top posts | Reddit API |
| ProductHunt | AI product launches | ProductHunt API |

### AI Pipeline

A 7-stage processing pipeline powered by Claude:

```
Ingest → Normalize → Categorize → Score → Dedup → Synthesize → Output
```

| Stage | Model | Purpose |
|-------|-------|---------|
| **Ingest** | — | Fetch from all configured sources |
| **Normalize** | — | Standardize items into unified schema |
| **Categorize** | Haiku 4.5 | Assign topic categories (LLMs, Computer Vision, etc.) |
| **Score** | Sonnet 4.5 | Rate relevance/significance (0-100) |
| **Dedup** | Haiku 4.5 | Remove duplicate/similar items |
| **Synthesize** | Sonnet 4.5 | Generate editorial digest with analysis |
| **Output** | — | Persist digest and items to database |

Each stage uses **Zod structured outputs** for type-safe AI responses and **prompt caching** for token efficiency. Per-stage cost tracking records model used, tokens in/out, and USD cost.

### Podcast Generation

A separate 6-sub-stage pipeline generates podcast episodes from digests:

```
Content Selection → Script Generation → Quality Review → TTS → Assembly → S3 Upload
```

- **Configurable duration**: 5–20 minutes (drives word count and story selection)
- **Quality review loop**: Up to 3 attempts with a 7/10 quality threshold
- **ElevenLabs TTS**: Uses raw `fetch` (not SDK) to capture `request-id` response headers for cross-segment voice continuity
- **ffmpeg assembly**: Concatenates segments with 300–500ms silence gaps, applies EBU R128 loudness normalization (-16 LUFS), injects ID3 metadata
- **S3 upload**: Uploads final MP3 with content-type metadata

### Newsletter

- Resend-powered email delivery with retry logic
- HTML newsletter rendering from digest content
- One-click unsubscribe via signed tokens
- Subscriber management (add, remove, list)

### Web Application

**16 pages** across consumer and admin areas:

#### Consumer Pages
| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page |
| Digests | `/digests` | Latest AI digest feed |
| Digest Detail | `/digests/[id]` | Full digest with categorized items |
| Podcasts | `/podcasts` | Episode library with audio player |
| Podcast Detail | `/podcasts/[id]` | Episode page with embedded player |
| Search | `/search` | Full-text search across all content |
| Archive | `/archive` | Historical digest archive |
| Login | `/login` | Authentication |
| Register | `/register` | New account creation |

#### Admin Pages
| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/admin` | Stats overview, pipeline history, source health |
| Sources | `/admin/sources` | CRUD for content sources |
| Pipeline | `/admin/pipeline` | Trigger runs, view stage progress |
| Podcast | `/admin/podcast` | Generate episodes, preview scripts |
| Subscribers | `/admin/subscribers` | Manage email subscribers |
| Schedule | `/admin/schedule` | Configure cron schedule |
| Config | `/admin/config` | System configuration |

### API Endpoints

**28 API routes** organized by domain:

#### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/digests` | List digests |
| GET | `/api/digests/latest` | Get latest digest |
| GET | `/api/digests/[id]` | Get digest by ID |
| GET | `/api/episodes` | List episodes |
| GET | `/api/episodes/[id]` | Get episode by ID |
| GET | `/api/search?q=` | Full-text search |
| POST | `/api/subscribe` | Subscribe to newsletter |
| POST | `/api/unsubscribe` | Unsubscribe from newsletter |

#### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account (first user auto-promoted to admin) |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Destroy session |
| GET | `/api/auth/me` | Get current session |

#### Admin (requires admin session)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/health` | Source health metrics |
| GET/POST | `/api/admin/sources` | List/create sources |
| PUT/DELETE | `/api/admin/sources/[id]` | Update/delete source |
| POST | `/api/admin/sources/validate` | Validate source URL |
| POST | `/api/admin/pipeline/trigger` | Start pipeline run |
| GET | `/api/admin/pipeline/status` | Pipeline run status |
| GET | `/api/admin/pipeline/runs` | Pipeline run history |
| POST | `/api/admin/podcast/generate` | Generate podcast episode |
| GET | `/api/admin/podcast/status` | Podcast generation status |
| POST | `/api/admin/podcast/preview` | Preview podcast script |
| GET | `/api/admin/subscribers` | List subscribers |
| DELETE | `/api/admin/subscribers/[id]` | Remove subscriber |
| GET | `/api/admin/newsletter/[digestId]/html` | Render newsletter HTML |
| GET/PUT | `/api/admin/config` | System config |
| GET/PUT | `/api/admin/config/[key]` | Individual config key |

### Authentication

- **iron-session**: Encrypted HTTP-only cookies (`ai-digest-session`)
- **bcrypt**: Password hashing with cost factor 10
- **First-user promotion**: The first registered user is automatically promoted to admin role
- **Role-based access**: `user` and `admin` roles
- **Middleware**: Protects `/admin/*` routes, redirects unauthenticated users to `/login`

### Design System

Flat black professional theme inspired by Linear, Vercel Dashboard, and Raycast:

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#09090B` (zinc-950) | Page background |
| Card | `#18181B` (zinc-900) | Cards, panels |
| Elevated | `#27272A` (zinc-800) | Hover states, elevated surfaces |
| Border | `#3F3F46` (zinc-700) | Borders, dividers |
| Text | `#FAFAFA` (zinc-50) | Primary text |
| Muted | `#A1A1AA` (zinc-400) | Secondary text |
| Accent | `#3B82F6` (blue-500) | Links, buttons, highlights |

Typography: Geist Sans (headings), Inter (body), Geist Mono (code, timestamps, scores).

## Database Schema

10 tables managed by Drizzle ORM:

| Table | Purpose |
|-------|---------|
| `users` | Auth accounts (email, passwordHash, role, timestamps) |
| `sources` | Content source configs (type, url, health tracking) |
| `source_fetch_log` | Fetch attempt history (itemCount, error, duration) |
| `normalized_items` | Fetched content in unified schema (with tsvector search) |
| `digests` | Generated editorial digests |
| `digest_items` | Many-to-many: digest ↔ normalized items |
| `episodes` | Podcast episodes (audioUrl, duration, stages, script preview) |
| `transcripts` | Episode transcripts |
| `pipeline_runs` / `pipeline_stages` | Pipeline execution tracking (status, cost, tokens) |
| `subscribers` | Newsletter subscribers |
| `config` | Key-value system configuration |

## Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** 8.6+
- **PostgreSQL** (local instance)
- **Redis** (for BullMQ job queues)
- **ffmpeg** (for podcast audio assembly)

### Setup

1. **Clone and install dependencies:**

```bash
git clone https://github.com/krzemienski/ai-digest.git
cd ai-digest
pnpm install
```

2. **Create environment file:**

```bash
cp .env.example .env.local
```

3. **Configure required environment variables:**

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...        # Claude API access
DATABASE_URL=postgresql://localhost:5432/ai_digest_dev
REDIS_URL=redis://localhost:6379
SESSION_SECRET=<min-32-char-secret>  # iron-session encryption key

# Podcast generation
ELEVENLABS_API_KEY=...               # ElevenLabs TTS

# Object storage (podcast audio)
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
S3_REGION=us-east-1

# Optional
RESEND_API_KEY=...                   # Newsletter delivery
GITHUB_TOKEN=...                     # GitHub fetcher (higher rate limits)
PRODUCTHUNT_TOKEN=...                # ProductHunt fetcher
```

4. **Create the database:**

```bash
createdb ai_digest_dev
```

5. **Run migrations:**

```bash
cd packages/db
pnpm drizzle-kit push
```

6. **Build all packages:**

```bash
pnpm build
```

7. **Start development servers:**

```bash
# Terminal 1 — Web app
pnpm --filter web dev

# Terminal 2 — Worker (pipeline + podcast jobs)
cd apps/worker && npx tsx src/index.ts
```

8. **Register the first user** (auto-promoted to admin):

Visit `http://localhost:3000/register` and create an account.

### Running the Pipeline

1. Log in to the admin dashboard at `/admin`
2. Configure sources at `/admin/sources`
3. Trigger a pipeline run at `/admin/pipeline`
4. Once complete, generate a podcast episode at `/admin/podcast`

The pipeline also runs automatically on a configurable cron schedule (default: `0 6 * * *` — daily at 6 AM).

## Development

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm check-types` | TypeScript type checking across all packages |
| `pnpm lint` | Lint all packages |

### Project Conventions

- **TypeScript strict mode** with `noUncheckedIndexedAccess` enabled
- **Immutable patterns** — new objects over mutation
- **Zod validation** on all API inputs
- **Drizzle ORM** for type-safe database queries
- **Turborepo** caching for incremental builds

## License

Private project.
