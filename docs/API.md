# AI Digest API Documentation

Complete reference for all API endpoints in the AI Digest platform.

## Table of Contents

- [Authentication](#authentication)
- [Public Endpoints](#public-endpoints)
  - [Auth](#auth)
  - [Digests](#digests)
  - [Episodes](#episodes)
  - [Search](#search)
  - [Subscriptions](#subscriptions)
- [Admin Endpoints](#admin-endpoints)
  - [Dashboard](#admin-dashboard)
  - [Pipeline](#admin-pipeline)
  - [Podcast](#admin-podcast)
  - [Sources](#admin-sources)
  - [Subscribers](#admin-subscribers)
  - [Config](#admin-config)
  - [Newsletter](#admin-newsletter)

---

## Authentication

The API supports two authentication methods:

### 1. Supabase Auth (Browser Sessions)
Used for public user routes (`/api/auth/*`) and admin dashboard access.
- Cookies are set automatically after login
- Session managed by Supabase
- Admin users must have `app_metadata.role = "admin"`

### 2. Admin API Key (Programmatic Access)
Used for all admin routes (`/api/admin/*`).

**Header:**
```
x-admin-api-key: 52e88e11a5e8f0a01117043ae44212d906106bba7f3283e4
```

**Environment Variable:**
```bash
ADMIN_API_KEY=52e88e11a5e8f0a01117043ae44212d906106bba7f3283e4
```

---

## Public Endpoints

### Auth

#### `POST /api/auth/login`

Authenticate user with email and password.

**Auth:** None

**Request:**
```json
{
  "email": "string (email format, required)",
  "password": "string (required)",
  "rememberMe": "boolean (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "string (user UUID)",
    "email": "string",
    "role": "string (user|admin)"
  }
}
```

**Errors:**
- `400` - Validation failed (invalid email format, missing fields)
- `401` - Invalid email or password
- `500` - Internal server error

---

#### `POST /api/auth/logout`

Sign out the current user.

**Auth:** Supabase session

**Request:** Empty body

**Response (200):**
```json
{
  "success": true
}
```

**Errors:**
- `500` - Internal server error

---

#### `GET /api/auth/me`

Get current authenticated user info.

**Auth:** Supabase session (required)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "string (UUID)",
    "email": "string",
    "role": "string (user|admin)"
  }
}
```

**Errors:**
- `401` - Authentication required
- `500` - Internal server error

---

#### `POST /api/auth/register`

Register a new user account.

**Auth:** None

**Request:**
```json
{
  "email": "string (email format, required)",
  "password": "string (min 8 chars, 1 letter, 1 number, required)",
  "confirmPassword": "string (must match password, required)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "string (user UUID)",
    "email": "string",
    "role": "string (user|admin)"
  }
}
```

**Errors:**
- `400` - Validation failed (weak password, mismatched passwords, invalid email)
- `409` - Email already registered
- `500` - Failed to create user

---

### Digests

#### `GET /api/digests`

Get paginated list of digests.

**Auth:** None

**Query Parameters:**
- `page` - Page number (default: 1, min: 1)
- `limit` - Items per page (default: 10, min: 1, max: 50)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string (UUID)",
      "digestDate": "string (ISO date)",
      "synthesis": "string",
      "createdAt": "string (ISO datetime)"
    }
  ],
  "meta": {
    "page": "number",
    "limit": "number",
    "total": "number"
  }
}
```

**Cache:** Public, max-age=300 (5 minutes)

**Errors:**
- `500` - Internal server error

---

#### `GET /api/digests/latest`

Get the most recent digest.

**Auth:** None

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "string (UUID)",
    "digestDate": "string (ISO date)",
    "synthesis": "string",
    "createdAt": "string (ISO datetime)"
  }
}
```

**Cache:** Public, max-age=300 (5 minutes)

**Errors:**
- `404` - No digests found
- `500` - Internal server error

---

#### `GET /api/digests/[id]`

Get a specific digest with all items.

**Auth:** None

**Rate Limit:** 60 requests per 60 seconds per IP

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "string (UUID)",
    "digestDate": "string (ISO date)",
    "synthesis": "string",
    "createdAt": "string (ISO datetime)",
    "items": [
      {
        "id": "string (UUID)",
        "title": "string",
        "summary": "string",
        "source": "string",
        "sourceUrl": "string",
        "importance": "number",
        "publishedAt": "string (ISO datetime)"
      }
    ]
  }
}
```

**Cache:** Public, max-age=300 (5 minutes)

**Errors:**
- `404` - Digest not found
- `429` - Rate limit exceeded
- `500` - Internal server error

---

### Episodes

#### `GET /api/episodes`

Get paginated list of podcast episodes.

**Auth:** None

**Query Parameters:**
- `page` - Page number (default: 1, min: 1)
- `limit` - Items per page (default: 10, min: 1, max: 50)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string (UUID)",
      "digestId": "string (UUID) | null",
      "title": "string",
      "status": "string (generating|ready|failed)",
      "audioUrl": "string | null",
      "durationSeconds": "number | null",
      "createdAt": "string (ISO datetime)"
    }
  ],
  "meta": {
    "page": "number",
    "limit": "number",
    "total": "number"
  }
}
```

**Cache:** Public, max-age=300 (5 minutes)

**Errors:**
- `500` - Internal server error

---

#### `GET /api/episodes/[id]`

Get a specific episode with transcript.

**Auth:** None

**Rate Limit:** 60 requests per 60 seconds per IP

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "string (UUID)",
    "digestId": "string (UUID) | null",
    "title": "string",
    "status": "string (generating|ready|failed)",
    "audioUrl": "string | null",
    "durationSeconds": "number | null",
    "targetDurationMinutes": "number",
    "createdAt": "string (ISO datetime)",
    "transcript": {
      "id": "string (UUID)",
      "episodeId": "string (UUID)",
      "segments": "array - structured transcript data",
      "createdAt": "string (ISO datetime)"
    } | null
  }
}
```

**Cache:** Public, max-age=300 (5 minutes)

**Errors:**
- `404` - Episode not found
- `429` - Rate limit exceeded
- `500` - Internal server error

---

### Search

#### `GET /api/search`

Full-text search across digest items.

**Auth:** None

**Rate Limit:** 60 requests per 60 seconds per IP

**Query Parameters:**
- `q` - Search query (required, min 1 character)
- `source` - Filter by source type (optional)
- `range` - Date range filter (optional, valid: "24h", "7d", "30d")

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string (UUID)",
      "title": "string",
      "summary": "string",
      "source": "string",
      "sourceUrl": "string",
      "publishedAt": "string (ISO datetime)",
      "rank": "number (search relevance score)"
    }
  ]
}
```

**Cache:** Public, max-age=60 (1 minute)

**Errors:**
- `429` - Rate limit exceeded
- `500` - Search failed

**Notes:**
- Empty query string returns empty array (no error)
- Results limited to 20 items
- Uses PostgreSQL full-text search

---

### Subscriptions

#### `POST /api/subscribe`

Subscribe to the newsletter.

**Auth:** None

**Rate Limit:** 10 requests per 60 seconds per IP

**Request:**
```json
{
  "email": "string (email format, required)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "email": "string"
  }
}
```

**Errors:**
- `400` - Invalid email address
- `409` - Email already subscribed
- `429` - Rate limit exceeded
- `500` - Subscription failed

---

#### `POST /api/unsubscribe`

Unsubscribe from the newsletter.

**Auth:** Token-based (email + unsubscribe token)

**Request:**
```json
{
  "email": "string (email format, required)",
  "token": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true
}
```

**Errors:**
- `400` - Invalid request (email and token required)
- `403` - Invalid unsubscribe token
- `500` - Unsubscribe failed

**Notes:**
- Token is generated and included in newsletter emails
- Token verified using UNSUBSCRIBE_SECRET env var

---

## Admin Endpoints

All admin endpoints require authentication via `x-admin-api-key` header or Supabase admin session.

### Admin Dashboard

#### `GET /api/admin/health`

Check service health status.

**Auth:** Admin API Key or Supabase admin session

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "service": "string (postgresql|anthropic|elevenlabs|s3|resend)",
      "status": "string (healthy|degraded|down|unconfigured)",
      "message": "string"
    }
  ]
}
```

**Errors:**
- `401` - Authentication required
- `403` - Admin access required

**Notes:**
- PostgreSQL: Tests actual connection
- Other services: Check if env vars are configured

---

#### `GET /api/admin/stats`

Get dashboard statistics.

**Auth:** Admin API Key or Supabase admin session

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalItems": "number",
    "totalDigests": "number",
    "totalEpisodes": "number (status=ready)",
    "totalSubscribers": "number (status=active)",
    "latestPipelineRun": {
      "id": "string (UUID)",
      "status": "string (running|completed|failed)",
      "startedAt": "string (ISO datetime)",
      "completedAt": "string (ISO datetime) | null",
      "itemsIngested": "number",
      "costUsd": "number"
    } | null,
    "sourceHealth": {
      "healthy": "number (consecutiveErrors = 0)",
      "degraded": "number (0 < consecutiveErrors < 3)",
      "erroring": "number (consecutiveErrors >= 3)",
      "total": "number"
    }
  }
}
```

**Errors:**
- `401` - Authentication required
- `403` - Admin access required
- `500` - Internal server error

---

### Admin Pipeline

#### `POST /api/admin/pipeline/trigger`

Trigger a full pipeline run (fetch → digest → podcast → newsletter).

**Auth:** Admin API Key or Supabase admin session

**Max Duration:** 800 seconds

**Request:**
```json
{
  "enablePodcast": "boolean (default: true, optional)",
  "enableNewsletter": "boolean (default: true, optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "started"
  }
}
```

**Errors:**
- `401` - Authentication required
- `403` - Admin access required
- `500` - Failed to trigger pipeline

**Notes:**
- Pipeline runs in background using Next.js `after()` API
- Request returns immediately
- Use `/api/admin/pipeline/status` to monitor progress

---

#### `GET /api/admin/pipeline/status`

Get current and recent pipeline run status.

**Auth:** Admin API Key or Supabase admin session

**Response (200):**
```json
{
  "success": true,
  "data": {
    "current": {
      "id": "string (UUID)",
      "status": "string (running|completed|failed)",
      "startedAt": "string (ISO datetime)",
      "completedAt": "string (ISO datetime) | null",
      "itemsIngested": "number",
      "costUsd": "number"
    } | null,
    "recent": [
      {
        "id": "string (UUID)",
        "status": "string",
        "startedAt": "string (ISO datetime)",
        "completedAt": "string (ISO datetime) | null",
        "itemsIngested": "number",
        "costUsd": "number"
      }
    ]
  }
}
```

**Errors:**
- `401` - Authentication required
- `403` - Admin access required
- `500` - Internal server error

**Notes:**
- `current` is the most recent run (may still be running)
- `recent` includes last 10 runs

---

#### `GET /api/admin/pipeline/runs`

Get pipeline run history.

**Auth:** Admin API Key or Supabase admin session

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string (UUID)",
      "status": "string (running|completed|failed)",
      "startedAt": "string (ISO datetime)",
      "completedAt": "string (ISO datetime) | null",
      "itemsIngested": "number",
      "costUsd": "number",
      "triggerType": "string (manual|scheduled)"
    }
  ]
}
```

