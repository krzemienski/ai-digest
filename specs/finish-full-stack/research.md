---
spec: finish-full-stack
phase: research
created: 2026-02-07T20:45:00-05:00
---

# Research: finish-full-stack

## Executive Summary

The AI Digest platform has ~90+ source files across a Turborepo monorepo, with all 7 fetchers, BullMQ pipeline, ElevenLabs TTS code, Resend email code, Drizzle ORM with 10 tables, and a full Next.js web app (consumer + admin). However, **nothing functional was ever tested end-to-end**: all database content is seed data (deterministic UUIDs like `c0000000-...`), episodes have `/placeholder-episode.mp3` audio URLs (no real audio generated), no real newsletter was sent, Stitch MCP was never used for screen design, and Playwright/browser automation was never used for visual validation. The current theme uses cyberpunk naming (`cyber-*`) but colors are standard Tailwind values -- user wants flat black professional instead. ANTHROPIC_API_KEY and ELEVENLABS_API_KEY are now configured; RESEND_API_KEY and R2 credentials are not.

## 1. Current Theme Analysis

### What Exists

| Element | Current Value | Issue |
|---------|--------------|-------|
| Background | `#000000` (pure black) | Pure black causes halation; should be dark gray |
| Surface | `#0a0a0a` | Too close to pure black |
| Overlay | `#1a1a1a` | Acceptable |
| Primary accent | `#3b82f6` (blue-500) | Named `cyber-cyan` but is actually Tailwind blue |
| Secondary accent | `#e11d48` (rose-600) | Named `cyber-magenta` |
| Success | `#22c55e` (green-500) | Named `cyber-green` |
| Purple | `#7c3aed` (violet-600) | Unused accent |
| Amber | `#f59e0b` (amber-500) | Warning color |
| Text primary | `#f5f5f5` | Near-white, acceptable |
| Text secondary | `#a3a3a3` | Neutral gray, acceptable |
| Font | Inter only | No display/mono font for hierarchy |
| Box shadows | `0 1px 3px rgba(0,0,0,0.3)` | Named `neon-*` but are just subtle drop shadows |
| Effects | 4 files (glitch, neon-border, scanline, reduced-motion) | GlitchText is a no-op `<span>`; NeonBorder has invisible shadow |

### Why User Dislikes It

1. **Cyberpunk naming without cyberpunk execution** -- colors are standard Tailwind, `neon-cyan` shadow is `0 1px 3px rgba(0,0,0,0.3)` (invisible).
2. **Pure black background** -- causes halation, looks cheap.
3. **No typographic hierarchy** -- Inter only, no display/mono font for headings.
4. **Effects are placeholders** -- GlitchText = `<span>{children}</span>`, NeonBorder = invisible box-shadow.
5. **Cyberpunk naming permeates 49 files with 131 occurrences** of `cyber-*`/`neon-*` class references.

### User Wants Instead

Flat black professional -- Linear, Vercel Dashboard, Bloomberg Terminal aesthetic. No neon, no cyberpunk effects, no glow, no scanlines. Clean, sophisticated, dark.

## 2. Design Direction: Flat Black Professional

### Research Findings

Based on 2025-2026 dark UI best practices:

