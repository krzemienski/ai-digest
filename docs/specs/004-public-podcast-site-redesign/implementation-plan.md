# Implementation Plan: Public Podcast Site Redesign

**Spec ID**: 004-public-podcast-site-redesign
**Created**: 2026-02-09

---

## Context Priming

Before starting any phase, read:
- `docs/specs/004-public-podcast-site-redesign/product-requirements.md`
- `docs/specs/004-public-podcast-site-redesign/solution-design.md`
- `apps/web/tailwind.config.ts` (existing design tokens)
- `apps/web/src/app/layout.tsx` (current root layout)
- `apps/web/src/components/podcast/` (all existing player components)
- `apps/web/src/stores/audio-store.ts` (audio state management)

---

## Phase 1: Design Foundation

Extend the design token system and create the public layout shell.

- [ ] **T1.1 Add public design tokens to Tailwind config** `[activity: frontend]`

  **Prime**: Read `tailwind.config.ts` and `globals.css`

  **Implement**: Add `pub-*` color tokens to `tailwind.config.ts`:
  - `pub-bg: #000000`, `pub-surface: #0A0A0A`, `pub-surface-elevated: #111111`
  - `pub-border: #1A1A1A`, `pub-text: #FAFAFA`, `pub-text-secondary: #888888`
  - `pub-red: #EF4444`, `pub-blue: #3B82F6`, `pub-green: #22C55E`
  - Plus hover variants for each accent

  **Validate**: `pnpm check-types` passes, existing pages unaffected

- [ ] **T1.2 Create PublicHeader component** `[activity: frontend]`

  **Prime**: Read `components/layout/header.tsx` for existing pattern

  **Implement**: `components/public/public-header.tsx`
  - "AI DIGEST" logo (bold white, tracking-wider)
  - Nav links: Episodes (`/podcasts`), About (scroll anchor), Subscribe (scroll anchor)
  - Login button (blue accent)
  - Mobile: hamburger menu
  - Sticky, flat black bg, no blur/glass

  **Validate**: Renders correctly at all breakpoints

- [ ] **T1.3 Create PublicFooter component** `[activity: frontend]`

  **Implement**: `components/public/public-footer.tsx`
  - "AI DIGEST" in gray
  - Links: RSS, Twitter/X, GitHub
  - Copyright line
  - Flat, minimal, no decoration

- [ ] **T1.4 Create public route group and layout** `[activity: frontend]`

  **Implement**: `app/(public)/layout.tsx`
  - `bg-pub-bg text-pub-text` classes
  - Renders `<PublicHeader />`, `<main>{children}</main>`, `<PublicFooter />`, `<MiniPlayer />`
  - Placeholder `(public)/page.tsx` returning "Coming soon" to verify layout works

  **Validate**: Navigate to `/` shows public layout shell with correct black bg and header/footer

---

## Phase 2: Shared Public Components

Build the reusable components for the public pages.

- [ ] **T2.1 Create WaveformVisual component** `[activity: frontend]`

  **Implement**: `components/public/waveform-visual.tsx`
  - Decorative waveform with ~40 thin vertical bars
  - CSS animation: subtle height oscillation
  - Color: accent gradient (pub-red to pub-blue)
  - Props: `className?: string`

- [ ] **T2.2 Create EpisodeGridCard component** `[activity: frontend]`

  **Prime**: Read `components/podcast/episode-card.tsx` for data shape

  **Implement**: `components/public/episode-grid-card.tsx`
  - Vertical card layout on `pub-surface` background
  - Episode title (white, semibold)
  - Date (gray) + duration badge (green text)
  - Small play button (red accent)
  - Click card → navigates to `/podcasts/{id}`
  - Click play → loads into audio store
  - Hover: 1px `pub-border` appears

- [ ] **T2.3 Create EpisodeGrid component** `[activity: frontend]`

  **Implement**: `components/public/episode-grid.tsx`
  - Responsive grid: 1 col (mobile), 2 cols (tablet), 3 cols (desktop)
  - Maps episodes to `EpisodeGridCard`
  - Props: `episodes: Episode[]`

- [ ] **T2.4 Create FeaturedEpisode component** `[activity: frontend]`

  **Implement**: `components/public/featured-episode.tsx`
  - Full-width card with "LATEST" red badge
  - Large title, date, duration, description line
  - Prominent play button (red circle)
  - Optional thin red left border accent

- [ ] **T2.5 Create SubscribeCTA component** `[activity: frontend]`

  **Implement**: `components/public/subscribe-cta.tsx`
  - Heading: "AI news you can listen to. Weekly."
  - Email input (dark surface) + Subscribe button (red bg)
  - Below: "Join 1,000+ listeners" social proof
  - Client component with form state management
  - POST to `/api/newsletter/subscribe` (or just visual for now)

- [ ] **T2.6 Create ShareButtons component** `[activity: frontend]`

  **Implement**: `components/public/share-buttons.tsx`
  - Copy link button (clipboard API + "Copied!" state)
  - Share on Twitter/X button (intent URL)
  - Props: `url: string, title: string`

- [ ] **T2.7 Create MoreEpisodes component** `[activity: frontend]`

  **Implement**: `components/public/more-episodes.tsx`
  - "More Episodes" heading
  - Horizontal row of 3 `EpisodeGridCard`s
  - "View All →" link to `/podcasts`
  - Props: `episodes: Episode[]`

---

## Phase 3: Database & Data Layer

- [ ] **T3.1 Add getReadyEpisodes query** `[activity: backend]`

  **Prime**: Read `packages/db/src/queries/episodes.ts`

  **Implement**: Add `getReadyEpisodes(db, { limit, offset })` that filters `status = "ready"` and orders by `createdAt DESC`

  **Validate**: Export from `packages/db/src/queries/index.ts`, `pnpm check-types` passes