**Errors:**
- `401` - Authentication required
- `403` - Admin access required
- `500` - Internal server error

**Notes:**
- Returns last 20 runs
- Ordered by `startedAt` descending

---

### Admin Podcast

#### `POST /api/admin/podcast/generate`

Generate a podcast episode.

**Auth:** Admin API Key or Supabase admin session

**Max Duration:** 800 seconds (13.3 minutes)

**Request:**
```json
{
  "digestId": "string (UUID, optional - provide digestId OR dateRange)",
  "dateRange": {
    "start": "string (ISO datetime, required if no digestId)",
    "end": "string (ISO datetime, required if no digestId)"
  },
  "targetDurationMinutes": "number (required, one of: 5, 10, 15, 20, 25, 30, 45, 60)",
  "model": "string (optional, model ID from registry)",
  "voiceConfig": {
    "speakers": [
      {
        "role": "string (e.g., 'host', 'analyst')",
        "voiceId": "string (ElevenLabs voice ID)",
        "settings": {
          "stability": "number (0-1)",
          "similarityBoost": "number (0-1)",
          "speed": "number (0.5-2)",
          "style": "number (0-1)"
        }
      }
    ],
    "audioFormat": "string (default: mp3_44100_128)",
    "targetDurationMinutes": "number"
  },
  "style": "string (optional)",
  "customStylePrompt": "string (max 2000 chars, optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "episodeId": "string (UUID)",
    "status": "string (ready|failed)",
    "error": "string (present if status=failed)"
  }
}
```

