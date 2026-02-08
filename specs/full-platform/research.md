---
spec: full-platform
phase: research
created: 2026-02-07T15:30:00-05:00
---

# Research: AI Digest Full-Stack Platform

## Executive Summary

Building a full AI news aggregation platform with Claude Agent SDK orchestration, multi-source ingestion, ElevenLabs podcast generation, and newsletter delivery is technically feasible with mature, well-documented tools. The Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`) provides built-in subagent orchestration with model selection per agent (Opus/Sonnet/Haiku). ElevenLabs JS SDK (`@elevenlabs/elevenlabs-js`) supports multi-speaker TTS with cross-request continuity for natural podcast concatenation. Resend is the recommended email provider for developer-first newsletter delivery with React Email integration and a generous free tier. Turborepo + Drizzle ORM + Railway deployment is the recommended stack for a small-team greenfield monorepo.

## Reference: UI/UX Research

All UI/UX, design system, mobile patterns, and email dark-mode research is covered in the companion spec:
**`../poc/research.md`** -- includes Stitch MCP workflow, cyberpunk color palette (WCAG-validated), NativeWind theming, typography, audio player UX, mini-player patterns, card-based feed layout, and email template constraints.

---

## 1. Claude Agent SDK for JavaScript

### Package & Installation

| Detail | Value |
|--------|-------|
| Package | `@anthropic-ai/claude-agent-sdk` |
| GitHub | [anthropics/claude-agent-sdk-typescript](https://github.com/anthropics/claude-agent-sdk-typescript) |
| Install | `npm install @anthropic-ai/claude-agent-sdk` |
| Auth | `ANTHROPIC_API_KEY` env var |
| Alt providers | AWS Bedrock, Google Vertex AI, Azure AI Foundry |

### Core API

Primary function: `query()` -- creates an async generator streaming `SDKMessage` events.

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Analyze today's AI news and generate a digest",
  options: {
    allowedTools: ["Read", "Write", "Bash", "WebSearch", "WebFetch", "Task"],
    model: "sonnet",           // per-query model selection
    maxTurns: 50,              // conversation turn limit
    maxBudgetUsd: 5.0,         // cost cap
    permissionMode: "bypassPermissions",
    systemPrompt: "You are an AI research analyst..."
  }
})) {
  if ("result" in message) console.log(message.result);
}
```

### Subagent / Multi-Agent Orchestration

Subagents are first-class. Define specialized agents with isolated context windows:

```typescript
const options = {
  allowedTools: ["Read", "WebSearch", "WebFetch", "Task"],
  agents: {
    "source-scanner": {
      description: "Scans RSS, GitHub, ArXiv for new AI content",
      prompt: "You are a data ingestion agent...",
      tools: ["WebSearch", "WebFetch", "Bash"],
      model: "haiku"  // cheap for high-volume scanning
    },
    "analyst": {
      description: "Categorizes and scores content relevance",
      prompt: "You are an AI content analyst...",
      tools: ["Read", "Write"],
      model: "sonnet"  // balanced for analysis
    },
    "synthesizer": {
      description: "Writes editorial digest from scored items",
      prompt: "You are an editorial writer...",
      tools: ["Read", "Write"],
      model: "opus"  // best quality for synthesis
    }
  }
};
```

### Model Selection & Pricing

| Model | Input/1M tokens | Output/1M tokens | Best For |
|-------|----------------|-------------------|----------|
| Claude Haiku 4.5 | $1.00 | $5.00 | High-volume scanning, simple classification |
| Claude Sonnet 4.5 | $3.00 | $15.00 | Analysis, categorization, scoring |
| Claude Opus 4.5 | $5.00 | $25.00 | Editorial synthesis, deep research |

**Cost estimate for daily run** (rough):
- Ingestion scanning (Haiku): ~20K input + 5K output tokens = ~$0.05
- Analysis/scoring (Sonnet): ~50K input + 20K output = ~$0.45
- Synthesis/editorial (Opus): ~30K input + 10K output = ~$0.40
- **Daily total: ~$0.90-$2.00** depending on content volume

Cost optimization: Batch API offers 50% discount; prompt caching saves up to 90%.

### Key SDK Features for Production

| Feature | Details |
|---------|---------|
| Sessions | Resume context across runs via `session_id` |
| Hooks | `PreToolUse`, `PostToolUse`, `Stop`, `SessionStart/End` lifecycle hooks |
| MCP integration | Connect databases, browsers, custom APIs as tools |
| Custom MCP tools | `tool()` + `createSdkMcpServer()` for in-process tools |
| Structured output | `outputFormat: { type: 'json_schema', schema: ... }` |
| Budget control | `maxBudgetUsd` caps spending per query |
| Error types | `error_max_turns`, `error_during_execution`, `error_max_budget_usd` |
| Streaming | `includePartialMessages: true` for real-time progress |

### Production Best Practices

- Use `permissionMode: "bypassPermissions"` for automated pipelines
- Set `maxTurns` and `maxBudgetUsd` to prevent runaway costs
- Use subagents with minimal `allowedTools` per role (principle of least privilege)
- Route cheap tasks to Haiku, expensive reasoning to Opus
- Use `systemPrompt` with structured instructions for consistent output
- Enable `enableFileCheckpointing` for pipeline resumability

