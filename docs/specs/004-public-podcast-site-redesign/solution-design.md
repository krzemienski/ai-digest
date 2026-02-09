# Solution Design Document: Public Podcast Site Redesign

**Spec ID**: 004-public-podcast-site-redesign
**Created**: 2026-02-09
**Status**: Draft

---

## 1. Architecture Overview

### Strategy: Presentation Layer Redesign

The existing podcast infrastructure is complete — audio store, player components, database queries, and API routes all work. This redesign focuses exclusively on the **presentation layer**: new pages, new design tokens, and new layout components. No backend changes required.

### Architecture Pattern: Next.js Route Group Separation

```
apps/web/src/app/
├── (public)/              ← NEW: Public-facing routes (no auth required)
│   ├── layout.tsx         ← Public layout (different header/footer)
│   ├── page.tsx           ← Landing page (hero + recent episodes + CTA)
│   └── podcasts/
│       ├── page.tsx       ← Episode listing (grid + featured)
│       └── [id]/
│           └── page.tsx   ← Episode detail (player + transcript + share)
├── (auth)/                ← Existing: Auth routes
│   ├── login/
│   └── register/
├── (app)/                 ← MOVE existing authenticated routes here
│   ├── layout.tsx         ← Authenticated layout (sidebar, admin nav)
│   ├── digests/
│   ├── search/
│   └── archive/
├── admin/                 ← Existing: Admin routes (unchanged)
└── api/                   ← Existing: API routes (unchanged)
```

### Key Decision: Route Group Architecture

**ADR-1: Use `(public)` route group for public-facing pages**
- Rationale: Separates public and authenticated layouts cleanly
- The root `layout.tsx` remains minimal (html/body/fonts)
- `(public)/layout.tsx` uses new design (black bg, RGB accents, public header)
- `(app)/layout.tsx` uses existing design (zinc palette, authenticated header)
- Trade-off: Requires moving existing pages into `(app)` group

**ADR-2: Redirect `/podcasts` to `(public)/podcasts`**
- Rationale: Podcast pages should always be public
- The existing `/podcasts/page.tsx` and `/podcasts/[id]/page.tsx` move into `(public)`
- Links from authenticated pages (`(app)`) still work — Next.js resolves route groups transparently

**ADR-3: Root page becomes public landing page**
- Rationale: Currently redirects to `/digests` — should be the public showcase
- `(public)/page.tsx` replaces the redirect
- Authenticated users can still navigate to `/digests` via header nav

---

## 2. Design Token System

### New Color Palette

```typescript
// tailwind.config.ts additions
{
  colors: {
    // Keep existing tokens for (app) layout
    bg: "#09090B",
    surface: "#18181B",
    // ...

    // New public site tokens
    "pub-bg": "#000000",
    "pub-surface": "#0A0A0A",
    "pub-surface-elevated": "#111111",
    "pub-border": "#1A1A1A",
    "pub-text": "#FAFAFA",
    "pub-text-secondary": "#888888",
    "pub-text-muted": "#555555",
    "pub-red": "#EF4444",
    "pub-red-hover": "#F87171",
    "pub-blue": "#3B82F6",
    "pub-blue-hover": "#60A5FA",
    "pub-green": "#22C55E",
    "pub-green-hover": "#4ADE80",
  }
}
```

### Typography Scale

| Element | Size | Weight | Tracking |
|---------|------|--------|----------|
| Hero title | 3xl-5xl (responsive) | Bold | Tight |
| Section heading | 2xl | Bold | Normal |
| Episode card title | base-lg | Semibold | Normal |
| Body text | sm-base | Normal | Normal |
| Badge/label | xs | Medium | Wider |
| Timestamp/mono | xs-sm | Normal (mono) | Normal |

---

## 3. Component Architecture

### New Components