**Errors:**
- `400` - Invalid request (validation failed, unknown model, invalid date range)
- `401` - Authentication required
- `403` - Admin access required
- `404` - Digest not found
- `500` - Internal server error

**Notes:**
- XOR constraint: Must provide exactly one of `digestId` or `dateRange`
- If `dateRange`: `start` must be before `end`
- Generation runs synchronously within 800s limit
- Typical generation time: 5-10 minutes
- Uses tool-loop script generation for accurate duration

---

#### `GET /api/admin/podcast/status`

Get the most recent podcast episode status.

**Auth:** Admin API Key or Supabase admin session

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "string (UUID)",
    "digestId": "string (UUID) | null",
    "title": "string",
    "status": "string (generating|ready|failed)",
    "audioUrl": "string | null",
    "durationSeconds": "number | null",
    "targetDurationMinutes": "number",
    "podcastStages": {
      "content_select": "string (pending|in_progress|completed|failed)",
      "script_gen": "string",
      "quality_review": "string",
      "tts": "string",
      "assembly": "string",
      "upload": "string"
    },
    "scriptPreview": "string | null",
    "createdAt": "string (ISO datetime)"
  } | null
}
```

**Errors:**
- `401` - Authentication required
- `403` - Admin access required
- `500` - Internal server error

---

#### `GET /api/admin/podcast/history`

Get paginated podcast episode history.

**Auth:** Admin API Key or Supabase admin session

**Query Parameters:**
- `page` - Page number (default: 1, min: 1)
- `limit` - Items per page (default: 20, min: 1, max: 100)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "episodes": [
      {
        "id": "string (UUID)",
        "digestId": "string (UUID) | null",
        "title": "string",
        "status": "string (generating|ready|failed)",
        "audioUrl": "string | null",
        "durationSeconds": "number | null",
        "targetDurationMinutes": "number",
        "model": "string | null",
        "style": "string | null",
        "costUsd": "number | null",
        "createdAt": "string (ISO datetime)"
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number",
      "totalPages": "number"
    }
  }
}
```

