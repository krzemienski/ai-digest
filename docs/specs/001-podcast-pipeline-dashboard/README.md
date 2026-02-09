# Specification: 001-podcast-pipeline-dashboard

## Status

| Field | Value |
|-------|-------|
| **Created** | 2026-02-08 |
| **Current Phase** | All Specs Complete, Ready for Implementation |
| **Last Updated** | 2026-02-08 |

## Documents

| Document | Status | Notes |
|----------|--------|-------|
| product-requirements.md | completed | 7 Must-Have, 2 Should-Have, 2 Could-Have features; 3 validation deliverables |
| solution-design.md | completed | 7 ADRs pending user confirmation; SSE + Redis pub/sub architecture; 8 new API endpoints; 2 new DB tables |
| implementation-plan.md | completed | 8 phases, 30 tasks; bottom-up: DB → Worker → API → UI → Validation |

**Status values**: `pending` | `in_progress` | `completed` | `skipped`

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-08 | POC spec (mobile Expo) paused at Task 8.3 | User requires full web platform validation + pipeline dashboard before any more Expo work |
| 2026-02-08 | New spec for Podcast Pipeline Dashboard | User needs complete visibility into AI generation prompts, voice config, pipeline stages |
| 2026-02-08 | Research phase before PRD | Comprehensive codebase analysis needed to understand existing pipeline architecture |
| 2026-02-08 | Full Dashboard scope selected | User chose Full Dashboard over MVP or Validation-Only |
| 2026-02-08 | PRD completed | 11 features defined across MoSCoW; 5 parallel research agents informed requirements |
| 2026-02-08 | SDD completed | SSE + Redis pub/sub for real-time logs; 4 research agents informed architecture; 7 ADRs defined |
| 2026-02-08 | All 7 ADRs confirmed | SSE, Redis pub/sub, DB log persistence, config via job data, replace page, custom UI, model registry |
| 2026-02-08 | Implementation plan completed | 8 phases, 30 tasks with TDD structure; 3 validation deliverables as final gate |

## Context

User requires a **Podcast Pipeline Transparency Dashboard** that provides:
1. Full visibility into every stage of the podcast generation pipeline
2. Control over AI prompts, voice selection, model choice, style/tone
3. Real-time streaming logs of all API calls (cURL commands, responses)
4. Job history with replay capability
5. Professional UI/UX implementation

**Critical constraint**: No mocking. All implementations must use real ElevenLabs API, real Anthropic API, real data. Validation requires 3 complete podcast generations with distinct configurations and full evidence capture.

**Prerequisite**: Complete validation of existing web platform (admin dashboard, API endpoints, pipeline) before starting new development.

---
*This file is managed by the specification-management skill.*
