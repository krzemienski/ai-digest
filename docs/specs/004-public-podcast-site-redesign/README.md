# Specification: 004-public-podcast-site-redesign

## Status

| Field | Value |
|-------|-------|
| **Created** | 2026-02-09 |
| **Current Phase** | Ready for Implementation |
| **Last Updated** | 2026-02-09 |

## Documents

| Document | Status | Notes |
|----------|--------|-------|
| product-requirements.md | completed | Public podcast site with flat black design |
| solution-design.md | completed | Route group architecture, 15 new components |
| implementation-plan.md | completed | 24 tasks across 8 phases |

**Status values**: `pending` | `in_progress` | `completed` | `skipped`

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-09 | Start with PRD | Need to define public site scope and UX requirements |
| 2026-02-09 | Use Stitch MCP for design screens | User explicitly requested Stitch-based design |
| 2026-02-09 | Flat black design with RGB accents | User specified: "extremely flat black design and highlights of reds and blues and greens" |

## Context

The user wants to create a public-facing podcast site where visitors can:
- Browse all previous podcast episodes
- See the latest episode prominently featured ("latest episode dropped")
- Play audio publicly without authentication
- Be motivated to sign up via call-to-action elements
- Experience a redesigned UI with flat black background and red/blue/green accent highlights

Current state:
- `/podcasts` page exists but is minimal (list of EpisodeCards)
- `/podcasts/[id]` has a player with transcript support
- Home page is just a redirect to `/digests`
- No public landing page exists
- Auth uses Supabase via `(auth)` route group

---
*This file is managed by the specification-management skill.*