**Errors:**
- `400` - Invalid pagination parameters
- `401` - Authentication required
- `403` - Admin access required
- `500` - Internal server error

---

#### `GET /api/admin/podcast/episode/[id]`

Get full episode details including transcript and logs.

**Auth:** Admin API Key or Supabase admin session

**Response (200):**
```json
{
  "success": true,
  "data": {
    "episode": {
      "id": "string (UUID)",
      "digestId": "string (UUID) | null",
      "title": "string",
      "status": "string (generating|ready|failed)",
      "audioUrl": "string | null",
      "durationSeconds": "number | null",
      "targetDurationMinutes": "number",
      "model": "string | null",
      "style": "string | null",
      "customStylePrompt": "string | null",
      "costUsd": "number | null",
      "costBreakdown": {
        "anthropicCost": "number",
        "elevenlabsCost": "number",
        "ttsCharacters": "number",
        "totalCost": "number"
      } | null,
      "configSnapshot": "object | null",
      "promptsUsed": "object | null",
      "qualityScores": "object | null",
      "podcastStages": "object",
      "scriptPreview": "string | null",
      "createdAt": "string (ISO datetime)"
    },
    "transcript": {
      "id": "string (UUID)",
      "episodeId": "string (UUID)",
      "segments": "array",
      "createdAt": "string (ISO datetime)"
    } | null,
    "logs": [
      {
        "id": "string (UUID)",
        "episodeId": "string (UUID)",
        "stage": "string",
        "severity": "string (info|warn|error)",
        "message": "string",
        "metadata": "object | null",
        "createdAt": "string (ISO datetime)"
      }
    ]
  }
}
```

**Errors:**
- `401` - Authentication required
- `403` - Admin access required
- `404` - Episode not found
- `500` - Internal server error

---

#### `GET /api/admin/podcast/voices`

List available ElevenLabs voices.

**Auth:** Admin API Key or Supabase admin session

**Response (200):**
```json
{
  "success": true,
  "data": {
    "voices": [
      {
        "voiceId": "string",
        "name": "string",
        "category": "string",
        "previewUrl": "string",
        "labels": {
          "accent": "string",
          "age": "string",
          "gender": "string",
          "use_case": "string"
        }
      }
    ],
    "cached": false
  }
}
```

**Cache:** Next.js fetch cache, revalidate every 3600 seconds (1 hour)

**Errors:**
- `401` - Authentication required
- `403` - Admin access required
- `500` - ELEVENLABS_API_KEY not configured
- `502` - ElevenLabs API error

---

#### `POST /api/admin/podcast/voice-preview`

Generate a preview audio sample for a voice.

**Auth:** Admin API Key or Supabase admin session

**Request:**
```json
{
  "voiceId": "string (required)",
  "text": "string (max 500 chars, optional)",
  "settings": {
    "stability": "number (0-1, optional)",
    "similarityBoost": "number (0-1, optional)",
    "style": "number (0-1, optional)",
    "speed": "number (0.5-2, optional)"
  }
}
```