Source: [Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview), [TypeScript Reference](https://platform.claude.com/docs/en/agent-sdk/typescript), [Anthropic Engineering Blog](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk), [NPM Package](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)

---

## 2. Deep Research Agent Architecture

### Recommended Pipeline Pattern

Based on analysis of production deep-research agents (OpenAI Deep Research, Atlassian Rovo, Tongyi DeepResearch, MCP-Agent):

```
[Scheduler/Trigger]
      |
      v
[1. INGESTION] --> Scan all sources, fetch new content
      |
      v
[2. NORMALIZATION] --> Uniform schema across sources
      |
      v
[3. CATEGORIZATION] --> Topic classification, entity extraction
      |
      v
[4. SCORING] --> Relevance, novelty, impact scoring
      |
      v
[5. DEDUPLICATION] --> Cross-source dedup by semantic similarity
      |
      v
[6. SYNTHESIS] --> Editorial summary, trend analysis
      |
      v
[7. OUTPUT] --> Digest JSON, podcast script, newsletter HTML
```

### Multi-Agent Mapping to Pipeline

| Stage | Agent Role | Model | Tools Needed |
|-------|-----------|-------|-------------|
| Ingestion | Source Scanner | Haiku | WebSearch, WebFetch, Bash (RSS/API calls) |
| Normalization | Data Normalizer | Haiku | Read, Write (schema mapping) |
| Categorization | Content Classifier | Sonnet | Read (classification prompts) |
| Scoring | Relevance Scorer | Sonnet | Read (scoring rubric) |
| Deduplication | Dedup Agent | Haiku | Read (embedding comparison) |
| Synthesis | Editorial Writer | Opus | Read, Write (long-form writing) |
| Output | Formatter | Haiku | Read, Write (template rendering) |

### Configurable Analysis

Make analysis configurable via a JSON config:

```typescript
interface DigestConfig {
  topics: { name: string; weight: number; keywords: string[] }[];
  scoring: {
    noveltyWeight: number;      // How much to value new/breaking items
    impactWeight: number;       // How much to value high-impact items
    relevanceWeight: number;    // How much to value topic-match
    minScore: number;           // Threshold for inclusion
  };
  synthesis: {
    maxItems: number;           // Max items in digest
    style: "brief" | "detailed" | "editorial";
    model: "haiku" | "sonnet" | "opus";
  };
}
```

### Context Persistence Between Runs

Options for memory across daily runs:
1. **Database** -- Store previous digests, seen URLs, entity history in PostgreSQL
2. **Agent SDK Sessions** -- Resume sessions for multi-turn context (limited to single session)
3. **File-based state** -- Write/read JSON state files between runs
4. **Recommendation**: Database for structured data + file-based state for agent prompts

### Learnings from Open-Source Projects

| Project | Architecture Pattern | Key Insight |
|---------|---------------------|-------------|
| [auto-news](https://github.com/finaldie/auto-news) | Airflow DAGs + LangChain + Notion | Noise reduction targeting 80%+ removal is critical |
| [AiLert](https://github.com/anuj0456/ailert) | Flask + DynamoDB + modular services | 150+ sources with async service handlers per source type |
| [Podcastfy](https://github.com/souzatharsis/podcastfy) | Python pipeline: ingest -> transcript -> TTS -> concat | Supports 100+ LLMs for transcript generation |
| [PersonaPod](https://github.com/treynorman/PersonaPod) | RSS + voice cloning + local models | Voice persona cloning for consistent podcast hosts |

Source: [Multi-Agent Deep Research Architecture](https://trilogyai.substack.com/p/multi-agent-deep-research-architecture), [OpenAI Deep Research Architecture](https://cobusgreyling.medium.com/openai-deep-research-ai-agent-architecture-7ac52b5f6a01), [Google Cloud Agentic Design Patterns](https://docs.google.com/architecture/choose-design-pattern-agentic-ai-system), [MCP-Agent Deep Research](https://thealliance.ai/blog/building-a-deep-research-agent-using-mcp-agent)

---

## 3. Data Source Integrations

### Source-by-Source Research

#### RSS Feeds

| Detail | Value |
|--------|-------|
| Library | [`rss-parser`](https://www.npmjs.com/package/rss-parser) (most popular, TypeScript support) |
| Alt | [`feedsmith`](https://github.com/macieklamberski/feedsmith) (RSS, Atom, RDF, JSON Feed + OPML) |
| Usage | `parser.parseURL(url)` returns JS objects with `title`, `link`, `pubDate`, `content` |
| Rate limits | Per-feed; respect `<ttl>` element; 5-15 min polling interval typical |
| Custom fields | `customFields` option for non-standard RSS elements |

Key AI/ML RSS feeds to monitor:
- OpenAI Blog, Anthropic Blog, Google AI Blog, Meta AI Blog
- MIT Technology Review AI, The Gradient, Distill.pub
- Import AI, The Batch (Andrew Ng), AI Alignment Forum

#### GitHub API

| Detail | Value |
|--------|-------|
| Endpoint | `GET /search/repositories?q=topic:ai+created:>2026-02-01&sort=stars` |
| Trending | No official trending API; use search with `created:>DATE&sort=stars` |
| Auth | Personal access token recommended (5,000 req/hr vs 60 unauthenticated) |
| Rate limit | 5,000 requests/hour (authenticated), 30 search requests/minute |
| JS client | `@octokit/rest` or raw `fetch` |

Source: [GitHub Rate Limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)

#### HuggingFace API

| Detail | Value |
|--------|-------|
| Hub API | `https://huggingface.co/api/models?sort=lastModified&direction=-1&limit=50` |
| JS client | `@huggingface/hub` for repo/model/dataset operations |
| OpenAPI spec | `https://huggingface.co/.well-known/openapi.json` |
| Webhooks | Real-time repo update notifications available |
| Rate limits | Account-tier based; upgrade for elevated access |
| Filtering | By task type, library, language, recent updates |

Source: [HuggingFace Hub API](https://huggingface.co/docs/hub/api), [huggingface.js](https://huggingface.co/docs/huggingface.js/en/index)

#### ArXiv API

| Detail | Value |
|--------|-------|
| Base URL | `http://export.arxiv.org/api/query` |
| Category search | `search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL` |
| Pagination | `start=0&max_results=100` (max 2,000 per request, 30,000 total) |
| Response format | Atom 1.0 XML (parse with `fast-xml-parser` or `xml2js`) |
| Rate limit | No hard limit; 3-second delay between requests requested |
| Auth | None required |
| Sorting | `sortBy=lastUpdatedDate&sortOrder=descending` |

Source: [arXiv API User Manual](https://info.arxiv.org/help/api/user-manual.html)

#### Reddit API

| Detail | Value |
|--------|-------|
| Subreddits | r/MachineLearning, r/LocalLLaMA, r/artificial, r/singularity |
| Auth | OAuth2 required; 100 req/min authenticated, 10 unauthenticated |
| Rate limit | 100 requests/minute per OAuth client ID |
| Pricing | Free for non-commercial/personal use |
| Gotcha | Pre-approval now required for new API applications (2025 change) |
| JS client | `snoowrap` or raw OAuth2 + fetch |

**Warning**: Reddit's 2025 API crackdown requires pre-approval for personal projects. Consider using RSS feeds for subreddits (`https://www.reddit.com/r/MachineLearning/.rss`) as a simpler alternative.

Source: [Reddit API Rate Limits 2026](https://painonsocial.com/blog/reddit-api-rate-limits-guide), [Reddit API Pre-Approval 2025](https://replydaddy.com/blog/reddit-api-pre-approval-2025-personal-projects-crackdown)

#### Hacker News (Algolia API)

| Detail | Value |
|--------|-------|
| Search by relevance | `GET https://hn.algolia.com/api/v1/search?query=AI&tags=story` |
| Search by date | `GET https://hn.algolia.com/api/v1/search_by_date?query=machine+learning&tags=story` |
| Filters | `tags` (story, comment, ask_hn), `numericFilters` (points>100) |
| Pagination | `page` (0-based), `hitsPerPage` (default 20) |
| Rate limit | Generous; no documented hard limit |
| Auth | None required |

Source: [HN Algolia API](https://hn.algolia.com/api)

#### Product Hunt API

| Detail | Value |
|--------|-------|
| API type | GraphQL |
| Endpoint | `https://api.producthunt.com/v2/api/graphql` |
| Auth | Bearer token required (`Authorization: Bearer {token}`) |
| Query | Filter posts by topic (AI), date range, votes |
| Rate limit | Not publicly documented; moderate usage expected |

Source: [Product Hunt API Docs](https://api.producthunt.com/v2/docs)

### Normalization Schema

```typescript
interface NormalizedItem {
  id: string;                    // deterministic hash of source + sourceId
  source: "rss" | "github" | "huggingface" | "arxiv" | "reddit" | "hackernews" | "producthunt";
  sourceId: string;              // original ID from source
  sourceUrl: string;             // canonical URL
  title: string;
  summary: string;               // extracted or generated
  content?: string;              // full text if available
  authors: string[];
  publishedAt: Date;
  fetchedAt: Date;
  categories: string[];          // normalized topic tags
  metadata: Record<string, unknown>;  // source-specific data (stars, points, etc.)
  // Added by analysis pipeline:
  relevanceScore?: number;       // 0-1
  noveltyScore?: number;         // 0-1
  impactScore?: number;          // 0-1
  compositeScore?: number;       // weighted combination
}
```

---

## 4. ElevenLabs Podcast Audio Generation

### SDK & API

| Detail | Value |
|--------|-------|
| Package | `@elevenlabs/elevenlabs-js` (official) |
| Install | `npm install @elevenlabs/elevenlabs-js` |
| Alt packages | `@elevenlabs/client` (browser), `@elevenlabs/react` (React) |
| API endpoint | `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}` |
| Auth | `xi-api-key` header |

### Multi-Speaker Podcast Generation Strategy

ElevenLabs does NOT have a single "generate podcast" endpoint. Instead, build multi-speaker podcasts by:

1. **Generate script** -- Use Claude to create a dialogue script with speaker labels
2. **Split by speaker** -- Parse script into segments: `[{speaker, text, order}]`
3. **TTS per segment** -- Call `textToSpeech.convert()` per segment with appropriate `voice_id`
4. **Concatenate audio** -- Use `ffmpeg` (via `fluent-ffmpeg` npm) or Web Audio API to join segments
5. **Add intro/outro** -- Prepend/append music or jingles

### Cross-Segment Continuity

For natural-sounding transitions between segments:

```typescript
const segment = await elevenlabs.textToSpeech.convert(voiceId, {
  text: segmentText,
  model_id: "eleven_multilingual_v2",
  previous_request_ids: [previousSegmentRequestId],  // continuity
  next_text: nextSegmentText,                         // prosody hint
  voice_settings: {
    stability: 0.5,
    similarity_boost: 0.75,
    speed: 1.0,
    style: 0.5
  }
});
```

### Voice Selection for Podcast Hosts

- Use 2-3 distinct voices for multi-speaker feel
- ElevenLabs provides pre-made voices (e.g., "Rachel", "Adam", "Antoni")
- Voice cloning available on paid plans (Starter+) for custom host voices
- Recommend: 1 male + 1 female voice for dialogue variety

### Pricing & Limits

| Plan | Price/mo | Credits/mo | ~Audio Minutes | Commercial Use |
|------|----------|------------|----------------|---------------|
| Free | $0 | 10,000 | ~12-15 min | No (attribution required) |
| Starter | $4.17 | 30,000 | ~30 min | Yes |
| Creator | $11.00 | 100,000 | ~100 min | Yes |
| Pro | $82.50 | 500,000 | ~500 min | Yes |
| Scale | $275.00 | 2,000,000 | ~2,000 min | Yes |

**For a daily 10-20 min podcast**: Creator plan ($11/mo, ~100 min) should suffice for ~5-10 episodes/month. Pro plan needed for daily generation.

### Audio Formats

| Format | Quality | Size | Use Case |
|--------|---------|------|----------|
| `mp3_44100_128` | Standard | Small | Default, web streaming |
| `mp3_44100_192` | High (Creator+) | Medium | Podcast distribution |
| `pcm_44100` | Lossless (Pro+) | Large | Post-processing |

### Latency Expectations

- Single segment (1-2 paragraphs): 2-5 seconds
- Full 15-min episode (~20 segments): 2-5 minutes total generation
- Streaming mode available for real-time use cases (75ms first byte)

Source: [ElevenLabs TTS API](https://elevenlabs.io/docs/api-reference/text-to-speech/convert), [ElevenLabs Podcasts](https://elevenlabs.io/use-cases/podcasts), [ElevenLabs JS SDK](https://github.com/elevenlabs/elevenlabs-js), [ElevenLabs Pricing](https://elevenlabs.io/pricing/api)

---

## 5. Newsletter Email Delivery

### Provider Comparison

| Feature | Resend | SendGrid | Postmark | Loops |
|---------|--------|----------|----------|-------|
| **Free tier** | 3,000 emails/mo | 100/day | None | 1,000 contacts, 4K sends/mo |
| **Paid start** | $20/mo (50K) | $19.95/mo (50K) | $15/mo (10K) | Contact-based |
| **React Email** | Native | No | No | No |
| **Developer DX** | Excellent | Good | Good | Good |
| **Deliverability** | Dynamic IPs | Shared/Dedicated | Industry-best | Good |
| **Newsletter focus** | Marketing + Transactional | Full suite | Transactional-first | SaaS marketing |
| **Subscriber mgmt** | Contact-based pricing | List management | Minimal | Built-in |
| **Webhooks** | Delivery, open, click, bounce | Full analytics | Full analytics | Basic |
| **DKIM/SPF/DMARC** | Yes | Yes | Yes | Yes |

### Recommendation: Resend

**Why Resend for this project:**
1. **React Email integration** -- Build templates as React components, ship as HTML
2. **Developer-first API** -- Simple, modern, well-documented
3. **Free tier** -- 3,000 emails/month covers early growth (< 1,000 subscribers)
4. **Marketing contacts** -- Free plan includes 1,000 contacts with unlimited sends
5. **Next.js native** -- Works seamlessly with App Router server actions

### Implementation Pattern

```typescript
import { Resend } from 'resend';
import { DigestEmail } from '@/emails/digest-template';

const resend = new Resend(process.env.RESEND_API_KEY);

// Send daily digest
await resend.emails.send({
  from: 'AI Digest <digest@yourdomain.com>',
  to: subscriberEmails,
  subject: `AI Digest - ${formatDate(today)}`,
  react: DigestEmail({ items: digestItems, date: today }),
});

// Subscriber management
await resend.contacts.create({
  email: 'user@example.com',
  audienceId: process.env.RESEND_AUDIENCE_ID,
});
```

### Email Setup Requirements

| Requirement | Details |
|-------------|---------|
| Custom domain | Required for production sending |
| DNS records | DKIM (TXT), SPF (TXT), DMARC (TXT) |
| Verification | Domain verification via DNS |
| Sender | `noreply@yourdomain.com` or `digest@yourdomain.com` |
| Unsubscribe | One-click unsubscribe header (required by Gmail 2024+) |

Source: [Resend Pricing](https://resend.com/pricing), [Resend Free Tier](https://resend.com/blog/new-free-tier), [Postmark vs SendGrid](https://www.courier.com/integrations/compare/postmark-vs-sendgrid), [Best Transactional Email Services 2026](https://knock.app/blog/the-top-transactional-email-services-for-developers)

---

## 6. Monorepo & Project Architecture

### Turborepo (Recommended)

| Aspect | Turborepo | Nx |
|--------|-----------|-----|
| Setup time | < 10 minutes | Hours |
| Learning curve | Minimal | Steep |
| Small projects (< 5 pkgs) | 3x faster builds | Slower |
| Large projects (50+ pkgs) | Adequate | 7x better |
| JS/TS only | Yes | Polyglot |
| Maintained by | Vercel | Nrwl |
| Next.js compat | Native (same company) | Good |

**Recommendation**: Turborepo. Small team, greenfield, Next.js-centric. Minimal overhead, immediate value.

### Recommended Monorepo Structure

```
ai-digest/
  apps/
    web/                    # Next.js App Router (consumer-facing)
    admin/                  # Next.js admin dashboard (or same app with auth)
  packages/
    agents/                 # Claude Agent SDK pipeline
      src/
        coordinator.ts      # Main orchestrator agent
        scanners/           # Source-specific ingestion agents
        analyzers/          # Categorization, scoring agents
        synthesizers/       # Digest writing, script generation
        config.ts           # DigestConfig schema
    db/                     # Drizzle ORM schemas + migrations
    email/                  # React Email templates + send logic
    podcast/                # ElevenLabs TTS + audio pipeline
    shared/                 # Types, utils, constants
      src/
        types/              # NormalizedItem, DigestConfig, etc.
        utils/              # Date formatting, hashing, etc.
  turbo.json
  package.json
  tsconfig.base.json
```

### Drizzle ORM (Recommended over Prisma)

| Aspect | Drizzle | Prisma |
|--------|---------|--------|
| Bundle size | ~7kb (minified+gzipped) | Heavy (Rust binary) |
| Cold start | Negligible | Measurable (engine spawn) |
| SQL control | Full (SQL-like API) | Abstracted |
| Type inference | Runtime (no codegen) | Generated (codegen step) |
| Migrations | `drizzle-kit` push/generate | `prisma migrate` |
| Serverless | Excellent | Requires adapter |
| Learning curve | Steeper (SQL knowledge needed) | Gentler |

**Recommendation**: Drizzle for this project. Serverless-friendly, lightweight, full SQL control. Schema-as-code with TypeScript inference.

### Database: PostgreSQL

Use PostgreSQL for:
- Normalized items with JSONB metadata columns
- Full-text search on titles/summaries
- Digest history and versioning
- Subscriber management
- Pipeline run logs and status

Host on Railway (included), Supabase (generous free tier), or Neon (serverless Postgres).

### State Management: Zustand

For global audio player state across the web app:
- Zustand avoids React Context re-render cascade
- Selector-based subscriptions (only re-render components using specific state slices)
- Middleware support (persist to localStorage, devtools)
- ~1kb bundle size

```typescript
interface AudioStore {
  currentEpisode: Episode | null;
  isPlaying: boolean;
  progress: number;
  playbackSpeed: number;
  play: (episode: Episode) => void;
  pause: () => void;
  setProgress: (progress: number) => void;
  setSpeed: (speed: number) => void;
}
```

### File Storage: Cloudflare R2

| Aspect | Cloudflare R2 | AWS S3 |
|--------|--------------|--------|
| Storage | $0.015/GB/mo | $0.023/GB/mo |
| Egress | **$0 (free)** | $0.09/GB |
| Free tier | 10 GB storage, 10M reads, 1M writes/mo | 5 GB, 20K GET, 2K PUT |
| CDN | Integrated with Cloudflare CDN | Requires CloudFront setup |
| S3 compatibility | Full S3 API compatible | Native |

**Recommendation**: Cloudflare R2 for audio file storage. Zero egress fees are critical for audio streaming (large files, many downloads). Free tier covers early usage easily.

**Cost estimate**: 30 episodes x 30MB avg = ~1 GB/month storage ($0.015) + unlimited streaming = **< $1/month** for audio delivery.

Source: [Turborepo vs Nx 2026](https://dev.to/dataformathub/turborepo-nx-and-lerna-the-truth-about-monorepo-tooling-in-2026-71), [Drizzle vs Prisma](https://betterstack.com/community/guides/scaling-nodejs/drizzle-vs-prisma/), [Cloudflare R2 vs S3](https://www.cloudflare.com/pg-cloudflare-r2-vs-aws-s3/), [Zustand vs Context 2025](https://dev.to/cristiansifuentes/react-state-management-in-2025-context-api-vs-zustand-385m)

---

## 7. Scheduling & Orchestration

### Recommended: BullMQ + Redis

For production pipeline orchestration, BullMQ provides:

| Feature | Details |
|---------|---------|
| Job persistence | Redis-backed, survives restarts |
| Scheduling | Cron expressions, delays, repeatable jobs |
| Flows | Parent-child job dependencies (child must complete before parent) |
| Retries | Configurable retry strategies with backoff |
| Concurrency | Configurable workers per queue |
| Rate limiting | Built-in rate limiter per queue |
| Monitoring | Bull Board or Arena for web UI |
| Events | Real-time job lifecycle events |

### Pipeline Architecture with BullMQ

```typescript
import { Queue, Worker, FlowProducer } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL);

// Define pipeline as a flow (parent waits for children)
const flowProducer = new FlowProducer({ connection });

await flowProducer.add({
  name: 'daily-digest',
  queueName: 'pipeline',
  children: [
    { name: 'ingest-rss', queueName: 'ingestion', data: { source: 'rss' } },
    { name: 'ingest-github', queueName: 'ingestion', data: { source: 'github' } },
    { name: 'ingest-arxiv', queueName: 'ingestion', data: { source: 'arxiv' } },
    { name: 'ingest-hn', queueName: 'ingestion', data: { source: 'hackernews' } },
  ]
});

// Schedule daily run
const pipelineQueue = new Queue('pipeline', { connection });
await pipelineQueue.upsertJobScheduler('daily-digest-schedule', {
  pattern: '0 6 * * *', // 6 AM daily
});
```

### Alternative: Simple node-cron (for MVP)

For a simpler MVP approach, `node-cron` works if:
- Single process (no horizontal scaling)
- Jobs can be lost on restart (acceptable for daily digest that can re-run)
- No need for complex job dependencies

```typescript
import cron from 'node-cron';
cron.schedule('0 6 * * *', () => runDigestPipeline());
```

### Pipeline Resumability

BullMQ flows enable resumability: if the "ingest-arxiv" job fails, the pipeline can be retried from that specific step without re-running completed ingestion jobs. Each job has its own retry policy and failure handling.

### Manual Trigger

Expose an admin API endpoint to trigger the pipeline on-demand:

```typescript
// POST /api/admin/pipeline/trigger
export async function POST(req: NextRequest) {
  await pipelineQueue.add('manual-digest', { manual: true, triggeredBy: adminId });
  return NextResponse.json({ status: 'triggered' });
}
```

Source: [BullMQ Docs](https://docs.bullmq.io), [BullMQ Getting Started](https://betterstack.com/community/guides/scaling-nodejs/bullmq-scheduled-tasks/), [node-cron](https://www.npmjs.com/package/node-cron)

---

## 8. Authentication & Security

### Admin Auth for v1.0

For a v1.0 with a single admin (or small team), keep it simple:

**Option A: API Key + Middleware (Simplest)**

```typescript
// middleware.ts
export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/admin') ||
      req.nextUrl.pathname.startsWith('/admin')) {
    const apiKey = req.headers.get('x-api-key') || req.cookies.get('admin-token')?.value;
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
}
```

**Option B: Better Auth or Lucia (Lightweight)**

For a slightly more robust solution, [Better Auth](https://www.better-auth.com/) or [Lucia](https://lucia-auth.com/) provide:
- Session-based auth with cookie management
- Password hashing (bcrypt/argon2)
- CSRF protection
- Database adapter for Drizzle

### Rate Limiting

| Library | Details |
|---------|---------|
| `@upstash/ratelimit` | Redis-backed, serverless-friendly, sliding window |
| `express-rate-limit` | In-memory, simple, for Express/Node servers |

Recommended: `@upstash/ratelimit` with Upstash Redis (free tier: 10K commands/day).

### Environment Variable Management

```
# .env.local (gitignored)
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=xi-...
RESEND_API_KEY=re_...
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
ADMIN_API_KEY=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_ENDPOINT=...
```

Use `@t3-oss/env-nextjs` for typed environment variable validation with Zod.

---

## 9. Deployment Options

### Comparison

| Feature | Railway | Vercel | Fly.io |
|---------|---------|--------|--------|
| **Cron jobs** | Native (cron service) | Limited (serverless, max 300s) | Native (schedule services) |
| **Long-running** | Yes (persistent containers) | No (serverless timeout) | Yes (VMs) |
| **PostgreSQL** | Included (add-on) | No (use external) | Included (Fly Postgres) |
| **Redis** | Included (add-on) | No (use Upstash) | Included (Fly Redis) |
| **Next.js** | Full support | Native (best) | Full support |
| **Pricing start** | $5/mo (Hobby) | $20/mo (Pro) | ~$3-5/mo (shared VM) |
| **Typical cost** | $8-15/mo | $20+ + extras | $5-10/mo |
| **DX** | Git push deploy, dashboard | Git push deploy, preview | Docker deploy, CLI |
| **WebSockets** | Yes | Limited | Yes |
| **Docker** | Yes | No | Yes (native) |

### Recommendation: Railway (Primary) + Vercel (Frontend Optional)

**Why Railway:**
1. Persistent containers -- required for BullMQ workers and long-running agent pipelines
2. Built-in PostgreSQL and Redis add-ons
3. Native cron service support
4. Git-push deploys with preview environments
5. $5/mo Hobby plan covers development; Pro at $20/mo for production
6. Typical Next.js app: $8-15/month total

**Deployment architecture:**

```
Railway Project
  |-- web (Next.js app)           # API routes + SSR + admin dashboard
  |-- worker (BullMQ worker)      # Pipeline processor
  |-- postgres (database)         # Drizzle + digest data
  |-- redis (cache/queue)         # BullMQ job queue
  |-- cron (scheduler service)    # Triggers daily pipeline
```

**Alternative**: If preferring Vercel for the Next.js frontend (best SSR/Edge performance), deploy only the frontend there and keep the worker + cron + database on Railway. This "split" architecture adds complexity but gives the best of both worlds.

### Cost Estimate (Monthly)

| Component | Provider | Estimated Cost |
|-----------|----------|---------------|
| Web + Worker | Railway Pro | $20/mo |
| PostgreSQL | Railway (included) | $0 (within plan) |
| Redis | Railway (included) | $0 (within plan) |
| Audio storage | Cloudflare R2 | < $1/mo |
| Audio CDN | Cloudflare (included with R2) | $0 |
| Email | Resend Free | $0 (< 3K emails) |
| TTS | ElevenLabs Creator | $11/mo |
| Claude API | Anthropic | ~$30-60/mo |
| Domain | Any registrar | ~$12/yr |
| **Total** | | **~$62-92/mo** |

Source: [Railway vs Vercel](https://docs.railway.com/platform/compare-to-vercel), [Railway vs Fly](https://docs.railway.com/maturity/compare-to-fly), [Vercel Cron Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Deploying Full Stack 2026](https://www.nucamp.co/blog/deploying-full-stack-apps-in-2026-vercel-netlify-railway-and-cloud-options)

---

## 10. Existing Similar Projects

### Project Analysis

| Project | Tech Stack | Sources | Output | Stars | Key Pattern |
|---------|-----------|---------|--------|-------|-------------|
| [auto-news](https://github.com/finaldie/auto-news) | Python, Airflow, LangChain | RSS, Reddit, Twitter, YouTube | Notion pages | ~1.5K | Airflow DAGs for pipeline orchestration; 80%+ noise reduction |
| [AiLert](https://github.com/anuj0456/ailert) | Python, Flask, DynamoDB | 150+ sources (arXiv, GitHub, RSS) | Newsletter email | ~200 | Modular async service handlers per source type |
| [Podcastfy](https://github.com/souzatharsis/podcastfy) | Python, FastAPI | Any text/PDF/URL/YouTube | Multi-speaker podcast | ~2K | Content -> LLM transcript -> multi-TTS -> concat audio |
| [PersonaPod](https://github.com/treynorman/PersonaPod) | Python, local models | RSS feeds | Podcast with cloned voices | ~100 | Voice persona cloning for consistent hosts |
| [Kaiban Agents](https://github.com/kaiban-ai/kaiban-agents-aggregator) | JavaScript, React, KaibanJS | Newsletter RSS | Aggregated feed | ~50 | Multi-agent AI with KaibanJS framework |
| [Newsprint](https://github.com/acopelan/newsprint) | Google Apps Script | RSS, Google Alerts | Kindle/email digest | ~100 | Self-hosted, privacy-first, minimal infrastructure |

### Architecture Patterns Worth Adopting

1. **auto-news**: Noise reduction as explicit pipeline stage (filters 80%+ irrelevant content)
2. **AiLert**: Modular service handlers -- one service class per source type, independently deployable
3. **Podcastfy**: TTS pipeline pattern -- script generation with LLM, per-speaker TTS calls, audio concatenation with ffmpeg
4. **PersonaPod**: Consistent host voices via persona definition -- reusable across episodes

### What No Existing Project Does Well

None of the surveyed projects combine ALL of:
- TypeScript/Next.js stack (most are Python)
- Claude Agent SDK for orchestration (most use LangChain or custom)
- Multi-source + scoring + editorial synthesis
- Automated podcast generation
- Newsletter delivery
- Consumer-facing web app with player
- Admin dashboard

This confirms our platform fills a genuine architectural gap.

Source: [auto-news](https://github.com/finaldie/auto-news), [AiLert](https://github.com/anuj0456/ailert), [Podcastfy](https://github.com/souzatharsis/podcastfy), [PersonaPod](https://github.com/treynorman/PersonaPod), [Kaiban Agents Aggregator](https://github.com/kaiban-ai/kaiban-agents-aggregator)

---

## Quality Commands

**Not applicable** -- greenfield project with no existing `package.json` or CI configuration.

| Type | Command | Source |
|------|---------|--------|
| Lint | Not found | N/A |
| TypeCheck | Not found | N/A |
| Unit Test | Not found | N/A |
| Build | Not found | N/A |

Quality commands will be defined during project setup (Turborepo configuration).

---

## Related Specs

| Spec | Relevance | Relationship | May Need Update |
|------|-----------|-------------|-----------------|
| `poc` | **High** | UI/UX design companion -- provides all visual design, component architecture, and mobile patterns | No -- poc focuses on design; this spec covers backend/pipeline/delivery |

The `poc` spec's open questions about newsletter delivery (#5), audio source (#6), and transcript format (#7) are answered by this research:
- Newsletter: Resend with React Email
- Audio: ElevenLabs TTS via Agent SDK pipeline
- Transcript: JSON with speaker labels and timestamps, generated during script creation

---

## Feasibility Assessment

| Aspect | Assessment | Notes |
|--------|------------|-------|
| Technical Viability | **High** | All components have mature SDKs and APIs |
| Effort Estimate | **XL** | Full platform: agents + pipeline + web + admin + audio + email |
| Risk Level | **Medium** | Main risks: agent cost management, ElevenLabs quality/cost, pipeline reliability |
| Cost (monthly) | **Medium** | ~$62-92/mo at launch, scales with usage |
| Time to MVP | **L** | 4-6 weeks for core pipeline + basic web UI + newsletter |

### Key Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Claude API costs exceed budget | Medium | High | Use Haiku for scanning, set `maxBudgetUsd`, cache prompts |
| ElevenLabs audio quality inconsistent | Low | Medium | Test voice settings extensively, use continuity params |
| Reddit API access denied | Medium | Low | Use RSS fallback for subreddits |
| Pipeline takes too long (>30 min) | Medium | Medium | Parallelize ingestion, timeout per stage |
| BullMQ/Redis failure | Low | High | Redis persistence, job retry policies, alerting |

---

## Recommendations for Requirements

1. **Start with 4 core sources** for MVP: RSS feeds, Hacker News (Algolia), ArXiv, GitHub. Add Reddit/HuggingFace/ProductHunt in v1.1.

2. **Use Claude Agent SDK subagents** with model routing: Haiku for ingestion, Sonnet for analysis, Opus for synthesis. Define `maxBudgetUsd` per daily run.

3. **BullMQ + Redis for pipeline**, not node-cron. Worth the setup cost for resumability, monitoring, and job persistence.

4. **Resend for email** with React Email templates. Free tier covers initial growth. Domain setup required.

5. **ElevenLabs Creator plan** ($11/mo) for podcast generation. Generate per-speaker segments and concatenate with ffmpeg. Use `previous_request_ids` for cross-segment continuity.

6. **Turborepo monorepo** with packages: `agents`, `db`, `email`, `podcast`, `shared`. Apps: `web` (Next.js).

7. **Drizzle ORM + PostgreSQL** for data persistence. Schema-as-code, serverless-friendly, no codegen step.

8. **Cloudflare R2** for audio storage with zero egress fees. S3-compatible API.

9. **Railway** for deployment -- supports long-running workers, cron, built-in Postgres/Redis.

10. **Zustand** for global audio player state. Selector-based subscriptions avoid re-render cascade.

11. **Phase the build**: Pipeline MVP first (agents + DB + basic API), then web UI, then podcast, then newsletter. Validate each layer before adding the next.

---

## Open Questions

1. **Custom domain**: What domain will be used for the platform and email sending?
2. **Content volume**: How many items per day should the digest target (10? 25? 50?)?
3. **Podcast frequency**: Daily episodes or weekly roundups? (Affects ElevenLabs plan selection)
4. **Podcast script style**: Conversational dialogue between two hosts? Or single narrator with commentary?
5. **Admin scope**: Single admin or multi-user team access?
6. **Mobile app**: Is the web app sufficient, or is a native mobile app (Expo) planned for v1?
7. **Monetization**: Free service, freemium, or paid subscriptions? Affects auth/billing requirements.

---

## Sources

### Claude Agent SDK
- [Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [TypeScript SDK Reference](https://platform.claude.com/docs/en/agent-sdk/typescript)
- [GitHub: claude-agent-sdk-typescript](https://github.com/anthropics/claude-agent-sdk-typescript)
- [NPM: @anthropic-ai/claude-agent-sdk](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)
- [Building Agents with Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Claude API Pricing](https://platform.claude.com/docs/en/about-claude/pricing)

### Data Sources
- [arXiv API User Manual](https://info.arxiv.org/help/api/user-manual.html)
- [GitHub REST API Rate Limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [HuggingFace Hub API](https://huggingface.co/docs/hub/api)
- [HN Algolia API](https://hn.algolia.com/api)
- [Reddit API Rate Limits 2026](https://painonsocial.com/blog/reddit-api-rate-limits-guide)
- [Product Hunt API](https://api.producthunt.com/v2/docs)
- [rss-parser NPM](https://www.npmjs.com/package/rss-parser)

### ElevenLabs
- [ElevenLabs TTS API](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)
- [ElevenLabs JS SDK](https://github.com/elevenlabs/elevenlabs-js)
- [ElevenLabs Podcasts](https://elevenlabs.io/use-cases/podcasts)
- [ElevenLabs Pricing](https://elevenlabs.io/pricing/api)

### Email
- [Resend Pricing](https://resend.com/pricing)
- [Resend Free Tier](https://resend.com/blog/new-free-tier)
- [Postmark vs SendGrid 2026](https://www.courier.com/integrations/compare/postmark-vs-sendgrid)
- [Best Transactional Email Services 2026](https://knock.app/blog/the-top-transactional-email-services-for-developers)

### Architecture & Infrastructure
- [Turborepo vs Nx 2026](https://dev.to/dataformathub/turborepo-nx-and-lerna-the-truth-about-monorepo-tooling-in-2026-71)
- [Drizzle vs Prisma](https://betterstack.com/community/guides/scaling-nodejs/drizzle-vs-prisma/)
- [Drizzle vs Prisma 2026](https://medium.com/@thebelcoder/prisma-vs-drizzle-orm-in-2026-what-you-really-need-to-know-9598cf4eaa7c)
- [Zustand vs Context 2025](https://dev.to/cristiansifuentes/react-state-management-in-2025-context-api-vs-zustand-385m)
- [BullMQ Documentation](https://docs.bullmq.io)
- [BullMQ Scheduled Tasks](https://betterstack.com/community/guides/scaling-nodejs/bullmq-scheduled-tasks/)
- [Cloudflare R2 vs S3](https://www.cloudflare.com/pg-cloudflare-r2-vs-aws-s3/)

### Deployment
- [Railway vs Vercel](https://docs.railway.com/platform/compare-to-vercel)
- [Railway vs Fly](https://docs.railway.com/maturity/compare-to-fly)
- [Deploying Full Stack 2026](https://www.nucamp.co/blog/deploying-full-stack-apps-in-2026-vercel-netlify-railway-and-cloud-options)
- [Vercel Cron Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)

### Similar Projects
- [auto-news](https://github.com/finaldie/auto-news)
- [AiLert](https://github.com/anuj0456/ailert)
- [Podcastfy](https://github.com/souzatharsis/podcastfy)
- [PersonaPod](https://github.com/treynorman/PersonaPod)
- [Kaiban Agents Aggregator](https://github.com/kaiban-ai/kaiban-agents-aggregator)

### Agent Architecture
- [Multi-Agent Deep Research](https://trilogyai.substack.com/p/multi-agent-deep-research-architecture)
- [OpenAI Deep Research Architecture](https://cobusgreyling.medium.com/openai-deep-research-ai-agent-architecture-7ac52b5f6a01)
- [Google Cloud Agentic Design Patterns](https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system)
- [MCP-Agent Deep Research](https://thealliance.ai/blog/building-a-deep-research-agent-using-mcp-agent)