```
apps/web/src/components/
├── public/                      ← NEW: Public-site-specific components
│   ├── public-header.tsx        ← Minimal header (logo, Episodes, About, Subscribe, Login)
│   ├── public-footer.tsx        ← Flat footer (logo, links, copyright)
│   ├── hero-player.tsx          ← Landing page hero with embedded player
│   ├── episode-grid.tsx         ← Responsive episode card grid
│   ├── episode-grid-card.tsx    ← Redesigned episode card for grid
│   ├── featured-episode.tsx     ← Full-width featured episode card
│   ├── subscribe-cta.tsx        ← Email signup form section
│   ├── waveform-visual.tsx      ← Animated waveform bars (decorative)
│   ├── share-buttons.tsx        ← Copy link + Twitter/X share
│   └── more-episodes.tsx        ← "More Episodes" section for detail page
├── podcast/                     ← EXISTING: Reused as-is
│   ├── podcast-player.tsx       ← Full player (reused in detail page)
│   ├── mini-player.tsx          ← Persistent bottom bar (reused globally)
│   ├── player-controls.tsx      ← Play/pause/skip controls
│   ├── progress-bar.tsx         ← Seekable progress bar
│   ├── speed-selector.tsx       ← Playback speed options
│   ├── transcript-view.tsx      ← Synchronized transcript
│   ├── transcript-search.tsx    ← Search input
│   └── episode-player-loader.tsx ← Store loader wrapper
```

### Component Specifications

#### `hero-player.tsx`
- **Purpose**: Landing page hero section with latest episode + inline player
- **Data**: Latest episode from `getEpisodes(db, { limit: 1 })` (server component passes to client)
- **Behavior**: Click play → loads episode into audio store → mini player activates
- **Layout**: Two-column on desktop (text left, waveform right), stacked on mobile
- **Props**: `episode: Episode` (the latest ready episode)

#### `episode-grid-card.tsx`
- **Purpose**: Redesigned episode card for the public grid layout
- **Differs from existing `episode-card.tsx`**: Vertical layout (not horizontal), no status badge (public only shows ready), visual play button
- **Props**: Same episode shape as existing card
- **Style**: Flat dark card, title + date + duration + play icon

#### `featured-episode.tsx`
- **Purpose**: Full-width card for the top of the episodes listing page
- **Features**: "LATEST" red badge, larger title, description line, prominent play button
- **Props**: `episode: Episode & { description?: string }`

#### `subscribe-cta.tsx`
- **Purpose**: Email signup form
- **Behavior**: POST to `/api/newsletter/subscribe` (existing endpoint if available, or new)
- **States**: Default → Loading → Success ("Check your inbox!") → Error
- **Layout**: Centered text + email input + button + social proof line

#### `share-buttons.tsx`
- **Purpose**: Copy link + share to Twitter/X
- **Behavior**:
  - Copy: `navigator.clipboard.writeText(url)` → show "Copied!" tooltip
  - Twitter: Opens `https://twitter.com/intent/tweet?url=...&text=...`
- **Props**: `url: string, title: string`

#### `waveform-visual.tsx`
- **Purpose**: Decorative animated waveform (not tied to audio playback)
- **Behavior**: Subtle CSS animation of vertical bar heights
- **Style**: Thin bars (2px wide), accent-colored (red/blue gradient), varying heights

---

## 4. Page Architecture

### 4.1 Landing Page: `(public)/page.tsx`

**Server Component** — fetches latest episodes, passes to client sub-components.

```
┌─────────────────────────────────────────┐
│ PublicHeader                            │
├─────────────────────────────────────────┤
│ Hero Section                            │
│ ┌───────────────┬─────────────────────┐ │
│ │ Latest title  │ Waveform visual     │ │
│ │ Date + dur    │                     │ │
│ │ [▶ Play]      │                     │ │
│ └───────────────┴─────────────────────┘ │
├─────────────────────────────────────────┤
│ Recent Episodes (3-col grid)            │
│ ┌─────┐ ┌─────┐ ┌─────┐               │
│ │ EP  │ │ EP  │ │ EP  │               │
│ └─────┘ └─────┘ └─────┘               │
│ ┌─────┐ ┌─────┐ ┌─────┐               │
│ │ EP  │ │ EP  │ │ EP  │               │
│ └─────┘ └─────┘ └─────┘               │
├─────────────────────────────────────────┤
│ Subscribe CTA                           │
│ "AI news you can listen to. Weekly."    │
│ [email input] [Subscribe]               │
├─────────────────────────────────────────┤
│ PublicFooter                            │
└─────────────────────────────────────────┘
```