**Response (200):**
Binary audio/mpeg response

**Errors:**
- `400` - Invalid request (validation failed)
- `401` - Authentication required
- `403` - Admin access required
- `500` - ELEVENLABS_API_KEY not configured
- `502` - ElevenLabs TTS error

**Notes:**
- Default text: "Welcome to AI Digest, your daily briefing on artificial intelligence news and breakthroughs."
- Returns MP3 audio directly (not JSON)

---

#### `POST /api/admin/podcast/cost-estimate`

Estimate cost for podcast generation.

**Auth:** Admin API Key or Supabase admin session

**Request:**
```json
{
  "model": "string (required)",
  "targetDurationMinutes": "number (required, one of: 5, 10, 15, 20, 25, 30, 45, 60)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "estimatedCost": {
      "anthropic": "number (USD)",
      "elevenlabs": "number (USD)",
      "total": "number (USD)"
    },
    "model": {
      "id": "string",
      "name": "string",
      "tier": "string (standard|premium)"
    },
    "warning": "string | undefined (present for expensive models)"
  }
}
```

**Errors:**
- `400` - Invalid request (unknown model, invalid duration)
- `401` - Authentication required
- `403` - Admin access required
- `500` - Internal server error

---

#### `GET /api/admin/podcast/item-count`

Get count of items available for podcast generation in a date range.

**Auth:** Admin API Key or Supabase admin session

**Query Parameters:**
- `start` - ISO datetime string (required)
- `end` - ISO datetime string (required)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "itemCount": "number",
    "sourceCount": "number (enabled sources)",
    "dateRange": {
      "start": "string (ISO datetime)",
      "end": "string (ISO datetime)"
    }
  }
}
```

**Errors:**
- `400` - Invalid parameters (invalid dates, start >= end)
- `401` - Authentication required
- `403` - Admin access required
- `500` - Internal server error

---

#### `GET /api/admin/podcast/spend`

Get current month's podcast generation spend.

**Auth:** Admin API Key or Supabase admin session

**Response (200):**
```json
{
  "success": true,
  "data": {
    "currentMonth": {
      "total": "number (USD)",
      "count": "number (episode count)",
      "year": "number",
      "month": "number (1-12)"
    },
    "threshold": 50
  }
}
```

**Errors:**
- `401` - Authentication required
- `403` - Admin access required
- `500` - Internal server error

**Notes:**
- Threshold is hardcoded to $50/month
- Used for spend alerts in admin UI

---

#### `GET /api/admin/podcast/stream`

Server-sent events stream for podcast generation logs.

**Auth:** Admin API Key or Supabase admin session

**Max Duration:** 800 seconds

**Query Parameters:**
- `episodeId` - UUID (required)

**Response:** Server-Sent Events (text/event-stream)

**Event Types:**

1. **log** - Generation log entry
```
event: log
data: {"type":"log","id":"uuid","episodeId":"uuid","stage":"string","severity":"info|warn|error","message":"string","metadata":{},"createdAt":"ISO datetime"}
```

2. **backfill_complete** - Initial backfill done
```
event: backfill_complete
data: {"count":5}
```

3. **complete** - Episode generation finished
```
event: complete
data: {"status":"ready|failed"}
```

4. **error** - Stream error
```
event: error
data: {"error":"string"}
```

5. **heartbeat** - Keep-alive (every 15 seconds)
```
: heartbeat
```

**Errors:**
- `400` - episodeId required
- `401` - Authentication required
- `403` - Admin access required

**Notes:**
- Connection auto-closes when episode status becomes `ready` or `failed`
- Polls database every 2 seconds for new logs
- Backfills existing logs on connect

---

### Admin Sources

#### `GET /api/admin/sources`

List all content sources.

**Auth:** Admin API Key or Supabase admin session

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string (UUID)",
      "type": "string (rss|github|arxiv|hackernews|huggingface|reddit|producthunt)",
      "name": "string",
      "config": {
        "url": "string (for RSS)",
        "repo": "string (for GitHub)",
        "query": "string (for ArXiv)",
        "subreddit": "string (for Reddit)"
      },
      "enabled": "boolean",
      "consecutiveErrors": "number",
      "lastFetchedAt": "string (ISO datetime) | null",
      "createdAt": "string (ISO datetime)"
    }
  ]
}
```

**Errors:**
- `401` - Authentication required
- `403` - Admin access required
- `500` - Internal server error

