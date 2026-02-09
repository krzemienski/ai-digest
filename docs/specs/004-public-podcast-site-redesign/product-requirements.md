# Product Requirements Document: Public Podcast Site Redesign

**Spec ID**: 004-public-podcast-site-redesign
**Created**: 2026-02-09
**Status**: Draft

---

## 1. Problem Statement

AI Digest generates high-quality AI news podcasts (5-45 minutes, tool-loop scripted with 94-103% duration accuracy), but there's no public-facing experience. The home page redirects to `/digests` (authenticated), the podcast listing is a minimal card list, and there's no way for unauthenticated visitors to discover, listen to, or subscribe to the show. This means zero organic reach, no SEO footprint, and no conversion funnel from listener to subscriber.

### Evidence
- Home page (`/`) immediately redirects to `/digests` — no landing experience
- `/podcasts` page shows a plain list of EpisodeCards with no hierarchy, no featured content
- No way to listen without navigating to `/podcasts/[id]`
- No signup CTA anywhere in the podcast flow
- No RSS feed for podcast distribution (Apple Podcasts, Spotify, etc.)

---

## 2. Target Users

### Persona 1: The Casual Discoverer
- Finds the site via search, social media link, or word of mouth
- Wants to quickly understand what AI Digest is
- Needs to hear a sample immediately (minimal friction)
- May convert to subscriber if impressed

### Persona 2: The Returning Listener
- Already knows the show, comes back weekly
- Wants the latest episode front and center
- May browse older episodes by topic or date
- Values quick playback start (one tap/click)

### Persona 3: The Podcast App User
- Subscribes via Apple Podcasts, Spotify, or RSS reader
- Needs a standards-compliant RSS feed
- May visit the site for transcripts, show notes, or sharing

---

## 3. User Journeys

### Journey 1: First Visit Discovery
1. Visitor lands on the home page
2. Sees a bold hero section with the latest episode prominently featured
3. Presses play — audio starts immediately (no auth required)
4. Scrolls down to see a curated grid of recent episodes
5. Sees a CTA: "Get AI Digest delivered to your inbox" with email signup
6. Optionally browses the full episode archive

### Journey 2: Returning Listener
1. Navigates to the site (bookmarked or direct URL)
2. Latest episode is immediately visible with "NEW" indicator
3. Presses play, picks up where they left off (if returning within session)
4. Mini player persists as they browse other episodes or pages

### Journey 3: Deep Link from Share
1. Receives a link to a specific episode (e.g., `/podcasts/{id}`)
2. Lands on a rich episode detail page with cover art, transcript, duration
3. Can play immediately
4. Sees "More Episodes" section below
5. Sees CTA to subscribe

---

## 4. Requirements

### Must Have (P0)

#### R1: Public Landing Page
- The root URL (`/`) shows a public podcast landing page (NOT a redirect)
- Hero section features the latest "ready" episode with:
  - Episode title and date
  - Duration badge
  - Large play button (starts audio immediately)
  - Animated waveform or visual element
- Below the hero: grid of 6-8 most recent episodes
- Below episodes: CTA section for email signup
- Below CTA: brief "About AI Digest" section

#### R2: Flat Black Design with RGB Accents
- Background: pure flat black (`#000000` or `#050505`)
- No gradients, no glass, no shadows — completely flat
- Primary accent: red (`#EF4444` or similar)
- Secondary accent: blue (`#3B82F6`)
- Tertiary accent: green (`#22C55E`)
- Accent usage: headings, interactive elements, badges, hover states
- Text: high-contrast white/light gray on black
- Cards: subtle dark surface (`#0A0A0A` or `#111111`) with no border or 1px subtle border

#### R3: Public Audio Player
- All episodes playable without authentication
- Existing audio store and player components reused
- Mini player persists across page navigation
- Full player on episode detail page with:
  - Waveform visualization
  - Transcript (synchronized, searchable)
  - Speed controls
  - Skip forward/back

#### R4: Episode Listing Page
- Redesigned `/podcasts` page with:
  - Featured latest episode at top
  - Grid layout for remaining episodes (responsive: 1-2-3 columns)
  - Each card shows: title, date, duration, short description or first line of transcript
  - Click to navigate to detail page
  - Infinite scroll or pagination

#### R5: Episode Detail Page
- Redesigned `/podcasts/[id]` with:
  - Full-width player section
  - Episode metadata (date, duration, topics)
  - Searchable transcript
  - "More Episodes" section at bottom
  - Social share buttons (copy link, Twitter/X)
  - CTA to subscribe if not authenticated