**Data fetching**:
```typescript
const episodes = await queries.getEpisodes(db, { limit: 7 });
const [latest, ...recent] = episodes;
```

### 4.2 Episodes Listing: `(public)/podcasts/page.tsx`

**Server Component** with optional client pagination.

```
┌─────────────────────────────────────────┐
│ PublicHeader (Episodes active)          │
├─────────────────────────────────────────┤
│ "All Episodes" + count                  │
├─────────────────────────────────────────┤
│ Featured Episode (full-width card)      │
│ [LATEST] Title, desc, date, [▶ Play]   │
├─────────────────────────────────────────┤
│ Episode Grid (3 columns)               │
│ ┌─────┐ ┌─────┐ ┌─────┐               │
│ │ EP  │ │ EP  │ │ EP  │               │
│ └─────┘ └─────┘ └─────┘               │
│ ... (paginated)                         │
├─────────────────────────────────────────┤
│ [Load More] or pagination              │
├─────────────────────────────────────────┤
│ Subscribe Banner                        │
├─────────────────────────────────────────┤
│ PublicFooter                            │
└─────────────────────────────────────────┘
```

**Data fetching**: Use existing `GET /api/episodes` for client-side pagination, or `getEpisodes` for SSR first page.

### 4.3 Episode Detail: `(public)/podcasts/[id]/page.tsx`

**Server Component** wrapping client player.

```
┌─────────────────────────────────────────┐
│ PublicHeader                            │
├─────────────────────────────────────────┤
│ ← All Episodes                          │
│ Episode Title (large)                   │
│ Date + Duration + Badges + Share        │
├─────────────────────────────────────────┤
│ Player Section (centered, max-w-3xl)    │
│ ┌─────────────────────────────────────┐ │
│ │ Waveform Visualization             │ │
│ │ ──────●────────────────── 12:34    │ │
│ │      ⏪  ▶  ⏩                     │ │
│ │   0.5x  1x  1.25x  1.5x  2x      │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Transcript Section                      │
│ [🔍 Search transcript...]              │
│ Host A: "Welcome to AI Digest..."      │
│ Host B: "Today we're covering..."      │
│ ...                                     │
├─────────────────────────────────────────┤
│ More Episodes (3-card row)              │
├─────────────────────────────────────────┤
│ Subscribe CTA                           │
├─────────────────────────────────────────┤
│ PublicFooter                            │
└─────────────────────────────────────────┘
```

**Data fetching**: `getEpisodeWithTranscript(db, id)` (existing query) + `getEpisodes(db, { limit: 4 })` for more episodes.

### 4.4 Public Layout: `(public)/layout.tsx`

```typescript
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-pub-bg text-pub-text">
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
      <MiniPlayer />  {/* Reuse existing mini player */}
    </div>
  );
}
```

---

## 5. Data Flow

### Existing API Routes (No Changes)

| Route | Purpose | Used By |
|-------|---------|---------|
| `GET /api/episodes` | Public paginated episode list | Episode listing page |
| `GET /api/episodes/[id]` | Episode + transcript | Episode detail page |

### New Data Needs

| Need | Solution |
|------|----------|
| Latest ready episode | `getEpisodes(db, { limit: 1 })` filtered by status="ready" |
| Episode description | Use first 200 chars of `transcript.fullText` or title |
| Episode count | Add `getEpisodeCount(db)` query (simple `SELECT count(*)`) |
| Recent episodes (6-8) | `getEpisodes(db, { limit: 8 })` |

### New Query: `getReadyEpisodes`