---

#### `POST /api/admin/sources`

Create a new content source.

**Auth:** Admin API Key or Supabase admin session

**Request:**
```json
{
  "type": "string (required)",
  "name": "string (required)",
  "config": {
    "url": "string (type-specific config)"
  },
  "enabled": "boolean (default: true, optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "string (UUID)",
    "type": "string",
    "name": "string",
    "config": "object",
    "enabled": "boolean",
    "consecutiveErrors": 0,
    "lastFetchedAt": null,
    "createdAt": "string (ISO datetime)"
  }
}
```

**Errors:**
- `400` - Invalid source data
- `401` - Authentication required
- `403` - Admin access required
- `500` - Internal server error

---

#### `PUT /api/admin/sources/[id]`

Update an existing source.

**Auth:** Admin API Key or Supabase admin session

**Request:**
```json
{
  "type": "string (optional)",
  "name": "string (optional)",
  "config": "object (optional)",
  "enabled": "boolean (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "string (UUID)",
    "type": "string",
    "name": "string",
    "config": "object",
    "enabled": "boolean",
    "consecutiveErrors": "number",
    "lastFetchedAt": "string (ISO datetime) | null",
    "createdAt": "string (ISO datetime)"
  }
}
```

**Errors:**
- `400` - Invalid source data
- `401` - Authentication required
- `403` - Admin access required
- `500` - Internal server error

---

#### `DELETE /api/admin/sources/[id]`

Delete a source.

**Auth:** Admin API Key or Supabase admin session

**Response (200):**
```json
{
  "success": true
}
```

**Errors:**
- `401` - Authentication required
- `403` - Admin access required
- `500` - Internal server error

---

#### `POST /api/admin/sources/validate`

Validate an RSS feed URL.

**Auth:** Admin API Key or Supabase admin session

**Request:**
```json
{
  "url": "string (URL format, required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "type": "string (rss|atom)",
    "title": "string",
    "description": "string",
    "recentItems": ["string (item titles, max 3)"]
  }
}
```

**Errors:**
- `400` - Invalid URL or not a valid RSS/Atom feed
- `401` - Authentication required
- `403` - Admin access required
- `500` - Fetch timeout or connection error

**Notes:**
- 10 second timeout
- Simple XML validation (checks for RSS/Atom markers)
- Extracts feed title, description, and 3 most recent items

---

#### `POST /api/admin/sources/bulk`

Bulk import sources.

**Auth:** Admin API Key or Supabase admin session

**Request:**
```json
[
  {
    "name": "string (required)",
    "type": "string (required)",
    "config": "object (required)",
    "enabled": "boolean (default: true, optional)"
  }
]
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "added": "number",
    "skipped": "number",
    "errors": ["string (error messages)"]
  }
}
```

**Errors:**
- `400` - Invalid source data (at least one source required)
- `401` - Authentication required
- `403` - Admin access required
- `500` - Internal server error

**Notes:**
- Skips duplicates by default
- Returns partial success (some added, some skipped)

---

#### `GET /api/admin/sources/export`

Export all sources as JSON file.

**Auth:** Admin API Key or Supabase admin session

**Response (200):**
JSON download with `Content-Disposition: attachment` header

```json
[
  {
    "name": "string",
    "type": "string",
    "config": "object",
    "enabled": "boolean"
  }
]
```

**Errors:**
- `401` - Authentication required
- `403` - Admin access required
- `500` - Internal server error

**Notes:**
- Filename format: `sources-export-YYYY-MM-DD.json`
- Does not include `id`, `createdAt`, or `consecutiveErrors`

---

#### `POST /api/admin/sources/discover`

Start a source discovery run.

**Auth:** Admin API Key or Supabase admin session

**Max Duration:** 300 seconds

**Request:**
```json
{
  "topics": ["string (optional)"],
  "sourceTypes": ["string (optional)"],
  "maxSources": "number (1-50, optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "runId": "string (UUID)",
    "status": "pending"
  }
}
```

**Errors:**
- `400` - Invalid request
- `401` - Authentication required
- `403` - Admin access required
- `500` - Internal server error

**Notes:**
- Discovery runs in background
- Use GET `/api/admin/sources/discover?runId=uuid` to check status

---

#### `GET /api/admin/sources/discover`

Get discovery run status or list recent runs.

**Auth:** Admin API Key or Supabase admin session

**Query Parameters:**
- `runId` - UUID (optional, if provided returns single run)

