# Specification: 003-podcast-duration-accuracy

## Status

| Field | Value |
|-------|-------|
| **Created** | 2026-02-09 |
| **Current Phase** | SDD |
| **Last Updated** | 2026-02-09 |

## Documents

| Document | Status | Notes |
|----------|--------|-------|
| product-requirements.md | skipped | Requirements clear from user description + research |
| solution-design.md | in_progress | Combined SDD with implementation details |
| implementation-plan.md | pending | |

**Status values**: `pending` | `in_progress` | `completed` | `skipped`

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-09 | PRD skipped | Requirements self-evident: podcasts must hit target duration, Agent SDK replaced with Client SDK tool loop, user-facing generation |
| 2026-02-09 | Combined SDD + deep research | 3 parallel research agents already gathered comprehensive technical findings |

## Context

Podcasts targeting 30 minutes produce only 12-19 minutes. Root cause: classic mode lacks character-count guidance, and the Agent SDK (which works) is disabled on Vercel because it spawns a CLI subprocess. Solution: replace Agent SDK with Anthropic Client SDK `toolRunner()` — same agentic loop, pure HTTP, Vercel-compatible, 35-85x cheaper.

---
*This file is managed by the specification-management skill.*