---

## Phase 4: Landing Page

- [ ] **T4.1 Build HeroPlayer component** `[activity: frontend]`

  **Implement**: `components/public/hero-player.tsx`
  - Client component (needs audio store interaction)
  - Props: `episode: Episode`
  - Left column: "LATEST EPISODE" red label, title, date, duration badge, play button
  - Right column: `WaveformVisual`
  - Play button: loads episode into audio store on click
  - Responsive: stacked on mobile, side-by-side on desktop

- [ ] **T4.2 Build landing page** `[activity: frontend]`

  **Prime**: Read SDD section 4.1

  **Implement**: `app/(public)/page.tsx`
  - Server component, fetches episodes with `getReadyEpisodes(db, { limit: 7 })`
  - Sections: `HeroPlayer` (latest) → `EpisodeGrid` (6 recent) → `SubscribeCTA`
  - SEO metadata: `title: "AI Digest — AI News You Can Listen To"`

  **Validate**: Navigate to `/`, see hero with latest episode, play audio, grid below

---

## Phase 5: Episode Pages

- [ ] **T5.1 Build episode listing page** `[activity: frontend]`

  **Implement**: `app/(public)/podcasts/page.tsx`
  - Server component for initial load
  - "All Episodes" heading with count
  - `FeaturedEpisode` at top (latest)
  - `EpisodeGrid` below (remaining episodes)
  - Pagination: "Load More" button fetching from `/api/episodes`

  **Validate**: All ready episodes displayed, pagination works

- [ ] **T5.2 Build episode detail page** `[activity: frontend]`

  **Implement**: `app/(public)/podcasts/[id]/page.tsx`
  - Server component wrapper, fetches `getEpisodeWithTranscript`
  - "← All Episodes" back link
  - Episode metadata (title, date, duration, badges)
  - `ShareButtons` component
  - `EpisodePlayerLoader` (existing component, reused)
  - `MoreEpisodes` section (3 other episodes)
  - `SubscribeCTA` at bottom
  - Dynamic SEO metadata via `generateMetadata`

  **Validate**: Full player works, transcript displays, share buttons work

---

## Phase 6: Root Layout Restructure

- [ ] **T6.1 Update root layout** `[activity: frontend]`

  **Prime**: Read current `app/layout.tsx`

  **Implement**:
  - Remove `<Header />` and `<Footer />` from root layout
  - Keep `<MiniPlayer />` in root layout (global)
  - Keep font classes and html/body structure
  - Root layout becomes minimal shell

- [ ] **T6.2 Update root page.tsx** `[activity: frontend]`

  **Implement**:
  - Remove `redirect("/digests")` from `app/page.tsx`
  - The `(public)/page.tsx` now handles `/` route
  - Delete the old `app/page.tsx` redirect

- [ ] **T6.3 Create authenticated app layout** `[activity: frontend]`

  **Implement**: `app/(app)/layout.tsx`
  - Uses existing `<Header />` and `<Footer />`
  - Uses existing zinc color palette (bg, surface, etc.)
  - Move `/digests`, `/search`, `/archive` pages into `(app)` group

- [ ] **T6.4 Verify existing pages still work** `[activity: frontend]`

  **Validate**:
  - `/digests` → shows digests with authenticated header
  - `/podcasts` → shows public episode listing
  - `/podcasts/[id]` → shows public detail page
  - `/admin` → admin dashboard unchanged
  - `/login`, `/register` → auth pages unchanged
  - Mini player works across all route groups

---

## Phase 7: SEO & Polish

- [ ] **T7.1 Add SEO metadata to all public pages** `[activity: frontend]`

  **Implement**:
  - Landing page: static metadata
  - Episodes listing: static metadata
  - Episode detail: dynamic `generateMetadata` with OG tags
  - JSON-LD structured data for podcast episodes

- [ ] **T7.2 Responsive polish** `[activity: frontend]`

  **Validate**:
  - All pages at 375px (mobile), 768px (tablet), 1280px (desktop)
  - Touch targets ≥ 44px
  - Text readable at all sizes
  - Grid columns adjust correctly

---

## Phase 8: Functional Validation

- [ ] **T8.1 Build and deploy to Vercel** `[activity: devops]`

  **Validate**:
  - `pnpm check-types` passes
  - `vercel deploy --prod` succeeds
  - No build errors

- [ ] **T8.2 End-to-end validation** `[activity: validation]`

  **Validate**:
  - Visit landing page → see featured episode
  - Click play → audio plays (no auth required)
  - Browse episodes → grid displays all ready episodes
  - Click episode → detail page with player + transcript
  - Share buttons → copy link works, Twitter opens
  - Subscribe CTA → form renders (visual validation)
  - Mini player → persists across navigation
  - Mobile → all pages responsive
  - `/digests` → authenticated experience preserved
  - `/admin` → admin functionality unchanged

---

## Summary

| Phase | Tasks | Dependencies |
|-------|-------|--------------|
| 1. Design Foundation | 4 | None |
| 2. Shared Components | 7 | Phase 1 |
| 3. Data Layer | 1 | None (parallel with 1-2) |
| 4. Landing Page | 2 | Phases 1, 2, 3 |
| 5. Episode Pages | 2 | Phases 1, 2, 3 |
| 6. Root Layout | 4 | Phases 4, 5 |
| 7. SEO & Polish | 2 | Phase 6 |
| 8. Validation | 2 | Phase 7 |

**Total: 24 tasks across 8 phases**

Phases 4 and 5 can run in parallel after phases 1-3 complete.
Phase 3 can run in parallel with phases 1-2.