**Response (200) - Single Run:**
```json
{
  "success": true,
  "data": {
    "id": "string (UUID)",
    "status": "string (pending|running|completed|failed)",
    "topics": ["string"],
    "sourceTypes": ["string"],
    "maxSources": "number",
    "candidates": [
      {
        "name": "string",
        "type": "string",
        "config": "object",
        "score": "number",
        "reason": "string"
      }
    ],
    "addedSourceIds": ["string"],
    "createdAt": "string (ISO datetime)",
    "completedAt": "string (ISO datetime) | null"
  }
}
```

**Response (200) - List Runs:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string (UUID)",
      "status": "string",
      "topics": ["string"],
      "candidateCount": "number",
      "addedCount": "number",
      "createdAt": "string (ISO datetime)"
    }
  ]
}
```

**Errors:**
- `401` - Authentication required
- `403` - Admin access required
- `404` - Discovery run not found (when runId provided)
- `500` - Internal server error

---

#### `POST /api/admin/sources/discover/add`

Add discovered sources to the database.

**Auth:** Admin API Key or Supabase admin session

**Request:**
```json
{
  "runId": "string (UUID, required)",
  "candidateIndices": ["number (array of indices, required)"]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "added": "number",
    "skipped": "number (duplicates)"
  }
}
```

**Errors:**
- `400` - Invalid request (no valid indices, no candidates)
- `401` - Authentication required
- `403` - Admin access required
- `404` - Discovery run not found
- `500` - Internal server error

---

### Admin Subscribers

#### `GET /api/admin/subscribers`

List all subscribers.

**Auth:** Admin API Key or Supabase admin session

**Response (200):**
```json
{
  "success": true,
  "data": {
    "subscribers": [
      {
        "id": "string (UUID)",
        "email": "string",
        "status": "string (active|unsubscribed)",
        "createdAt": "string (ISO datetime)"
      }
    ],
    "count": "number"
  }
}
```

**Errors:**
- `401` - Authentication required
- `403` - Admin access required
- `500` - Internal server error

---

#### `DELETE /api/admin/subscribers/[id]`

Unsubscribe a user (soft delete).

**Auth:** Admin API Key or Supabase admin session

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "string (UUID)"
  }
}
```

**Errors:**
- `401` - Authentication required
- `403` - Admin access required
- `404` - Subscriber not found
- `500` - Internal server error

**Notes:**
- Sets status to "unsubscribed" (does not delete record)

---

### Admin Config

#### `GET /api/admin/config`

Get all configuration values.

**Auth:** Admin API Key or Supabase admin session

**Response (200):**
```json
{
  "success": true,
  "data": {
    "topics": "object | null",
    "scoring": "object | null",
    "synthesis": "object | null",
    "budget": "object | null",
    "schedule": "object | null",
    "podcast": "object | null"
  }
}
```

**Errors:**
- `401` - Authentication required
- `403` - Admin access required
- `500` - Internal server error

**Notes:**
- Config keys: topics, scoring, synthesis, budget, schedule, podcast
- Values are stored as JSONB in database

---

#### `PUT /api/admin/config/[key]`

Update a configuration value.

**Auth:** Admin API Key or Supabase admin session

**Request:**
Any valid JSON object

**Response (200):**
```json
{
  "success": true,
  "data": {
    "key": "string",
    "value": "object (the updated config)"
  }
}
```

**Errors:**
- `401` - Authentication required
- `403` - Admin access required
- `500` - Internal server error

**Notes:**
- Key is part of URL path
- Body is the new config value (any JSON)

---

#### `GET /api/admin/config/api-keys`

Get masked API keys.

**Auth:** Admin API Key or Supabase admin session

**Response (200):**
```json
{
  "success": true,
  "data": {
    "anthropic": "string (****...abcd) | null",
    "elevenlabs": "string (****...abcd) | null"
  }
}
```

**Errors:**
- `401` - Authentication required
- `403` - Admin access required
- `500` - Internal server error

---

#### `PUT /api/admin/config/api-keys`

Set an API key.

**Auth:** Admin API Key or Supabase admin session

**Request:**
```json
{
  "provider": "string (enum: anthropic|elevenlabs, required)",
  "key": "string (min 1 char, required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "provider": "string",
  "masked": "string (****...abcd)"
}
```

**Errors:**
- `400` - Invalid request body
- `401` - Authentication required
- `403` - Admin access required
- `500` - Internal server error

---

#### `POST /api/admin/config/api-keys/test`

Test an API key without saving it.