#### R6: Call-to-Action / Signup Integration
- Prominent email signup form on landing page
- Smaller CTA on episode detail pages
- "Subscribe in your podcast app" buttons linking to RSS feed
- CTA copy that conveys value: "AI news you can listen to. Weekly."

### Should Have (P1)

#### R7: RSS Podcast Feed
- Standards-compliant RSS 2.0 feed at `/api/podcast/feed.xml`
- iTunes/Apple Podcasts namespace tags
- Includes all "ready" episodes with enclosure tags
- Proper MIME types and duration metadata

#### R8: SEO & Metadata
- Dynamic `<title>` and `<meta description>` for each episode page
- Open Graph tags for social sharing
- Structured data (JSON-LD) for Podcast and Episode schema
- Sitemap generation including episode pages

#### R9: Responsive Design
- Mobile-first design
- Touch-friendly controls (min 44px touch targets)
- Appropriate text sizes for mobile/tablet/desktop
- Mini player adapts to safe area insets

### Could Have (P2)

#### R10: Episode Search
- Search across episode titles and transcript full text
- Results show matching episodes with highlighted snippets

#### R11: Topic Filtering
- Filter episodes by AI topic (derived from source stories)
- Tag/badge system on episode cards

#### R12: Play Count Analytics
- Track play events (start, 25%, 50%, 75%, complete)
- Display play counts on episode cards (social proof)

### Won't Have (this iteration)

- User accounts/profiles for podcast preferences
- Playlist or queue functionality
- Comments or ratings on episodes
- Downloadable episodes (just streaming)
- Apple Podcasts / Spotify direct integration (just RSS)

---

## 5. Design Language

### Visual Identity
- **Name**: "AI DIGEST" — bold, uppercase, tracking-wider
- **Tone**: Technical, authoritative, slightly futuristic
- **Palette**:
  - Background: `#000000` (pure black) or `#050505`
  - Surface: `#0A0A0A` to `#111111` (barely visible cards)
  - Text primary: `#FAFAFA`
  - Text secondary: `#888888`
  - Red accent: `#EF4444` — used for "LIVE", "NEW", play buttons, primary CTAs
  - Blue accent: `#3B82F6` — used for links, secondary interactive elements
  - Green accent: `#22C55E` — used for success states, duration badges, "ready" indicators

### Typography
- Headings: Geist Sans, bold, tight tracking
- Body: Geist Sans, regular
- Mono: Geist Mono (timestamps, technical details)
- Large display text for hero section

### Layout Principles
- Full-width hero sections (no container constraints)
- Contained content sections (max-width ~1200px)
- Generous whitespace between sections
- No decorative borders or dividers — use spacing only
- Cards are flat rectangles with no rounded corners or minimal rounding (2-4px max)

### Interactive Elements
- Buttons: flat, no shadows, accent-colored text or fills
- Hover states: color shift, no scale/shadow effects
- Play buttons: prominent, circular, accent-bordered
- Links: accent-colored, underline on hover

---

## 6. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| First episode play within 10s of landing | >30% of visitors | Analytics event |
| Signup conversion from podcast pages | >5% of visitors | Form submissions |
| Episode detail page bounce rate | <50% | Analytics |
| Average episodes browsed per session | >2 | Analytics |
| RSS feed subscribers (30 day) | >50 | Feed analytics |

---

## 7. Acceptance Criteria

- [ ] Root URL (`/`) displays public landing page with featured episode
- [ ] Latest "ready" episode is prominently featured with play button
- [ ] Audio plays without authentication
- [ ] Design uses flat black background with red/blue/green accents
- [ ] Episode listing shows responsive grid of all episodes
- [ ] Episode detail page includes player, transcript, and share buttons
- [ ] CTA for email signup appears on landing page and episode pages
- [ ] Mini player persists during navigation
- [ ] Pages are responsive (mobile, tablet, desktop)
- [ ] Dynamic SEO metadata on all episode pages

---

## 8. Constraints

- Must use existing audio store and player components (do not rebuild)
- Must use existing database queries and API routes where possible
- Must work on Vercel serverless deployment (no SSR streaming, max 300s function timeout)
- Existing auth/admin pages must remain functional
- Design must use Tailwind CSS (existing setup)
- No external UI component libraries (existing custom Card, Badge, etc.)

---

## 9. Out of Scope

- Backend changes to podcast generation pipeline
- New database tables or migrations
- Mobile app (React Native) changes
- Admin dashboard redesign
- Newsletter/email system changes
