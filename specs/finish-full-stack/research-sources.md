# AI Digest Platform - Source Research & Configuration Guide

> Comprehensive catalog of feeds, APIs, and sources for the AI Digest aggregation platform.
> Researched: February 2026

---

## Table of Contents

1. [RSS Feed Sources](#1-rss-feed-sources)
2. [GitHub Trending Configuration](#2-github-trending-configuration)
3. [ArXiv Categories & Configuration](#3-arxiv-categories--configuration)
4. [Hacker News Configuration](#4-hacker-news-configuration)
5. [HuggingFace Hub](#5-huggingface-hub)
6. [Reddit Subreddits](#6-reddit-subreddits)
7. [Product Hunt](#7-product-hunt)
8. [Additional Sources Not Yet Implemented](#8-additional-sources-not-yet-implemented)
9. [Source Quality Scoring Framework](#9-source-quality-scoring-framework)
10. [Deduplication Strategies](#10-deduplication-strategies)
11. [Recommended Seed Configuration](#11-recommended-seed-configuration)

---

## 1. RSS Feed Sources

### 1.1 Major AI Labs

| Source | RSS Feed URL | Frequency | Quality | Notes |
|--------|-------------|-----------|---------|-------|
| OpenAI Blog | `https://openai.com/news/rss.xml` | 2-5x/week | Very High | Official announcements, research |
| OpenAI (alt) | `https://openai.com/feed.xml?format=xml` | 2-5x/week | Very High | Alternate format |
| Anthropic News | No official RSS; use community feed | 1-3x/week | Very High | Use RSSHub or scraping fallback |
| Anthropic Engineering | `https://raw.githubusercontent.com/conoro/anthropic-engineering-rss-feed/main/anthropic_engineering_rss.xml` | 1-2x/week | Very High | Community-maintained |
| Google DeepMind | `https://deepmind.google/blog/rss.xml` | 2-4x/week | Very High | Research + product updates |
| Google AI Blog | `https://blog.google/technology/ai/rss/` | 3-5x/week | Very High | Broader Google AI coverage |
| Google Research | `https://research.google/blog/rss/` | 1-2x/week | Very High | Deep research posts |
| Meta AI (Engineering) | `https://engineering.fb.com/feed/` | 2-3x/week | High | AI research category at `/category/ai-research/` |
| Microsoft Research | `https://www.microsoft.com/en-us/research/blog/feed/` | 3-5x/week | Very High | Broad research coverage |
| xAI | No official RSS available | Sporadic | High | Monitor `https://x.ai/news` via scraping |
| NVIDIA AI Blog | `https://blogs.nvidia.com/feed/` | 3-5x/week | High | Hardware + software AI |
| NVIDIA Developer Blog | `https://developer.nvidia.com/blog/feed` | 2-3x/week | High | Technical deep dives |
| AWS Machine Learning | `https://aws.amazon.com/blogs/machine-learning/feed/` | 3-5x/week | Medium-High | Cloud ML, SageMaker |
| Intel AI Blog | `https://ai.intel.com/blog/feed` | 1-2x/week | Medium | Hardware-focused AI |

### 1.2 AI News Sites

| Source | RSS Feed URL | Frequency | Quality | Notes |
|--------|-------------|-----------|---------|-------|
| The Verge (AI) | `https://www.theverge.com/rss/ai-artificial-intelligence/index.xml` | 5-10x/day | High | Mainstream AI coverage |
| Ars Technica (AI) | `https://arstechnica.com/ai/feed/` | 2-5x/day | High | Technical depth |
| TechCrunch (AI) | `https://techcrunch.com/category/artificial-intelligence/feed/` | 5-10x/day | Medium-High | Startup/industry focus |
| VentureBeat (AI) | `https://venturebeat.com/category/ai/feed/` | 5-10x/day | Medium-High | Enterprise AI focus |
| MIT Technology Review | `https://www.technologyreview.com/topic/artificial-intelligence/feed` | 2-5x/day | Very High | Deep analysis, paywalled |
| Wired (AI) | `https://www.wired.com/feed/tag/ai/latest/rss` | 2-5x/day | High | Broad tech coverage |
| Wired (AI Category) | `https://www.wired.com/feed/category/artificial-intelligence/rss` | 2-5x/day | High | Category-specific |
| IEEE Spectrum | `https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss` | 1-3x/day | Very High | Engineering perspective |
| Nature (ML) | `https://www.nature.com/natmachintell.rss` | Weekly | Very High | Premier research journal |

### 1.3 Research & Technical Blogs

| Source | RSS Feed URL | Frequency | Quality | Notes |
|--------|-------------|-----------|---------|-------|
| Towards Data Science | `https://towardsdatascience.com/feed` | 10+/day | Medium | Community posts, variable quality |
| Machine Learning Mastery | `https://machinelearningmastery.com/blog/feed` | 2-3x/week | High | Tutorials, accessible |
| fast.ai | `https://www.fast.ai/atom.xml` | 1-2x/month | Very High | Jeremy Howard's blog |
| Distill.pub | `https://distill.pub/rss.xml` | Sporadic | Very High | Interactive ML explanations (inactive since 2021) |
| BAIR Blog (Berkeley) | `https://bair.berkeley.edu/blog/feed.xml` | 1-2x/month | Very High | Academic research |
| Lil'Log (Lilian Weng) | `https://lilianweng.github.io/index.xml` | Monthly | Very High | OpenAI researcher, deep tutorials |
| Jay Alammar | `https://jalammar.github.io/feed.xml` | Monthly | Very High | Visual ML explanations |
| Colah's Blog | `https://colah.github.io/rss.xml` | Rare | Very High | Classic neural net explanations |
| The Gradient | `https://thegradientpub.substack.com/feed` | 1-2x/week | Very High | In-depth AI perspectives |
| WildML | `https://www.wildml.com/feed/` | Inactive | High | Historical value |

### 1.4 Newsletters (with RSS)

| Source | RSS Feed URL | Frequency | Quality | Notes |
|--------|-------------|-----------|---------|-------|
| The Batch (Andrew Ng) | `https://www.deeplearning.ai/the-batch/feed/` | Weekly | Very High | Curated AI news |
| Import AI (Jack Clark) | `https://importai.substack.com/feed` | Weekly | Very High | AI policy + research, Anthropic co-founder |
| The Gradient | `https://thegradientpub.substack.com/feed` | 1-2x/week | Very High | Research perspectives |
| Ahead of AI (Raschka) | `https://magazine.sebastianraschka.com/feed` | Biweekly | Very High | Deep ML research analysis |
| Last Week in AI | `https://lastweekin.ai/feed` | Weekly | High | Comprehensive AI news roundup |
| AI Weekly | `https://aiweekly.co/issues.rss` | Weekly | Medium-High | Curated links |
| TLDR AI | `https://tldr.tech/ai/rss` | Daily | Medium-High | Concise daily digest |
| Interconnects (Lambert) | `https://www.interconnects.ai/feed` | 1-2x/week | Very High | RLHF, alignment research |
| Davis Summarizes Papers | `https://dblalock.substack.com/feed` | Weekly | High | Paper summaries |

### 1.5 Industry / VC Blogs

| Source | RSS Feed URL | Frequency | Quality | Notes |
|--------|-------------|-----------|---------|-------|
| a16z Blog | `https://a16z.com/feed/` | 3-5x/week | High | Venture capital AI perspective |
| a16z AI Podcast | `https://feeds.simplecast.com/Hb_IuXOo` | Weekly | High | Audio content |
| Y Combinator Blog | `https://www.ycombinator.com/blog/feed/` | 1-2x/week | High | Startup ecosystem |
| Sequoia Capital | `https://www.sequoiacap.com/feed/` | 1-2x/month | High | Investment perspective |

### 1.6 Company Engineering Blogs (AI-relevant)

| Source | RSS Feed URL | Frequency | Quality |
|--------|-------------|-----------|---------|
| Netflix TechBlog | `https://netflixtechblog.com/feed` | 1-2x/week | High |
| Uber Engineering | `https://www.uber.com/blog/engineering/rss/` | 1-2x/week | High |
| Spotify Engineering | `https://engineering.atspotify.com/feed/` | 1-2x/week | Medium-High |
| LinkedIn Engineering | `https://engineering.linkedin.com/blog.rss.html` | 1-2x/week | High |
| Airbnb Tech | `https://medium.com/feed/airbnb-engineering` | 1-2x/week | High |

---

## 2. GitHub Trending Configuration

### 2.1 Fetcher Strategy

GitHub does not have an official "trending" API. Use a combination of:

1. **GitHub Search API** (`https://api.github.com/search/repositories`) with date-filtered star queries
2. **GitHub RSS Feeds** for release tracking
3. **Unofficial trending scrapers** like `https://github.com/trending` (HTML scraping)

### 2.2 Best Topics/Tags for AI Repos

```json
{
  "primary_topics": [
    "artificial-intelligence",
    "machine-learning",
    "deep-learning",
    "large-language-models",
    "llm",
    "natural-language-processing",
    "computer-vision",
    "generative-ai",
    "transformer",
    "reinforcement-learning"
  ],
  "trending_topics_2025_2026": [
    "ai-agents",
    "rag",
    "retrieval-augmented-generation",
    "fine-tuning",
    "mlops",
    "text-to-image",
    "text-to-video",
    "multimodal",
    "diffusion-models",
    "vector-database",
    "function-calling",
    "mcp",
    "model-context-protocol"
  ]
}
```

### 2.3 Key Repos to Track for Releases

Use the GitHub Releases API: `https://api.github.com/repos/{owner}/{repo}/releases`

Or the Releases RSS feed: `https://github.com/{owner}/{repo}/releases.atom`

| Repo | Stars (approx) | Category | Release Feed |
|------|----------------|----------|--------------|
| `huggingface/transformers` | 140k+ | NLP/ML Framework | `https://github.com/huggingface/transformers/releases.atom` |
| `pytorch/pytorch` | 85k+ | ML Framework | `https://github.com/pytorch/pytorch/releases.atom` |
| `langchain-ai/langchain` | 100k+ | LLM Framework | `https://github.com/langchain-ai/langchain/releases.atom` |
| `run-llama/llama_index` | 40k+ | RAG Framework | `https://github.com/run-llama/llama_index/releases.atom` |
| `ollama/ollama` | 110k+ | Local LLM Runner | `https://github.com/ollama/ollama/releases.atom` |
| `vllm-project/vllm` | 40k+ | LLM Inference | `https://github.com/vllm-project/vllm/releases.atom` |
| `ggerganov/llama.cpp` | 75k+ | LLM Inference (C++) | `https://github.com/ggerganov/llama.cpp/releases.atom` |
| `openai/openai-python` | 25k+ | OpenAI SDK | `https://github.com/openai/openai-python/releases.atom` |
| `anthropics/anthropic-sdk-python` | 5k+ | Anthropic SDK | `https://github.com/anthropics/anthropic-sdk-python/releases.atom` |
| `microsoft/autogen` | 40k+ | Multi-agent | `https://github.com/microsoft/autogen/releases.atom` |
| `crewAIInc/crewAI` | 25k+ | AI Agents | `https://github.com/crewAIInc/crewAI/releases.atom` |
| `AUTOMATIC1111/stable-diffusion-webui` | 145k+ | Image Gen UI | `https://github.com/AUTOMATIC1111/stable-diffusion-webui/releases.atom` |
| `comfyanonymous/ComfyUI` | 65k+ | Image Gen UI | `https://github.com/comfyanonymous/ComfyUI/releases.atom` |
| `lm-sys/FastChat` | 38k+ | LLM Chat/Eval | `https://github.com/lm-sys/FastChat/releases.atom` |
| `tensorflow/tensorflow` | 187k+ | ML Framework | `https://github.com/tensorflow/tensorflow/releases.atom` |
| `modelcontextprotocol/servers` | 15k+ | MCP Servers | `https://github.com/modelcontextprotocol/servers/releases.atom` |
| `dagger/dagger` | 12k+ | AI Pipelines | `https://github.com/dagger/dagger/releases.atom` |
| `open-webui/open-webui` | 60k+ | LLM Web UI | `https://github.com/open-webui/open-webui/releases.atom` |

### 2.4 GitHub Search API: Trending Detection Strategy

```
GET https://api.github.com/search/repositories
  ?q=topic:machine-learning+created:>2026-02-01+stars:>50
  &sort=stars
  &order=desc
  &per_page=30
```

**Rate Limits:**
- Unauthenticated: 10 requests/minute
- Authenticated: 30 requests/minute for search API
- General API: 5,000 requests/hour (authenticated)

**Recommended queries (rotate daily):**
```
stars:>100 created:>{7_days_ago} topic:artificial-intelligence
stars:>50 created:>{7_days_ago} topic:llm
stars:>50 pushed:>{1_day_ago} topic:machine-learning sort:stars
language:python topic:deep-learning stars:>20 created:>{30_days_ago}
```

---

## 3. ArXiv Categories & Configuration

### 3.1 RSS Feed Format

```
Base URL: https://rss.arxiv.org/rss/{category}
ATOM URL: https://rss.arxiv.org/atom/{category}
Combined: https://rss.arxiv.org/rss/{cat1}+{cat2}+{cat3}
Max results: 2000 per feed request
```

**Update Schedule:** Daily at midnight Eastern US time. No updates on Saturday/Sunday (papers announced Mon-Thu and Sun at 8pm ET).

**Feed Status:** `https://rss.arxiv.org/feed/status`

### 3.2 Most Relevant Categories

| Category | Name | Daily Volume (est.) | Relevance | Priority |
|----------|------|---------------------|-----------|----------|
| `cs.AI` | Artificial Intelligence | ~80-120/day | Very High | P0 |
| `cs.CL` | Computation & Language (NLP) | ~150-250/day | Very High | P0 |
| `cs.CV` | Computer Vision | ~200-300/day | High | P0 |
| `cs.LG` | Machine Learning | ~250-400/day | Very High | P0 |
| `stat.ML` | Statistics - Machine Learning | ~50-80/day | High | P1 |
| `cs.IR` | Information Retrieval | ~30-50/day | Medium-High | P1 |
| `cs.RO` | Robotics | ~40-60/day | Medium | P2 |
| `cs.NE` | Neural & Evolutionary Computing | ~20-30/day | Medium | P2 |
| `cs.MA` | Multiagent Systems | ~10-20/day | Medium | P2 |
| `cs.HC` | Human-Computer Interaction | ~20-30/day | Low-Medium | P3 |
| `cs.CR` | Cryptography (AI security) | ~30-50/day | Low-Medium | P3 |
| `eess.AS` | Audio & Speech Processing | ~20-30/day | Medium | P2 |

**Total estimated daily volume for P0 categories: ~700-1100 papers/day**

### 3.3 Recommended Combined Feed

```
# Primary feed (core AI/ML):
https://rss.arxiv.org/rss/cs.AI+cs.CL+cs.CV+cs.LG

# Secondary feed (supporting areas):
https://rss.arxiv.org/rss/stat.ML+cs.IR+cs.RO+cs.NE
```

### 3.4 Quality Filtering Strategies

ArXiv does not have a built-in quality signal, so apply post-fetch filtering:

1. **Citation velocity** - Cross-reference with Semantic Scholar API (`https://api.semanticscholar.org/graph/v1/paper/arXiv:{id}`) to check citation counts
2. **Author authority** - Track known prolific researchers (h-index proxies)
3. **HuggingFace Daily Papers** - Cross-reference with HF papers (curated selection)
4. **Social signal** - Cross-reference with HN/Reddit/Twitter mentions
5. **Keyword scoring** - Boost papers mentioning key terms (see Section 9)
6. **Institutional affiliation** - Papers from top labs (Google, Meta, OpenAI, etc.) get priority

### 3.5 ArXiv Search API (Alternative)

```
GET http://export.arxiv.org/api/query
  ?search_query=cat:cs.LG
  &start=0
  &max_results=100
  &sortBy=submittedDate
  &sortOrder=descending
```

**Rate Limit:** 1 request every 3 seconds. Use bulk downloads for large queries.

---

## 4. Hacker News Configuration

### 4.1 API Endpoints

**Base URL:** `https://hn.algolia.com/api/v1`

| Endpoint | Description | Sort |
|----------|-------------|------|
| `GET /search?query=...` | Search (relevance) | Relevance, then points, then comments |
| `GET /search_by_date?query=...` | Search (chronological) | Most recent first |
| `GET /items/:id` | Get item details | N/A |

### 4.2 Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `query` | Search string | `query=large language model` |
| `tags` | Filter by type (AND by default, OR in parens) | `tags=story` or `tags=(story,poll)` |
| `numericFilters` | Numeric field filters | `numericFilters=points>100,created_at_i>1706745600` |
| `hitsPerPage` | Results per page (max 1000) | `hitsPerPage=50` |
| `page` | Pagination | `page=0` |

**Tag Values:**
- `story`, `comment`, `poll`, `pollopt`, `show_hn`, `ask_hn`, `front_page`
- `author_{username}` - filter by author

### 4.3 Recommended Search Queries for AI Content

Run these queries daily via `search_by_date` with `tags=story` and `numericFilters=points>10`:

```json
{
  "primary_queries": [
    "artificial intelligence",
    "machine learning",
    "large language model",
    "LLM",
    "GPT",
    "Claude",
    "Gemini AI",
    "neural network",
    "deep learning",
    "transformer model"
  ],
  "secondary_queries": [
    "OpenAI",
    "Anthropic",
    "DeepMind",
    "computer vision",
    "natural language processing",
    "fine-tuning",
    "RAG retrieval",
    "AI safety",
    "AI alignment",
    "diffusion model",
    "text-to-image",
    "AI agent",
    "prompt engineering",
    "AI regulation"
  ],
  "trending_queries_2025_2026": [
    "AI coding",
    "vibe coding",
    "model context protocol",
    "AI reasoning",
    "open source LLM",
    "local LLM",
    "multimodal AI",
    "AI video generation",
    "AI chips",
    "AI inference"
  ]
}
```

### 4.4 Recommended Configuration

```typescript
const HN_CONFIG = {
  // Minimum points to consider a story
  minPoints: 10,

  // For front-page quality stories
  highQualityMinPoints: 50,

  // Time window: last 24 hours
  timeWindowHours: 24,

  // Max stories per fetch cycle
  hitsPerPage: 50,

  // Polling interval
  fetchIntervalMinutes: 30,

  // Example API call:
  // https://hn.algolia.com/api/v1/search_by_date?query=AI&tags=story&numericFilters=points>10,created_at_i>{unix_24h_ago}&hitsPerPage=50
};
```

### 4.5 Rate Limits

The HN Algolia API is generous but undocumented officially. Community consensus:
- ~10,000 requests/hour is safe
- Use reasonable delays (1-2 seconds between requests)
- Cache results aggressively

---

## 5. HuggingFace Hub

### 5.1 API Endpoints

**Base URL:** `https://huggingface.co/api`

| Endpoint | Description | Auth Required |
|----------|-------------|---------------|
| `GET /api/models` | List/search models | No (rate-limited) |
| `GET /api/models?sort=trending` | Trending models | No |
| `GET /api/models?sort=downloads` | Most downloaded | No |
| `GET /api/models?sort=likes` | Most liked | No |
| `GET /api/models?sort=lastModified` | Recently updated | No |
| `GET /api/datasets` | List/search datasets | No |
| `GET /api/datasets?sort=trending` | Trending datasets | No |
| `GET /api/spaces` | List/search spaces | No |
| `GET /api/spaces?sort=trending` | Trending spaces | No |
| `GET /api/daily_papers` | Daily curated papers | No |
| `GET /api/daily_papers?date=2026-02-07` | Papers for specific date | No |

**OpenAPI Spec:** `https://huggingface.co/.well-known/openapi.json`

### 5.2 Useful Model Query Parameters

| Parameter | Values | Description |
|-----------|--------|-------------|
| `sort` | `trending`, `downloads`, `likes`, `lastModified`, `created` | Sort order |
| `direction` | `-1` (desc), `1` (asc) | Sort direction |
| `limit` | 1-100 | Results per page |
| `filter` | tag filter | e.g., `text-generation`, `image-classification` |
| `search` | text query | Search in model name/description |
| `author` | username | Filter by author |
| `library` | framework name | e.g., `transformers`, `diffusers`, `gguf` |

### 5.3 What to Track

| Content Type | Endpoint | Frequency | Value |
|-------------|----------|-----------|-------|
| Trending Models | `/api/models?sort=trending&limit=30` | Every 6 hours | High - shows what's hot |
| Daily Papers | `/api/daily_papers` | Daily | Very High - curated research |
| Trending Spaces | `/api/spaces?sort=trending&limit=20` | Every 12 hours | High - demos/apps |
| New Datasets | `/api/datasets?sort=lastModified&limit=20` | Daily | Medium |
| Text-gen Models | `/api/models?sort=trending&filter=text-generation&limit=20` | Every 12 hours | High |

### 5.4 Rate Limits

- Unauthenticated: ~100 requests/hour (estimated)
- Authenticated (free token): Higher limits
- Get a token at `https://huggingface.co/settings/tokens`
- Pass via header: `Authorization: Bearer hf_xxxxx`

### 5.5 Webhooks

HuggingFace supports webhooks for real-time notifications on repo changes:
- Configure at: `https://huggingface.co/settings/webhooks`
- Triggers: model updates, new models, space deployments, paper additions

---

## 6. Reddit Subreddits

### 6.1 Recommended Subreddits

| Subreddit | Subscribers | Content Type | Quality | SNR |
|-----------|-------------|-------------|---------|-----|
| r/MachineLearning | 3M+ | Research papers, industry news | Very High | High |
| r/artificial | 500k+ | General AI news | Medium | Medium |
| r/LocalLLaMA | 500k+ | Open-source LLMs, local inference | High | High |
| r/ChatGPT | 5M+ | ChatGPT-specific, consumer AI | Low-Medium | Low |
| r/singularity | 1M+ | AGI speculation, AI news | Low-Medium | Low |
| r/LanguageTechnology | 50k+ | NLP research | High | High |
| r/deeplearning | 200k+ | DL research and tutorials | High | Medium-High |
| r/reinforcementlearning | 50k+ | RL research | High | High |
| r/StableDiffusion | 500k+ | Image generation | Medium | Medium |
| r/Oobabooga | 50k+ | Local text generation | Medium | Medium |
| r/OpenAI | 1M+ | OpenAI products/news | Medium | Low-Medium |
| r/ClaudeAI | 200k+ | Anthropic products/news | Medium | Low-Medium |

### 6.2 API Configuration

**Base URL:** `https://oauth.reddit.com`

**Authentication:** OAuth 2.0 required (no anonymous API access since 2023)

```typescript
const REDDIT_CONFIG = {
  // OAuth endpoint
  tokenUrl: "https://www.reddit.com/api/v1/access_token",

  // Listing endpoints
  hotEndpoint: "/r/{subreddit}/hot.json",
  topEndpoint: "/r/{subreddit}/top.json?t=day",
  newEndpoint: "/r/{subreddit}/new.json",

  // Search endpoint
  searchEndpoint: "/r/{subreddit}/search.json?q={query}&sort=top&t=day",

  // Rate limits
  requestsPerMinute: 60, // with OAuth
  requestWindow: "10 minute rolling average",

  // Recommended: fetch top daily from each subreddit
  fetchIntervalMinutes: 60,
  minScore: 50, // for r/MachineLearning
  minScoreGeneral: 100, // for larger subs like r/ChatGPT
};
```

### 6.3 Rate Limits (2025-2026)

- **OAuth authenticated:** 100 queries per minute (QPM) per client ID, averaged over 10-minute window
- **Unauthenticated:** 10 requests/minute (IP-based) - NOT recommended
- **Free tier:** Non-commercial use only (personal projects, academic research)
- **Commercial:** Requires prior approval, may incur fees
- **Important:** Rate limits apply per OAuth client ID, not per user

### 6.4 RSS Alternative (No Auth Needed)

Reddit still serves RSS feeds without authentication:

```
https://www.reddit.com/r/MachineLearning/top/.rss?t=day
https://www.reddit.com/r/LocalLLaMA/hot/.rss
https://www.reddit.com/r/MachineLearning/.rss?limit=25
```

**Limitation:** RSS feeds have fewer fields (no score in RSS), limited to 25 items, and may be rate-limited by IP. Best used as a fallback or supplement.

---

## 7. Product Hunt

### 7.1 Current API Status

The Product Hunt V2 GraphQL API (`https://api.producthunt.com/v2/api/graphql`) remains available but with significant limitations:
- V1 REST API is **fully deprecated**
- V2 responses have **redacted maker names/usernames** since Feb 2023
- Twitter usernames return `None`
- Authentication required via OAuth

### 7.2 GraphQL Query for AI Products

```graphql
query {
  posts(
    order: RANKING
    topic: "artificial-intelligence"
    postedAfter: "2026-02-06T00:00:00Z"
    first: 20
  ) {
    edges {
      node {
        id
        name
        tagline
        description
        url
        votesCount
        commentsCount
        createdAt
        topics {
          edges {
            node {
              name
            }
          }
        }
        thumbnail {
          url
        }
      }
    }
  }
}
```

### 7.3 Relevant Topics

```
artificial-intelligence, machine-learning, chatgpt, developer-tools,
saas, productivity, open-source, api, no-code, automation
```

### 7.4 Rate Limits

- Authenticated: ~450 requests per 15-minute window
- Requires API key from: `https://www.producthunt.com/v2/oauth/applications`

---

## 8. Additional Sources Not Yet Implemented

### 8.1 YouTube AI Channels

YouTube provides RSS feeds per channel: `https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}`

| Channel | Channel ID | Subscribers | Content | Feed URL |
|---------|-----------|-------------|---------|----------|
| Two Minute Papers | `UCbfYPyITQ-7l4upoX8nvctg` | 1.6M | AI paper summaries | `https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg` |
| Yannic Kilcher | `UCZHmQk67mSJgfCCTn7xBfew` | 250k+ | Deep paper analysis | `https://www.youtube.com/feeds/videos.xml?channel_id=UCZHmQk67mSJgfCCTn7xBfew` |
| AI Explained | `UCNJ1Ymd5yFuUPtn21xtRbbw` | 500k+ | AI capability analysis | `https://www.youtube.com/feeds/videos.xml?channel_id=UCNJ1Ymd5yFuUPtn21xtRbbw` |
| Matthew Berman | `UCMp36FHKAQ-HqVNRFCK6VlA` | 330k+ | AI news & tutorials | `https://www.youtube.com/feeds/videos.xml?channel_id=UCMp36FHKAQ-HqVNRFCK6VlA` |
| 3Blue1Brown | `UCYO_jab_esuFRV4b17AJtAw` | 6M+ | Math/ML explanations | `https://www.youtube.com/feeds/videos.xml?channel_id=UCYO_jab_esuFRV4b17AJtAw` |
| Fireship | `UCsBjURrPoezykLs9EqgamOA` | 3M+ | Quick tech explainers | `https://www.youtube.com/feeds/videos.xml?channel_id=UCsBjURrPoezykLs9EqgamOA` |
| Andrej Karpathy | `UCXUPKJO5MZQN11PqgIvyuvQ` | 1M+ | Deep ML tutorials | `https://www.youtube.com/feeds/videos.xml?channel_id=UCXUPKJO5MZQN11PqgIvyuvQ` |
| Lex Fridman | `UCSHZKyawb77ixDdsGog4iWA` | 4M+ | AI interviews | `https://www.youtube.com/feeds/videos.xml?channel_id=UCSHZKyawb77ixDdsGog4iWA` |

**Implementation effort:** Low - YouTube RSS feeds are free, reliable, and require no authentication. Would need a new `YouTubeFetcher` that parses RSS and extracts video metadata.

**Recommendation:** HIGH PRIORITY - Easy to implement, high-value content.

### 8.2 Twitter/X Lists

**Current State:** X API pricing is prohibitive for most use cases:
- Free tier: 1 request per 15 minutes (read), write-only focus
- Basic: $200/month, 10,000 tweets/month read
- Pro: $5,000/month, 1M tweets read

**Alternatives:**
- **TwitterAPI.io:** $0.15 per 1,000 tweets (unofficial third-party)
- **Apify scraping actors:** Pay-per-use, no API keys needed
- **Nitter instances:** Mostly defunct as of 2024-2025

**Key AI Accounts to Track (if budget allows):**
```
@ylecun, @kaboris, @AndrewYNg, @demaboris, @sama,
@elaboris, @hardmaru, @jeffdean, @goodfellow_ian,
@iaboris, @OpenAI, @AnthropicAI, @GoogleDeepMind,
@xaboris, @huggingface, @weights_biases
```

**Recommendation:** LOW PRIORITY - Cost prohibitive. Consider implementing later if budget allows, using third-party services.

### 8.3 Conference Proceedings

| Conference | Frequency | Proceedings URL | Access |
|-----------|-----------|-----------------|--------|
| NeurIPS | Annual (Dec) | `https://proceedings.neurips.cc/` | Open access |
| ICML | Annual (Jul) | `https://proceedings.mlr.press/` | Open access (PMLR) |
| ICLR | Annual (May) | `https://openreview.net/group?id=ICLR.cc` | Open access (OpenReview) |
| AAAI | Annual (Feb) | `https://ojs.aaai.org/index.php/AAAI` | Open access |
| ACL | Annual (Jul) | `https://aclanthology.org/` | Open access |
| EMNLP | Annual (Dec) | `https://aclanthology.org/` | Open access |
| CVPR | Annual (Jun) | `https://openaccess.thecvf.com/` | Open access |

**RSS for Conference Papers:** The CPR-RSS project (`https://github.com/CPR-RSS/CPR-RSS.github.io`) provides RSS feeds for NeurIPS, ICML, and ICLR.

**Recommendation:** MEDIUM PRIORITY - Implement as a seasonal source. Most accepted papers first appear on ArXiv, so there's overlap. Main value is the "accepted at top venue" quality signal.

### 8.4 Semantic Scholar API

```
Base URL: https://api.semanticscholar.org/graph/v1

GET /paper/search?query=large+language+model&year=2026&fieldsOfStudy=Computer+Science
GET /paper/{paper_id}?fields=title,abstract,citationCount,influentialCitationCount
GET /paper/arXiv:{arxiv_id}
```

- **Rate Limit:** 1 request/second (unauthenticated), 10/second (with API key)
- **Free API keys** available at: `https://www.semanticscholar.org/product/api`

**Recommendation:** HIGH PRIORITY for quality scoring - Use citation counts and influential citation counts as quality signals for ArXiv papers.

### 8.5 Patent Filings

- **Google Patents:** `https://patents.google.com/` - No official API
- **USPTO API:** `https://developer.uspto.gov/api-catalog` - Free, structured data
- **Lens.org:** `https://www.lens.org/` - Scholarly + patent search API

**Recommendation:** LOW PRIORITY - Patents are lagging indicators, often 18 months behind research.

---

## 9. Source Quality Scoring Framework

### 9.1 Source Authority Scoring

Assign each source a base authority score (0-100):

```typescript
const SOURCE_AUTHORITY: Record<string, number> = {
  // Tier 1: Primary research labs (90-100)
  "openai.com": 98,
  "anthropic.com": 97,
  "deepmind.google": 98,
  "ai.meta.com": 95,
  "microsoft.com/research": 95,
  "arxiv.org": 90, // raw, but foundational

  // Tier 2: Premier publications (80-89)
  "nature.com": 95,
  "technologyreview.com": 88,
  "spectrum.ieee.org": 85,
  "proceedings.neurips.cc": 95,
  "proceedings.mlr.press": 93,

  // Tier 3: Quality tech press (70-79)
  "theverge.com": 75,
  "arstechnica.com": 78,
  "wired.com": 75,
  "techcrunch.com": 72,
  "venturebeat.com": 70,

  // Tier 4: Community/curated (60-69)
  "huggingface.co": 80, // curated papers are high quality
  "reddit.com/r/MachineLearning": 65,
  "news.ycombinator.com": 60,
  "github.com": 65,

  // Tier 5: Aggregated/variable (40-59)
  "towardsdatascience.com": 50,
  "reddit.com/r/ChatGPT": 40,
  "producthunt.com": 55,
};
```

### 9.2 Freshness Weighting

```typescript
function freshnessScore(publishedAt: Date): number {
  const hoursOld = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);

  if (hoursOld < 6) return 1.0;      // Breaking
  if (hoursOld < 24) return 0.9;     // Fresh
  if (hoursOld < 48) return 0.75;    // Recent
  if (hoursOld < 72) return 0.5;     // Aging
  if (hoursOld < 168) return 0.3;    // Week old
  return 0.1;                         // Stale
}
```

### 9.3 Content Quality Signals

| Signal | Weight | Source |
|--------|--------|--------|
| Source authority | 0.30 | Pre-assigned per source |
| Social engagement (normalized) | 0.20 | Points/upvotes/stars from HN/Reddit/GitHub |
| Freshness | 0.15 | Time since publication |
| Content depth (word count) | 0.10 | Longer = deeper analysis |
| Author authority | 0.10 | Known researchers/journalists |
| Cross-source mentions | 0.10 | Same story from multiple sources |
| Topic relevance | 0.05 | Keyword/embedding match to AI topics |

### 9.4 Composite Score Formula

```typescript
function computeScore(article: Article): number {
  const authority = SOURCE_AUTHORITY[article.sourceDomain] / 100;
  const freshness = freshnessScore(article.publishedAt);
  const engagement = normalizeEngagement(article.points, article.sourceType);
  const depth = Math.min(article.wordCount / 2000, 1.0);
  const authorScore = knownAuthors.has(article.author) ? 1.0 : 0.5;
  const crossRef = crossReferenceCount(article.title) > 1 ? 1.0 : 0.5;
  const relevance = computeTopicRelevance(article.title + article.summary);

  return (
    authority * 0.30 +
    engagement * 0.20 +
    freshness * 0.15 +
    depth * 0.10 +
    authorScore * 0.10 +
    crossRef * 0.10 +
    relevance * 0.05
  );
}
```

### 9.5 Signal-to-Noise Ratio by Source

| Source Type | Est. SNR | Strategy |
|-------------|----------|----------|
| AI Lab Blogs | 95% | Accept all |
| Nature/IEEE | 90% | Accept all |
| ArXiv (curated via HF) | 85% | Accept all from HF daily papers |
| ArXiv (raw feed) | 20-30% | Heavy filtering needed |
| HN (points > 50) | 70% | Good after point threshold |
| Reddit r/MachineLearning | 60% | Filter by score + flair |
| Tech press (Verge, etc.) | 50% | Filter duplicates, prioritize exclusives |
| TDS / Medium | 30% | Heavy filtering, many low-quality posts |
| Reddit r/ChatGPT | 15% | Very noisy, mostly user complaints |
| Product Hunt | 40% | Many "AI-washed" products |

---

## 10. Deduplication Strategies

### 10.1 Multi-Layer Approach

```
Layer 1: URL Normalization
  - Strip query params, tracking codes, UTM tags
  - Normalize www vs non-www
  - Detect URL redirects to canonical

Layer 2: Title Similarity
  - Normalize: lowercase, strip punctuation, remove stop words
  - Levenshtein distance threshold: < 0.15 (85% similar = duplicate)
  - Jaccard similarity on word tokens: > 0.7 = likely duplicate

Layer 3: Content Embedding Similarity
  - Generate embeddings with a small model (e.g., all-MiniLM-L6-v2)
  - Cosine similarity threshold: > 0.95 = duplicate
  - 0.85-0.95 = related/rewrite, flag for review

Layer 4: Entity Extraction
  - Extract key entities (company names, model names, person names)
  - If 3+ entities match AND publication date within 48 hours = likely duplicate
```

### 10.2 Cross-Source Deduplication

When the same story appears across multiple sources:
1. Keep the **highest authority** version as the primary
2. Store other versions as `related_sources` for citation diversity
3. Boost the composite score (cross-source validation)

### 10.3 ArXiv-Specific Deduplication

- ArXiv papers have unique IDs (e.g., `2401.12345`)
- The same paper may appear in multiple category feeds
- Deduplicate by ArXiv ID, keeping the primary category
- Track paper versions (v1, v2, etc.) - only alert on v1

---

## 11. Recommended Seed Configuration

### 11.1 Phase 1: Core Sources (Launch)

Priority sources to populate on day 1:

```typescript
const SEED_SOURCES = [
  // RSS - AI Labs (5 sources)
  { type: "rss", name: "OpenAI Blog", url: "https://openai.com/news/rss.xml", category: "lab", priority: 1 },
  { type: "rss", name: "Anthropic Engineering", url: "https://raw.githubusercontent.com/conoro/anthropic-engineering-rss-feed/main/anthropic_engineering_rss.xml", category: "lab", priority: 1 },
  { type: "rss", name: "Google DeepMind", url: "https://deepmind.google/blog/rss.xml", category: "lab", priority: 1 },
  { type: "rss", name: "Meta AI Engineering", url: "https://engineering.fb.com/feed/", category: "lab", priority: 1 },
  { type: "rss", name: "Microsoft Research", url: "https://www.microsoft.com/en-us/research/blog/feed/", category: "lab", priority: 1 },

  // RSS - News (5 sources)
  { type: "rss", name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", category: "news", priority: 1 },
  { type: "rss", name: "Ars Technica AI", url: "https://arstechnica.com/ai/feed/", category: "news", priority: 1 },
  { type: "rss", name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/", category: "news", priority: 1 },
  { type: "rss", name: "MIT Tech Review AI", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed", category: "news", priority: 1 },
  { type: "rss", name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/", category: "news", priority: 1 },

  // RSS - Newsletters (4 sources)
  { type: "rss", name: "The Batch (Andrew Ng)", url: "https://www.deeplearning.ai/the-batch/feed/", category: "newsletter", priority: 1 },
  { type: "rss", name: "Import AI", url: "https://importai.substack.com/feed", category: "newsletter", priority: 1 },
  { type: "rss", name: "Ahead of AI", url: "https://magazine.sebastianraschka.com/feed", category: "newsletter", priority: 1 },
  { type: "rss", name: "Last Week in AI", url: "https://lastweekin.ai/feed", category: "newsletter", priority: 1 },

  // ArXiv (1 combined feed)
  { type: "arxiv", name: "ArXiv AI/ML/NLP/CV", url: "https://rss.arxiv.org/rss/cs.AI+cs.CL+cs.CV+cs.LG", category: "research", priority: 1 },

  // HuggingFace (1 source)
  { type: "huggingface", name: "HF Daily Papers", url: "https://huggingface.co/api/daily_papers", category: "research", priority: 1 },

  // Hacker News (1 source)
  { type: "hackernews", name: "HN AI Stories", url: "https://hn.algolia.com/api/v1/search_by_date?query=AI+OR+LLM+OR+%22machine+learning%22&tags=story&numericFilters=points>20&hitsPerPage=50", category: "community", priority: 1 },

  // GitHub (tracked repos)
  { type: "github", name: "GitHub AI Releases", url: "https://api.github.com/search/repositories?q=topic:machine-learning+stars:>100+pushed:>{yesterday}", category: "code", priority: 1 },

  // Reddit (2 subreddits)
  { type: "reddit", name: "r/MachineLearning", url: "https://www.reddit.com/r/MachineLearning/top/.rss?t=day", category: "community", priority: 1 },
  { type: "reddit", name: "r/LocalLLaMA", url: "https://www.reddit.com/r/LocalLLaMA/hot/.rss", category: "community", priority: 1 },

  // Product Hunt (1 source)
  { type: "producthunt", name: "PH AI Products", url: "https://api.producthunt.com/v2/api/graphql", category: "products", priority: 2 },
];
```

### 11.2 Phase 2: Expansion Sources

Add after launch once pipeline is stable:

```typescript
const EXPANSION_SOURCES = [
  // More RSS feeds
  { type: "rss", name: "Wired AI", url: "https://www.wired.com/feed/tag/ai/latest/rss", category: "news", priority: 2 },
  { type: "rss", name: "IEEE Spectrum AI", url: "https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss", category: "news", priority: 2 },
  { type: "rss", name: "NVIDIA AI Blog", url: "https://blogs.nvidia.com/feed/", category: "lab", priority: 2 },
  { type: "rss", name: "AWS ML Blog", url: "https://aws.amazon.com/blogs/machine-learning/feed/", category: "lab", priority: 2 },
  { type: "rss", name: "Google AI Blog", url: "https://blog.google/technology/ai/rss/", category: "lab", priority: 2 },
  { type: "rss", name: "The Gradient", url: "https://thegradientpub.substack.com/feed", category: "newsletter", priority: 2 },
  { type: "rss", name: "Interconnects", url: "https://www.interconnects.ai/feed", category: "newsletter", priority: 2 },
  { type: "rss", name: "fast.ai", url: "https://www.fast.ai/atom.xml", category: "research", priority: 2 },
  { type: "rss", name: "BAIR Blog", url: "https://bair.berkeley.edu/blog/feed.xml", category: "research", priority: 2 },
  { type: "rss", name: "Lil'Log", url: "https://lilianweng.github.io/index.xml", category: "research", priority: 2 },
  { type: "rss", name: "Nature Machine Intelligence", url: "https://www.nature.com/natmachintell.rss", category: "research", priority: 2 },

  // More Reddit
  { type: "reddit", name: "r/artificial", url: "https://www.reddit.com/r/artificial/top/.rss?t=day", category: "community", priority: 2 },
  { type: "reddit", name: "r/deeplearning", url: "https://www.reddit.com/r/deeplearning/top/.rss?t=day", category: "community", priority: 2 },

  // ArXiv secondary
  { type: "arxiv", name: "ArXiv Stats/IR/Robotics", url: "https://rss.arxiv.org/rss/stat.ML+cs.IR+cs.RO", category: "research", priority: 2 },

  // GitHub releases (individual repos)
  { type: "github", name: "Transformers Releases", url: "https://github.com/huggingface/transformers/releases.atom", category: "code", priority: 2 },
  { type: "github", name: "Ollama Releases", url: "https://github.com/ollama/ollama/releases.atom", category: "code", priority: 2 },
  { type: "github", name: "LangChain Releases", url: "https://github.com/langchain-ai/langchain/releases.atom", category: "code", priority: 2 },
  { type: "github", name: "vLLM Releases", url: "https://github.com/vllm-project/vllm/releases.atom", category: "code", priority: 2 },
  { type: "github", name: "llama.cpp Releases", url: "https://github.com/ggerganov/llama.cpp/releases.atom", category: "code", priority: 2 },
];
```

### 11.3 Phase 3: YouTube & Premium Sources

```typescript
const PREMIUM_SOURCES = [
  // YouTube channels (new fetcher needed)
  { type: "youtube", name: "Two Minute Papers", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg", category: "video", priority: 3 },
  { type: "youtube", name: "Yannic Kilcher", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCZHmQk67mSJgfCCTn7xBfew", category: "video", priority: 3 },
  { type: "youtube", name: "AI Explained", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCNJ1Ymd5yFuUPtn21xtRbbw", category: "video", priority: 3 },
  { type: "youtube", name: "Andrej Karpathy", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCXUPKJO5MZQN11PqgIvyuvQ", category: "video", priority: 3 },

  // Semantic Scholar (for quality enrichment)
  { type: "semanticscholar", name: "SS Citation Data", url: "https://api.semanticscholar.org/graph/v1", category: "enrichment", priority: 3 },

  // Conference proceedings (seasonal)
  { type: "conference", name: "NeurIPS Proceedings", url: "https://proceedings.neurips.cc/", category: "research", priority: 3 },
  { type: "conference", name: "ICML Proceedings", url: "https://proceedings.mlr.press/", category: "research", priority: 3 },
];
```

### 11.4 Fetch Schedule Summary

| Source Type | Fetch Interval | Daily API Calls (est.) | Cost |
|-------------|---------------|----------------------|------|
| RSS Feeds (~20) | Every 30 min | ~960 | Free |
| ArXiv RSS (2) | Every 24 hours | ~2 | Free |
| HuggingFace API (5 queries) | Every 6-12 hours | ~15 | Free |
| Hacker News Algolia (15 queries) | Every 30 min | ~720 | Free |
| GitHub Search API | Every 2 hours | ~12 | Free |
| GitHub Release Feeds (~15) | Every 6 hours | ~60 | Free |
| Reddit RSS (~5) | Every 60 min | ~120 | Free |
| Product Hunt GraphQL | Every 24 hours | ~1 | Free |
| YouTube RSS (~4) | Every 6 hours | ~16 | Free |
| **Total** | | **~1,906/day** | **Free** |

All sources in the recommended configuration operate within free-tier API limits.

---

## Appendix A: Key GitHub Repositories for Reference

- **awesome-AI-feeds:** `https://github.com/RSS-Renaissance/awesome-AI-feeds` - Curated OPML of AI feeds
- **awesome-AI-news-feeds:** `https://github.com/RSS-Renaissance/awesome-AI-news-feeds` - News-specific feeds
- **allainews_sources:** `https://github.com/foorilla/allainews_sources` - 100+ AI/ML news sources
- **awesome_ML_AI_RSS_feed:** `https://github.com/vishalshar/awesome_ML_AI_RSS_feed` - ML/AI/RL RSS feeds
- **flexible-arxiv-rss:** `https://github.com/cschreib/flexible-arxiv-rss` - Custom ArXiv RSS tool
- **papers-with-code-rss:** `https://github.com/capjamesg/papers-with-code-rss` - PWC RSS feeds
- **CPR-RSS:** `https://github.com/CPR-RSS/CPR-RSS.github.io` - Conference paper RSS

## Appendix B: Useful External APIs

| API | Base URL | Auth | Rate Limit | Free |
|-----|----------|------|-----------|------|
| Semantic Scholar | `https://api.semanticscholar.org/graph/v1` | API key (free) | 1-10 req/sec | Yes |
| ArXiv Search | `http://export.arxiv.org/api/query` | None | 1 req/3 sec | Yes |
| HN Algolia | `https://hn.algolia.com/api/v1` | None | ~10k/hour | Yes |
| HuggingFace Hub | `https://huggingface.co/api` | Token (optional) | ~100/hour unauth | Yes |
| GitHub Search | `https://api.github.com/search` | Token (recommended) | 30 search/min | Yes |
| Reddit | `https://oauth.reddit.com` | OAuth required | 100 req/min | Yes (non-commercial) |
| Product Hunt | `https://api.producthunt.com/v2/api/graphql` | OAuth required | ~450/15 min | Yes |