```typescript
// packages/db/src/queries/episodes.ts
export async function getReadyEpisodes(
  db: DB,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 20, offset = 0 } = options;
  return db
    .select()
    .from(episodes)
    .where(eq(episodes.status, "ready"))
    .orderBy(desc(episodes.createdAt))
    .limit(limit)
    .offset(offset);
}
```

This filters out pending/generating/failed episodes from the public view.

---

## 6. SEO & Metadata

### Dynamic Metadata per Page

```typescript
// (public)/podcasts/[id]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const episode = await queries.getEpisodeById(db, id);
  return {
    title: `${episode.title} | AI Digest Podcast`,
    description: episode.title,  // or transcript excerpt
    openGraph: {
      title: episode.title,
      description: `Listen to ${episode.title} — AI Digest Podcast`,
      type: "music.song",  // closest OG type for audio
      url: `https://ai-digest-ivory.vercel.app/podcasts/${id}`,
    },
    twitter: {
      card: "summary_large_image",
      title: episode.title,
    },
  };
}
```

### Static Metadata for Index Pages

```typescript
// (public)/page.tsx
export const metadata: Metadata = {
  title: "AI Digest — AI News You Can Listen To",
  description: "Weekly AI-curated podcast covering the latest in artificial intelligence. Listen free.",
};
```

---

## 7. Migration Strategy

### Step 1: Add Design Tokens
- Extend `tailwind.config.ts` with `pub-*` color tokens
- No changes to existing tokens (backward compatible)

### Step 2: Create Public Components
- Build all `components/public/*` components
- No modification to existing `components/podcast/*`

### Step 3: Create Public Routes
- Add `(public)` route group with layout, landing, episodes, detail
- Keep existing `/podcasts` routes as-is initially (redirects or dual-serve)

### Step 4: Move Authenticated Routes (optional, can defer)
- Move `/digests`, `/search`, `/archive` into `(app)` route group
- Update root `page.tsx` from redirect to `(public)/page.tsx`

### Step 5: Update Root Layout
- Remove `<Header />` and `<Footer />` from root layout (moved to route group layouts)
- Keep `<MiniPlayer />` in root layout (global)

---

## 8. Quality Requirements

| Requirement | Target | Validation |
|-------------|--------|------------|
| Lighthouse Performance | >90 | Lighthouse audit |
| Lighthouse Accessibility | >95 | Lighthouse audit |
| First Contentful Paint | <1.5s | Web Vitals |
| Time to Interactive | <3s | Web Vitals |
| Mobile responsive | All breakpoints | Manual testing |
| Audio playback | Works without auth | Manual testing |
| SEO metadata | Present on all pages | View source / OG debugger |

---

## 9. File Manifest

| File | Action | Description |
|------|--------|-------------|
| `tailwind.config.ts` | MODIFY | Add pub-* color tokens |
| `(public)/layout.tsx` | CREATE | Public layout with PublicHeader/Footer |
| `(public)/page.tsx` | CREATE | Landing page |
| `(public)/podcasts/page.tsx` | CREATE | Episode listing |
| `(public)/podcasts/[id]/page.tsx` | CREATE | Episode detail |
| `components/public/public-header.tsx` | CREATE | Public header |
| `components/public/public-footer.tsx` | CREATE | Public footer |
| `components/public/hero-player.tsx` | CREATE | Hero section with player |
| `components/public/episode-grid.tsx` | CREATE | Grid layout wrapper |
| `components/public/episode-grid-card.tsx` | CREATE | Card for grid |
| `components/public/featured-episode.tsx` | CREATE | Full-width featured card |
| `components/public/subscribe-cta.tsx` | CREATE | Email signup CTA |
| `components/public/waveform-visual.tsx` | CREATE | Decorative waveform |
| `components/public/share-buttons.tsx` | CREATE | Share link/Twitter |
| `components/public/more-episodes.tsx` | CREATE | More episodes section |
| `packages/db/src/queries/episodes.ts` | MODIFY | Add getReadyEpisodes |
| `app/page.tsx` | MODIFY | Change from redirect to public landing |
| `app/layout.tsx` | MODIFY | Remove Header/Footer (moved to groups) |
