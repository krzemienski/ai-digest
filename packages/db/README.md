# @ai-digest/db

Database layer with Drizzle ORM schema, queries, and PostgreSQL client.

## Overview

The db package provides the complete data persistence layer for AI Digest, including schema definitions, type-safe query builders, migrations, and encryption utilities. Built on Drizzle ORM for maximum type safety and performance.

## Installation

This package is part of the ai-digest monorepo. It's automatically available to other workspace packages.

## Exports

### Database Client

| Export | Description |
|--------|-------------|
| `db` | Configured Drizzle database client |
| `Database` | Database client type |

### Schema

All Drizzle table definitions:

| Table | Description |
|-------|-------------|
| `sources` | Content source configurations |
| `normalizedItems` | Standardized items from all sources |
| `digests` | Compiled digest records |
| `digestItems` | Items included in digests |
| `episodes` | Podcast episode metadata |
| `transcripts` | Episode transcript segments |
| `subscribers` | Newsletter subscribers |
| `pipelineRuns` | Pipeline execution logs |
| `pipelineStages` | Stage-level execution metrics |
| `config` | Global configuration |
| `users` | Admin users |
| `sourceFetchLog` | Source fetch history |
| `podcastLogs` | Podcast generation logs |
| `podcastConfigs` | Podcast configuration presets |
| `discoveryRuns` | Source discovery execution logs |

### Queries

Type-safe query builders exported via `queries` namespace:

| Module | Description |
|--------|-------------|
| `queries.items` | Item CRUD operations |
| `queries.subscribers` | Subscriber management |
| `queries.episodes` | Episode queries |
| `queries.search` | Full-text search |
| `queries.podcastConfigs` | Config management |
| `queries.podcastLogs` | Log queries |
| `queries.pipeline` | Pipeline tracking |
| `queries.sources` | Source CRUD |
| `queries.normalizedItems` | Normalized item queries |
| `queries.digests` | Digest queries |
| `queries.discovery` | Discovery queries |
| `queries.config` | Global config |

### Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `encryptApiKey` | Encrypt API key for storage | `(key: string) => string` |
| `decryptApiKey` | Decrypt stored API key | `(encrypted: string) => string` |

### Operators

Drizzle operator helpers for complex queries (exported from `drizzle-operators.ts`).

## Architecture

```
src/
├── schema/              # Drizzle table definitions
│   ├── sources.ts
│   ├── normalized-items.ts
│   ├── digests.ts
│   ├── episodes.ts
│   ├── subscribers.ts
│   ├── pipeline.ts
│   ├── config.ts
│   ├── users.ts
│   ├── source-fetch-log.ts
│   ├── podcast-logs.ts
│   ├── podcast-configs.ts
│   ├── discovery-runs.ts
│   └── index.ts
├── queries/             # Type-safe query builders
│   ├── items.ts
│   ├── subscribers.ts
│   ├── episodes.ts
│   ├── search.ts
│   ├── podcast-configs.ts
│   ├── podcast-logs.ts
│   ├── pipeline.ts
│   ├── sources.ts
│   ├── normalized-items.ts
│   ├── digests.ts
│   ├── discovery.ts
│   ├── config.ts
│   └── index.ts
├── client.ts            # Database connection
├── crypto.ts            # Encryption utilities
├── drizzle-operators.ts # Query helpers
├── seed.ts              # Database seeding
└── index.ts             # Public API
```

**Design Patterns:**
- Repository pattern (queries as modules)
- Type-safe schema with Drizzle
- Centralized connection management
- Encrypted sensitive data (API keys)

## Dependencies

| Package | Purpose |
|---------|---------|
| `drizzle-orm` | Type-safe ORM |
| `postgres` | PostgreSQL client |
| `@ai-digest/shared` | Shared types |

## Development

```bash
# Type checking
pnpm check-types

# Generate migrations (requires drizzle.config.ts in parent)
pnpm drizzle-kit generate

# Run migrations
pnpm drizzle-kit migrate
```

## Configuration

Database connection is configured via environment variable:
- `DATABASE_URL` - PostgreSQL connection string (required)
- `ENCRYPTION_KEY` - 32-byte hex key for API key encryption (required)