**Auth:** Admin API Key or Supabase admin session

**Request:**
```json
{
  "provider": "string (enum: anthropic|elevenlabs, required)",
  "key": "string (min 1 char, required)"
}
```

**Response (200):**
```json
{
  "valid": "boolean",
  "error": "string (present if valid=false)"
}
```

**Errors:**
- `400` - Invalid request body
- `401` - Authentication required
- `403` - Admin access required
- `500` - Test failed

**Notes:**
- Anthropic: Tests with minimal message request
- ElevenLabs: Tests with voice list request
- 429/5xx responses considered valid (key works, service unavailable)

---

### Admin Newsletter

#### `GET /api/admin/newsletter/[digestId]/html`

Get newsletter HTML for a digest.

**Auth:** Admin API Key or Supabase admin session

**Response (200):**
HTML document (Content-Type: text/html)

**Errors:**
- `401` - Authentication required
- `403` - Admin access required
- `404` - Digest not found
- `500` - Internal server error

**Notes:**
- Returns fully rendered HTML email
- Cyberpunk theme with flat black design
- Includes digest synthesis and all items
- Used for preview and newsletter sending

---

## Rate Limiting

Rate limits are applied per IP address:

| Endpoint | Limit |
|----------|-------|
| `/api/digests/[id]` | 60 requests / 60 seconds |
| `/api/episodes/[id]` | 60 requests / 60 seconds |
| `/api/search` | 60 requests / 60 seconds |
| `/api/subscribe` | 10 requests / 60 seconds |

Rate limit responses return:
```json
{
  "success": false,
  "error": "Too many requests"
}
```
HTTP Status: `429`

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": "string (human-readable error message)",
  "details": "object | array (optional, present for validation errors)"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation error, invalid parameters)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error (server-side error)
- `502` - Bad Gateway (external API error)

---

## Caching

Public endpoints use HTTP cache headers:

| Endpoint | Cache-Control |
|----------|---------------|
| `/api/digests` | `public, max-age=300` (5 min) |
| `/api/digests/latest` | `public, max-age=300` (5 min) |
| `/api/digests/[id]` | `public, max-age=300` (5 min) |
| `/api/episodes` | `public, max-age=300` (5 min) |
| `/api/episodes/[id]` | `public, max-age=300` (5 min) |
| `/api/search` | `public, max-age=60` (1 min) |

Admin endpoints do not use HTTP caching.

---

## Environment Variables

Required environment variables:

```bash
# Database
DATABASE_URL=postgresql://...

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Admin API Key
ADMIN_API_KEY=52e88e11a5e8f0a01117043ae44212d906106bba7f3283e4

# External Services
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=...
RESEND_API_KEY=re_...

# S3 Storage
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET=...
S3_REGION=us-east-1

# Newsletter
UNSUBSCRIBE_SECRET=...
```

---

## Client Examples

### JavaScript/TypeScript (Public)

```typescript
// Get latest digest
const response = await fetch('https://ai-digest-ivory.vercel.app/api/digests/latest');
const { data } = await response.json();
console.log(data);

// Search
const results = await fetch(
  'https://ai-digest-ivory.vercel.app/api/search?q=gpt-5&range=7d'
);
const { data: items } = await results.json();

// Subscribe
await fetch('https://ai-digest-ivory.vercel.app/api/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' }),
});
```

### cURL (Admin)

```bash
# Trigger pipeline
curl -X POST https://ai-digest-ivory.vercel.app/api/admin/pipeline/trigger \
  -H "x-admin-api-key: 52e88e11a5e8f0a01117043ae44212d906106bba7f3283e4" \
  -H "Content-Type: application/json" \
  -d '{"enablePodcast": true, "enableNewsletter": true}'

# Generate podcast
curl -X POST https://ai-digest-ivory.vercel.app/api/admin/podcast/generate \
  -H "x-admin-api-key: 52e88e11a5e8f0a01117043ae44212d906106bba7f3283e4" \
  -H "Content-Type: application/json" \
  -d '{
    "digestId": "uuid-here",
    "targetDurationMinutes": 10,
    "model": "claude-haiku-4-5"
  }'

# Get stats
curl https://ai-digest-ivory.vercel.app/api/admin/stats \
  -H "x-admin-api-key: 52e88e11a5e8f0a01117043ae44212d906106bba7f3283e4"
```

---

## Changelog

### 2026-02-09
- Initial API documentation
- 41 endpoints documented
- Authentication, rate limiting, caching details added