- **Avoid pure black (#000000)** -- causes halation, eye strain on OLED. Use dark gray. Source: [Dark Mode Best Practices 2026](https://www.designstudiouiux.com/blog/dark-mode-ui-design-best-practices/)
- **Use off-white for text** -- pure white is harsh. Use #E8E8ED or #FAFAFA. Source: [Smashing Magazine Inclusive Dark Mode](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/)
- **Elevated surfaces** increment lightness per elevation level -- creates depth without glow effects. Source: [Dark Mode SEO/UX Trends](https://designindc.com/blog/dark-mode-web-design-seo-ux-trends-for-2025/)
- **Professional dark UIs** (Linear, Vercel, Raycast) use monochromatic gray scales with a single accent color. Source: [Dark Mode UI Best Practices](https://thesyntaxdiaries.com/dark-mode-ui-design-best-practices)

### Recommended Color Palette

| Role | Hex | Usage | Contrast vs #09090B |
|------|-----|-------|---------------------|
| Background | `#09090B` | Primary bg (zinc-950) | -- |
| Surface | `#18181B` | Cards, panels (zinc-900) | -- |
| Surface elevated | `#27272A` | Modals, dropdowns (zinc-800) | -- |
| Border | `#3F3F46` | Borders, dividers (zinc-700) | -- |
| Border subtle | `#27272A` | Subtle separators (zinc-800) | -- |
| Text primary | `#FAFAFA` | Headings, body (zinc-50) | 19.3:1 PASS AAA |
| Text secondary | `#A1A1AA` | Descriptions, meta (zinc-400) | 7.1:1 PASS AAA |
| Text muted | `#71717A` | Timestamps, hints (zinc-500) | 4.6:1 PASS AA |
| Accent | `#3B82F6` | Primary actions, links (blue-500) | 4.6:1 PASS AA |
| Accent hover | `#60A5FA` | Hover state (blue-400) | 8.1:1 PASS AAA |
| Success | `#22C55E` | Positive states (green-500) | 8.2:1 PASS AAA |
| Warning | `#EAB308` | Caution states (yellow-500) | 11.7:1 PASS AAA |
| Destructive | `#EF4444` | Errors, danger (red-500) | 5.0:1 PASS AA |

### Recommended Typography

| Role | Font | Weight | Source |
|------|------|--------|--------|
| Headings | Geist Sans | 600 (semibold) | `geist` npm package or `next/font/local` |
| Body | Inter | 400-500 | `next/font/google` (already in use) |
| Mono/code | Geist Mono | 400 | For scores, timestamps, code snippets |

Rationale: Geist is Vercel's font, purpose-built for developer tools UIs. Slightly rounder than Inter, friendlier apertures, better at small sizes. Source: [Inter vs Geist comparison](https://x.com/aliszu/status/1718534441050460336), [Best UI Design Fonts 2026](https://www.designmonks.co/blog/best-fonts-for-ui-design/), [Untitled UI Best Free Fonts](https://www.untitledui.com/blog/best-free-fonts)

### Design Principles

1. **No glow/neon effects** -- remove all `shadow-neon-*`, scanline, glitch components
2. **No cyberpunk naming** -- rename `cyber-*` to semantic names (`bg`, `surface`, `border`, `text-primary`, etc.)
3. **Single accent color** -- blue-500 for actions, links, active states. No magenta/purple/cyan rainbow.
4. **Elevation via lightness** -- bg < surface < elevated. No box-shadow glow.
5. **Subtle borders** -- 1px zinc-700 borders for card/panel separation.
6. **Clean typography** -- Geist headings, Inter body, consistent weight scale.
7. **Functional animations only** -- loading spinners, page transitions. No decorative animations.

## 3. Available Tools Inventory

### Stitch MCP (VERIFIED AVAILABLE)

| Tool | Parameters |
|------|------------|
| `mcp__stitch__create_project` | `title` (optional) |
| `mcp__stitch__get_project` | `name` (required, format: `projects/{id}`) |
| `mcp__stitch__list_projects` | `filter` (optional) |
| `mcp__stitch__list_screens` | `projectId` (required) |
| `mcp__stitch__get_screen` | `projectId`, `screenId` (required) |
| `mcp__stitch__generate_screen_from_text` | `projectId`, `prompt`, `deviceType` (MOBILE/DESKTOP/TABLET/AGNOSTIC), `modelId` (GEMINI_3_PRO/GEMINI_3_FLASH) |

Generation budget: 350 Flash + 50 Pro/month. Missing `extract_design_context` tool -- must use prompt templates for consistency.

### Playwright MCP (VERIFIED AVAILABLE)

| Tool | Purpose |
|------|---------|
| `browser_navigate` | Navigate to URL |
| `browser_resize` | Set viewport width/height |
| `browser_take_screenshot` | Capture PNG/JPEG |
| `browser_snapshot` | A11y snapshot |
| `browser_run_code` | Execute Playwright code |

### Chrome DevTools MCP (VERIFIED AVAILABLE)

| Tool | Purpose |
|------|---------|
| `navigate_page` | Navigate to URL |
| `resize_page` | Set page dimensions |
| `emulate` | Viewport with device emulation, color scheme, touch |
| `take_screenshot` | Capture screenshot |

Recommendation: Use Playwright MCP as primary (simpler API), Chrome DevTools as fallback.

## 4. Environment Status

### API Keys

| Key | Status | Can Test? |
|-----|--------|-----------|
| `DATABASE_URL` | Configured | Yes |
| `REDIS_URL` | Configured | Yes |
| `ADMIN_API_KEY` | Configured (`52e88e...`) | Yes |
| `ANTHROPIC_API_KEY` | Configured (`sk-ant-api03-...`) | Yes -- pipeline AI stages |
| `ELEVENLABS_API_KEY` | Configured (`sk_d5b5...`) | Yes -- real TTS |
| `RESEND_API_KEY` | **NOT configured** | No -- cannot send emails |
| `R2_*` (all 5 vars) | **NOT configured** | No -- cannot upload audio to R2 |
| `GITHUB_TOKEN` | Not configured | GitHub works without auth (lower rate limit) |
| `PRODUCTHUNT_TOKEN` | Not configured | PH fetcher gracefully skips |
| `UPSTASH_*` | Not configured | Rate limiting uses in-memory fallback |

### What CAN Be Tested Now

- Full ingestion pipeline (7 fetchers)
- AI analysis stages (categorize, score, dedup, synthesize) via ANTHROPIC_API_KEY
- Podcast script generation via Claude
- ElevenLabs TTS audio generation
- ffmpeg audio assembly
- Web app rendering + screenshots
- Admin dashboard with auth

### What CANNOT Be Tested Without Setup

- Real email sending (needs RESEND_API_KEY -- free tier: 3K/month at [resend.com](https://resend.com/pricing))
- Audio upload to R2 (needs R2 credentials; **workaround**: save to local filesystem)

### Services Running

PostgreSQL on port 5432, Redis on port 6379, ffmpeg available via @ffmpeg-installer/ffmpeg.

## 5. Functional Pipeline Assessment

### Database State (ALL SEED DATA)

| Table | Count | Evidence |
|-------|-------|---------|
| sources | 5 | Deterministic UUIDs `a0000000-...` |
| normalized_items | 62 | IDs like `seed-item-001` + ~50 from partial test |
| digests | 3 | UUIDs `c0000000-...`, dates 2/6-2/8 |
| episodes | 2 | **audio_url = `/placeholder-episode.mp3`** (not real) |
| transcripts | 1 | Hardcoded dialogue, not from real TTS |
| subscribers | 6 | Fake: alice@example.com, bob@techcorp.io, etc. |
| pipeline_runs | 3 | UUIDs `b0000000-...`, fabricated metrics |
| config | 4 | Seeded digest/pipeline/podcast/schedule configs |

Source: `/Users/nick/Desktop/ai-digest/packages/db/src/seed.ts` -- creates all data with `onConflictDoNothing()`. **No real pipeline has ever run.**

### Steps to Run Full Pipeline

1. Start Redis (already running)
2. Start worker: `cd apps/worker && npx tsx src/index.ts`
3. Start web app: `cd apps/web && pnpm dev`
4. Trigger: `curl -X POST -H "x-api-key: $ADMIN_API_KEY" http://localhost:3000/api/admin/pipeline/trigger`
5. Monitor worker logs + `pipeline_runs`/`pipeline_stages` tables
6. Expected: ingest -> normalize -> categorize (Sonnet) -> score (Sonnet) -> dedup (Haiku) -> synthesize (Opus) -> output -> podcast (script + TTS + ffmpeg) -> newsletter (skipped without RESEND_API_KEY)

### Podcast Generation Flow

`packages/podcast/src/`:
1. `script-parser.ts` -- parses Claude JSON script into `ScriptSegment[]`
2. `tts.ts` -- `ElevenLabsClient.textToSpeech.convert()` per segment with `previous_request_ids` for continuity
3. `assembler.ts` -- fluent-ffmpeg concat filter, MP3 128kbps 44.1kHz
4. `r2-upload.ts` -- S3 SDK upload (requires R2 credentials)

**Without R2**: Save audio to `apps/web/public/episodes/` and set `audio_url` to `/episodes/{date}.mp3`. ~5-line code change.

### Newsletter Flow

`packages/email/src/`:
1. `templates/digest-email.tsx` -- React Email with inlined styles
2. `send.ts` -- Resend SDK with 3x retry, exponential backoff, List-Unsubscribe header
3. `subscribers.ts` -- Resend Contacts API wrapper

**Without RESEND_API_KEY**: Use `npx email dev` to preview templates, or log rendered HTML.

## 6. Stitch Design Workflow

### Screen List (15 screens, flat black professional)

| # | Screen | Device | Model | Priority |
|---|--------|--------|-------|----------|
| 1 | Digest Feed (home) | DESKTOP | PRO | P0 |
| 2 | Digest Feed (mobile) | MOBILE | PRO | P0 |
| 3 | Digest Detail | DESKTOP | PRO | P0 |
| 4 | Podcast Player (full) | DESKTOP | FLASH | P0 |
| 5 | Podcast Player (mobile) | MOBILE | FLASH | P0 |
| 6 | Episode Library | DESKTOP | FLASH | P0 |
| 7 | Search Results | DESKTOP | FLASH | P1 |
| 8 | Newsletter Archive | DESKTOP | FLASH | P1 |
| 9 | Subscribe Form | MOBILE | FLASH | P1 |
| 10 | Admin Dashboard | DESKTOP | FLASH | P0 |
| 11 | Admin Sources | DESKTOP | FLASH | P1 |
| 12 | Admin Pipeline Monitor | DESKTOP | FLASH | P1 |
| 13 | Admin Config | DESKTOP | FLASH | P1 |
| 14 | Admin Login | DESKTOP | FLASH | P1 |
| 15 | Email Template | AGNOSTIC | FLASH | P1 |

~30 generations with revisions = ~8% of monthly free tier.

### Prompt Template

```
[DESIGN SYSTEM]
Theme: Flat black professional. Clean, sophisticated, no decorative effects.
Background: dark charcoal (#09090B). Cards/surfaces: zinc gray (#18181B).
Borders: subtle zinc (#3F3F46), 1px solid.
Typography: Geist Sans for headings (semibold), Inter for body (regular/medium).
Accent color: blue (#3B82F6) for links, buttons, active states.
Text: near-white (#FAFAFA) primary, medium gray (#A1A1AA) secondary.
No glow, no neon, no scanlines, no gradients on backgrounds.
Spacing: 8px base grid. Corner radius: 6px cards, 8px buttons.
Style reference: Linear app, Vercel dashboard, Raycast.

[SCREEN]
Design a {specific screen description}...
```

Use PRO for first 3 screens (establish DNA), FLASH for rest.

## 7. Browser Automation Workflow

### Responsive Screenshot Protocol

For every frontend change:

1. `mcp__playwright__browser_navigate` to `http://localhost:3000/{path}`
2. Mobile: `browser_resize(375, 812)` then `browser_take_screenshot`
3. Tablet: `browser_resize(768, 1024)` then `browser_take_screenshot`
4. Desktop: `browser_resize(1440, 900)` then `browser_take_screenshot`
5. READ each screenshot to visually verify

### Pages (14 pages x 3 breakpoints = 42 screenshots)

`/digests`, `/digests/{id}`, `/podcasts`, `/podcasts/{id}`, `/search`, `/archive`, `/admin/login`, `/admin`, `/admin/sources`, `/admin/pipeline`, `/admin/config`, `/admin/podcast`, `/admin/schedule`, `/admin/subscribers`

## 8. Gap Analysis

| Requirement | Previous Execution | Remediation |
|-------------|-------------------|-------------|
| Stitch MCP design generation | Never called | Generate 15 screens with flat black design system prompt |
| Real TTS audio | Episodes have `/placeholder-episode.mp3` | Run real TTS with ELEVENLABS_API_KEY |
| Real newsletter | No email sent | Configure RESEND_API_KEY or demonstrate template rendering |
| Playwright screenshots | Never used | Use Playwright MCP for all visual validation |
| Flat black professional theme | Cyberpunk naming (49 files, 131 occurrences) | Complete theme overhaul |
| Full pipeline run | Only seed data | Run real pipeline with configured API keys |
| Evidence-based validation | Tasks marked complete without verification | Gate every task on evidence |

### Theme Overhaul Scope

49 files with 131 `cyber-*`/`neon-*` occurrences. Must update:
- `tailwind.config.ts` -- new palette, remove neon shadows/animations
- `globals.css` -- new bg/text colors
- `layout.tsx` -- add Geist font, keep Inter
- All UI components (button, card, input, badge, dialog, tooltip, progress)
- All layout components (header, footer, sidebar)
- All 14 pages
- All domain components (~40 files: digest, podcast, search, admin)
- Remove effects directory (glitch-text, neon-border, scanline)
- Email templates -- update palette

## 9. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Theme overhaul scope (49 files) | High | Systematic find-replace of `cyber-*` namespace, then per-component visual verification |
| ElevenLabs API cost | Medium | Use short test scripts (2-3 segments). Creator plan ~100 min/month. |
| Anthropic API cost | Medium | BudgetTracker caps at $5/run. Single run ~$2-3. |
| R2 not configured | Low | Save audio locally, serve from Next.js public/ |
| Resend not configured | Medium | Free tier at resend.com, or render-to-file proof |
| Stitch design consistency | Medium | Explicit design system prompt prefix for every call |
| Pipeline runtime bugs | Medium | Run stages individually first |

## 10. Quality Commands

| Type | Command | Source |
|------|---------|--------|
| Dev (web) | `cd apps/web && pnpm dev` | package.json |
| Dev (worker) | `cd apps/worker && npx tsx src/index.ts` | manual |
| Build (web) | `cd apps/web && pnpm build` | package.json |
| TypeCheck (per pkg) | `pnpm exec tsc --noEmit -p {pkg}/tsconfig.json` | convention |
| TypeCheck (all) | `pnpm run check-types` | root package.json |
| DB push | `cd packages/db && npx drizzle-kit push` | drizzle-kit |
| Lint | Not configured | -- |
| E2E | Not configured (use Playwright MCP) | -- |

**Local CI**: `pnpm run check-types && cd apps/web && pnpm build`

## 11. Related Specs

| Spec | Relevance | mayNeedUpdate | Notes |
|------|-----------|---------------|-------|
| `poc` | **HIGH** | Yes | Stitch workflow mechanics valid; theme direction overridden (cyberpunk -> flat black) |
| `full-platform` | **HIGH** | Yes | Architecture/DB/API design still valid; theme + functional testing gaps being addressed |

## 12. Recommendations for Requirements

1. **Theme overhaul as Phase 0** -- rename color system from `cyber-*` to semantic names, update all 49 files, remove effects directory. Must happen before Stitch generation so prompts match code.

2. **Stitch before implementation** -- generate 15 screens using flat black professional prompt. Use PRO for first 3, FLASH for rest. Designs are visual reference only.

3. **Run real pipeline immediately** -- ANTHROPIC_API_KEY and ELEVENLABS_API_KEY are configured. Trigger real end-to-end run to produce actual digest + podcast audio.

4. **Local audio serving** -- modify podcast processor to save MP3 to `apps/web/public/episodes/` since R2 is not configured. ~5-line change.

5. **Resend API key** -- user should create free account at resend.com (3K emails/month). Without it, newsletter cannot be sent. Alternative: render email HTML to file.

6. **Playwright screenshots for every task** -- enforce 3-breakpoint protocol. 14 pages x 3 breakpoints = 42 screenshots minimum.

7. **Clean seed data** -- truncate tables before real pipeline run. Seed data (deterministic UUIDs, placeholder audio) creates false completeness.

8. **Evidence gating** -- no task complete without: (a) screenshots for frontend, (b) curl/psql for backend, (c) logs for pipeline.

9. **Email template update** -- change from `#000000` background to `#09090B`, update accents to match professional palette.

10. **Remove dead effects** -- delete glitch-text.tsx, scanline.tsx, neon-border.tsx. Keep reduced-motion.tsx hook.

11. **Font upgrade** -- install `geist` npm package for Geist Sans + Geist Mono headings/code. Keep Inter for body.

## Open Questions

1. **Resend API key**: Will user provide RESEND_API_KEY? Needed for real newsletter sending. (Recommendation: free tier at resend.com)
2. **R2 credentials**: Will R2 be configured, or is local audio serving acceptable? (Recommendation: local is fine)
3. **Seed data**: Clear before real pipeline run? (Recommendation: yes)
4. **ElevenLabs voices**: Seed config uses Sarah (`EXAVITQu4vr4xnSDxMaL`) and Charlie (`onwK4e9ZLuTAKqWW03F9`). Acceptable? (Recommendation: use defaults)
5. **Email from domain**: Resend requires verified domain. Does user have one? (Can use Resend test domain initially)

## Sources

### External
- [Dark Mode Best Practices 2026](https://www.designstudiouiux.com/blog/dark-mode-ui-design-best-practices/)
- [Smashing Magazine: Inclusive Dark Mode](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/)
- [Dark Mode SEO/UX Trends 2025](https://designindc.com/blog/dark-mode-web-design-seo-ux-trends-for-2025/)
- [Dark Mode UI Best Practices](https://thesyntaxdiaries.com/dark-mode-ui-design-best-practices)
- [Inter vs Geist Font Comparison](https://x.com/aliszu/status/1718534441050460336)
- [Best UI Design Fonts 2026](https://www.designmonks.co/blog/best-fonts-for-ui-design/)
- [Untitled UI: Best Free Fonts 2026](https://www.untitledui.com/blog/best-free-fonts)
- [Resend Pricing](https://resend.com/pricing)
- [React Email + Resend Integration](https://react.email/docs/integrations/resend)
- [Figma Web Design Trends 2026](https://www.figma.com/resource-library/web-design-trends/)
- [Minimalist Web Design Trends 2026](https://www.digitalsilk.com/digital-trends/minimalist-web-design-trends/)

### Internal (Codebase Files Examined)
- `/Users/nick/Desktop/ai-digest/apps/web/tailwind.config.ts` -- cyberpunk color tokens
- `/Users/nick/Desktop/ai-digest/apps/web/src/app/globals.css` -- pure black bg
- `/Users/nick/Desktop/ai-digest/apps/web/src/app/layout.tsx` -- Inter font, cyber-bg
- `/Users/nick/Desktop/ai-digest/apps/web/src/components/effects/*.tsx` -- placeholder effects
- `/Users/nick/Desktop/ai-digest/apps/web/src/components/layout/header.tsx` -- cyber-* classes
- `/Users/nick/Desktop/ai-digest/packages/podcast/src/tts.ts` -- ElevenLabs TTS
- `/Users/nick/Desktop/ai-digest/packages/podcast/src/assembler.ts` -- ffmpeg assembly
- `/Users/nick/Desktop/ai-digest/packages/podcast/src/r2-upload.ts` -- R2 upload
- `/Users/nick/Desktop/ai-digest/packages/email/src/send.ts` -- Resend wrapper
- `/Users/nick/Desktop/ai-digest/packages/email/src/templates/digest-email.tsx` -- email template
- `/Users/nick/Desktop/ai-digest/packages/db/src/seed.ts` -- all seed data
- `/Users/nick/Desktop/ai-digest/.env.local` -- configured API keys
- `/Users/nick/Desktop/ai-digest/.env.example` -- required env vars
- `/Users/nick/Desktop/ai-digest/specs/poc/research.md` -- Stitch MCP capabilities
- `/Users/nick/Desktop/ai-digest/specs/full-platform/design.md` -- architecture
- `/Users/nick/Desktop/ai-digest/specs/full-platform/tasks.md` -- original 98 tasks
- `/Users/nick/Desktop/ai-digest/specs/full-platform/.progress.md` -- execution history + learnings
