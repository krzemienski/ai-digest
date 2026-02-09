# Specification: 002-podcast-sources-timewindow

## Status

| Field | Value |
|-------|-------|
| **Created** | 2026-02-08 |
| **Current Phase** | Ready for Implementation |
| **Last Updated** | 2026-02-08 |

## Documents

| Document | Status | Notes |
|----------|--------|-------|
| product-requirements.md | completed | 4 Must Have, 2 Should Have, 2 Could Have features |
| solution-design.md | completed | 5 ADRs pending user confirmation, full architecture |
| implementation-plan.md | completed | 6 phases, 28 tasks, functional validation throughout |

**Status values**: `pending` | `in_progress` | `completed` | `skipped`

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-08 | Start with PRD | Complex feature set needs full requirements before design |
| 2026-02-08 | Functional validation only | Project constitution mandates Playwright + cURL, no mocks |
| 2026-02-08 | Time window per-generation with saved default | User wants both per-request flexibility and preferences |
| 2026-02-08 | Discovered sources enabled by default | After admin approval in discovery UI, no extra toggle step |
| 2026-02-08 | SDD complete | Full architecture designed with 5 ADRs for user confirmation |
| 2026-02-08 | Time window queries normalized_items directly | Bypass digest_items join — simpler, more performant |
| 2026-02-08 | API keys in config table with AES-256-GCM | Reuse existing key-value store, avoid over-engineering |
| 2026-02-08 | Discovery agent as BullMQ job | Same pattern as podcast gen, prevents HTTP timeouts |
| 2026-02-08 | Implementation plan complete | 6 phases, 28 tasks with functional validation |

## Context

Enhance AI Digest podcast pipeline with:
1. **Configurable time window** - Users choose daily (1 day), weekly (7 days), or custom range of news to include in podcast generation
2. **50+ default sources** - Ship with high-quality AI/ML/tech sources across RSS, Reddit, GitHub, ArXiv, HN, HuggingFace, ProductHunt
3. **AI-powered source discovery** - "Run AI" button triggers agent-based deep research to find and suggest new sources based on user preferences
4. **Self-service API keys** - Open source users supply their own Anthropic + ElevenLabs keys
5. **Full UI integration** - All features accessible through admin dashboard
6. **Functional validation** - cURL-first backend testing, then UI verification with screenshots

---
*This file is managed by the specification-management skill.*
