---
spec: poc
phase: requirements
created: 2026-02-07
---

# Requirements: AI Digest — Cyberpunk Dark Theme UI/UX Redesign

## Goal

Redesign the AI Digest mobile app with a cyberpunk dark theme across 26 screens using Stitch MCP for design reference, then implement from scratch in NativeWind/React Native with Expo Router. Two personas — developers configuring the AI pipeline and consumers reading/listening to content — must both be served with a cohesive, accessible, OLED-friendly interface.

## Personas

| Persona | Description | Primary Screens |
|---------|-------------|-----------------|
| **Consumer** | Reads digests, listens to podcasts, subscribes to newsletters | Home feed, podcast player, newsletter, search, profile |
| **Developer** | Configures AI pipeline, monitors research logs, manages sources | Config dashboard, pipeline monitor, admin panel |

---

## User Stories

### Feature Area: Design System & Stitch Generation

#### US-1: Stitch Project Setup
**As a** developer
**I want to** generate all 26 screen designs via Stitch MCP with a consistent cyberpunk theme
**So that** I have visual reference specs for NativeWind implementation

**Acceptance Criteria:**
- [ ] AC-1.1: Stitch project created with `create_project`
- [ ] AC-1.2: First 3 screens (splash, daily feed, full player) generated with GEMINI_3_PRO
- [ ] AC-1.3: Remaining 23 screens generated with GEMINI_3_FLASH
- [ ] AC-1.4: All prompts use standardized design system prefix (colors, fonts, spacing, effects)
- [ ] AC-1.5: Total generations stay within 52 (13% of free tier)

#### US-2: Design Token System
**As a** developer
**I want to** a NativeWind/Tailwind token set matching the cyberpunk palette
**So that** all components share consistent colors, typography, spacing, and effects

**Acceptance Criteria:**
- [ ] AC-2.1: `tailwind.config.js` defines CSS variable-based colors via `vars()` for runtime theming
- [ ] AC-2.2: All 11 semantic color roles defined (cyber-bg, cyber-surface, cyber-cyan, cyber-magenta, cyber-green, cyber-purple, cyber-blue, cyber-amber, cyber-text, cyber-text-secondary, cyber-overlay)
- [ ] AC-2.3: Font families registered: JetBrains Mono (headings), Inter (body)
- [ ] AC-2.4: Neon glow box-shadows defined as Tailwind utilities (shadow-neon-cyan, shadow-neon-magenta)
- [ ] AC-2.5: Spacing uses 16px base grid; corner radii: 8px (cards), 12px (buttons), 24px (pills)
- [ ] AC-2.6: Electric Blue uses adjusted `#3388FF` (WCAG AA compliant at 5.5:1)

---

### Feature Area: Onboarding (Screens 1-4)

#### US-3: Splash / Loading Screen
**As a** consumer
**I want to** see a branded loading screen while the app initializes
**So that** I know the app is launching and feel the cyberpunk aesthetic immediately

**Acceptance Criteria:**
- [ ] AC-3.1: Deep black (#0A0A0F) background with centered app logo
- [ ] AC-3.2: Scanline overlay effect on background
- [ ] AC-3.3: Neon cyan pulsing loading indicator
- [ ] AC-3.4: Fonts fully loaded before transitioning (no FOUT)
- [ ] AC-3.5: Auto-navigates to onboarding (first launch) or home (returning user) within 3s
- [ ] AC-3.6: All animations disabled when `prefers-reduced-motion` is enabled

#### US-4: Onboarding Welcome
**As a** new consumer
**I want to** understand the app's value proposition on first launch
**So that** I know what AI Digest offers before committing

**Acceptance Criteria:**
- [ ] AC-4.1: Hero illustration/graphic with cyberpunk visual treatment
- [ ] AC-4.2: Tagline: concise value prop (max 2 lines)
- [ ] AC-4.3: "Get Started" primary CTA (neon cyan)
- [ ] AC-4.4: "Skip" secondary action visible
- [ ] AC-4.5: Pagination dots showing 3-step progress (1 of 3)

#### US-5: Onboarding Topic Preferences
**As a** new consumer
**I want to** select topics I care about (AI, ML, Web, Mobile, etc.)
**So that** my digest feed is personalized

**Acceptance Criteria:**
- [ ] AC-5.1: Grid/chip layout of selectable topics with neon border on selected state
- [ ] AC-5.2: Minimum 1 topic required to proceed; "Next" CTA disabled until selection
- [ ] AC-5.3: At least 8 topic options displayed
- [ ] AC-5.4: Selected chips show neon glow effect
- [ ] AC-5.5: Pagination dots showing step 2 of 3

#### US-6: Onboarding Notification & Subscribe
**As a** new consumer
**I want to** configure push notifications and email subscription
**So that** I receive content through my preferred channels

**Acceptance Criteria:**
- [ ] AC-6.1: Toggle for push notifications with system permission request on enable
- [ ] AC-6.2: Email input field with validation for newsletter subscription
- [ ] AC-6.3: Frequency selector (daily/weekly) for email digest
- [ ] AC-6.4: "Done" CTA navigates to home feed
- [ ] AC-6.5: All fields optional — can skip entirely

---

### Feature Area: Daily Digest (Screens 5-6)

#### US-7: Home — Daily Digest Feed (P0 CRITICAL)
**As a** consumer
**I want to** browse today's AI-curated digest as a scrollable card feed
**So that** I can quickly scan and select articles to read

**Acceptance Criteria:**
- [ ] AC-7.1: FlatList-based scrollable feed with card-based layout
- [ ] AC-7.2: Each card shows: title, source, summary snippet (2-3 lines), category tag, timestamp
- [ ] AC-7.3: Cards use elevated surface (#12121A) with neon glow border on press
- [ ] AC-7.4: Pull-to-refresh triggers feed reload with RefreshControl
- [ ] AC-7.5: Category filter chips at top (horizontal scroll)
- [ ] AC-7.6: Tap card navigates to Digest Detail View
- [ ] AC-7.7: Feed loads within 2s on 4G connection
- [ ] AC-7.8: Empty state shown when no digest available (see US-21)

#### US-8: Digest Detail View
**As a** consumer
**I want to** read the full content of a digest article
**So that** I can understand the topic in depth

**Acceptance Criteria:**
- [ ] AC-8.1: Full article content rendered with Inter body text, JetBrains Mono for code blocks
- [ ] AC-8.2: Back navigation to feed
- [ ] AC-8.3: Share button triggers share sheet (US-25)
- [ ] AC-8.4: Bookmark/save action with visual feedback (neon cyan fill)
- [ ] AC-8.5: Reading time estimate displayed
- [ ] AC-8.6: Source attribution with link to original

---

### Feature Area: Podcast (Screens 7-9, 21)

#### US-9: Podcast Episode List
**As a** consumer
**I want to** browse available podcast episodes
**So that** I can find and play episodes that interest me

**Acceptance Criteria:**
- [ ] AC-9.1: List of episodes with: title, date, duration, description snippet
- [ ] AC-9.2: Episode artwork thumbnail (40px) per item
- [ ] AC-9.3: Play button per episode; tap starts playback and shows mini player
- [ ] AC-9.4: Currently playing episode highlighted with neon cyan accent
- [ ] AC-9.5: Sort by newest/oldest toggle

#### US-10: Podcast Full Player (P0 CRITICAL)
**As a** consumer
**I want to** control podcast playback with a full-screen immersive player
**So that** I can listen, seek, adjust speed, and access transcript

**Acceptance Criteria:**
- [ ] AC-10.1: Large episode artwork (60-70% width) with neon glow border
- [ ] AC-10.2: Waveform-style seek bar with elapsed/remaining time
- [ ] AC-10.3: Play/Pause center button (48px+ touch target), skip forward/back 15s flanking buttons
- [ ] AC-10.4: Playback speed selector: 0.5x, 1x, 1.25x, 1.5x, 2x
- [ ] AC-10.5: Secondary action row: sleep timer, bookmark, share, transcript toggle
- [ ] AC-10.6: Background gradient with cyberpunk neon tint from episode art
- [ ] AC-10.7: Background playback continues when navigating away or locking device
- [ ] AC-10.8: Lock screen / notification bar controls (play/pause, skip)

#### US-11: Podcast Mini Player
**As a** consumer
**I want to** see a persistent mini player bar while browsing other screens
**So that** I can control playback without leaving my current screen

**Acceptance Criteria:**
- [ ] AC-11.1: Mini bar (56-64px) positioned above bottom tab bar
- [ ] AC-11.2: Shows: episode art thumbnail, truncated title, play/pause button
- [ ] AC-11.3: Tap expands to full player (US-10) via bottom sheet animation
- [ ] AC-11.4: Swipe-up gesture also expands to full player
- [ ] AC-11.5: Mini player visible across all tab screens when audio is playing
- [ ] AC-11.6: Uses gorhom/bottom-sheet for expand/collapse (not PanResponder)

#### US-12: Podcast Transcript View
**As a** consumer
**I want to** read along with the podcast transcript synced to audio
**So that** I can follow content visually or search for specific topics

**Acceptance Criteria:**
- [ ] AC-12.1: Speaker labels with unique color per speaker
- [ ] AC-12.2: Timestamps per segment; tap to jump to that position in audio
- [ ] AC-12.3: Current segment highlighted and auto-scrolled during playback
- [ ] AC-12.4: In-transcript text search with match highlighting
- [ ] AC-12.5: Chat-bubble or paragraph layout per speaker segment

---

### Feature Area: Newsletter (Screens 10-11)

#### US-13: Newsletter Archive & Subscribe
**As a** consumer
**I want to** browse past newsletter issues and manage my subscription
**So that** I can catch up on missed issues and control delivery

**Acceptance Criteria:**
- [ ] AC-13.1: Chronological list of newsletter issues with title, date, preview snippet
- [ ] AC-13.2: Subscribe/unsubscribe toggle with email input
- [ ] AC-13.3: Frequency preference (daily/weekly)
- [ ] AC-13.4: Tap issue navigates to Newsletter Issue View (US-14)
- [ ] AC-13.5: Empty state when no issues exist (see US-21)

#### US-14: Newsletter Issue View
**As a** consumer
**I want to** read a newsletter issue in the app
**So that** I don't need to open email to read content

**Acceptance Criteria:**
- [ ] AC-14.1: Full newsletter content rendered with cyberpunk theme styling
- [ ] AC-14.2: Inline images render correctly
- [ ] AC-14.3: External links open in in-app browser
- [ ] AC-14.4: Share and bookmark actions available
- [ ] AC-14.5: Back navigation to archive

---

### Feature Area: Configuration (Screens 12-13) — Developer Persona

#### US-15: Configuration Main Settings
**As a** developer
**I want to** configure the AI pipeline parameters
**So that** I can control how content is sourced, processed, and delivered

**Acceptance Criteria:**
- [ ] AC-15.1: Grouped settings sections: Sources, Processing, Delivery, Schedule
- [ ] AC-15.2: Toggle switches for enable/disable with neon accent on active state
- [ ] AC-15.3: Text inputs with cyberpunk-styled borders (glow on focus)
- [ ] AC-15.4: Save action with success feedback (neon green flash)
- [ ] AC-15.5: Reset to defaults option with confirmation dialog

#### US-16: Configuration Source Management
**As a** developer
**I want to** add, remove, and prioritize content sources for the AI pipeline
**So that** the digest pulls from the right feeds

**Acceptance Criteria:**
- [ ] AC-16.1: List of configured sources with: name, type (RSS, API, scraper), status indicator
- [ ] AC-16.2: Add source form: URL, name, type selector, refresh interval
- [ ] AC-16.3: Drag-to-reorder for priority ranking
- [ ] AC-16.4: Swipe-to-delete with confirmation
- [ ] AC-16.5: Status indicators: green (active), amber (stale), magenta (error)

---

### Feature Area: Research Log (Screens 14-15) — Developer Persona

#### US-17: Research Log Pipeline Monitor
**As a** developer
**I want to** monitor the AI research pipeline execution status
**So that** I can identify failures, bottlenecks, or stale data

**Acceptance Criteria:**
- [ ] AC-17.1: Timeline/log view of pipeline runs with timestamp, status, duration
- [ ] AC-17.2: Status badges: running (pulsing cyan), success (green), failed (magenta), queued (purple)
- [ ] AC-17.3: Tap run entry expands to session detail (US-18)
- [ ] AC-17.4: Auto-refresh every 30s when screen is active
- [ ] AC-17.5: Filter by status (all/running/failed/success)

#### US-18: Research Log Session Detail
**As a** developer
**I want to** drill into a specific pipeline run's details
**So that** I can debug failures or verify output quality

**Acceptance Criteria:**
- [ ] AC-18.1: Step-by-step execution log with timestamps
- [ ] AC-18.2: Each step shows: name, status, duration, input/output summary
- [ ] AC-18.3: Error details with stack trace for failed steps (monospace font)
- [ ] AC-18.4: Output preview (generated digest content snippet)
- [ ] AC-18.5: Re-run action for failed pipelines

---

### Feature Area: Search (Screen 16)

#### US-19: Search & Filter Overlay
**As a** consumer
**I want to** search across all content (digests, podcasts, newsletters)
**So that** I can find specific topics quickly

**Acceptance Criteria:**
- [ ] AC-19.1: Full-screen overlay with auto-focused search input
- [ ] AC-19.2: Real-time results as user types (debounced 300ms)
- [ ] AC-19.3: Results grouped by content type: Digests, Podcasts, Newsletters
- [ ] AC-19.4: Filter chips: content type, date range, topic
- [ ] AC-19.5: Recent searches persisted locally
- [ ] AC-19.6: Empty results state with suggestion text

---

### Feature Area: User Profile (Screen 17)

#### US-20: User Profile & Preferences
**As a** consumer
**I want to** manage my account, topics, and notification preferences
**So that** my experience stays personalized

**Acceptance Criteria:**
- [ ] AC-20.1: Profile section: avatar, display name, email
- [ ] AC-20.2: Topic preferences editor (same chip UI as onboarding)
- [ ] AC-20.3: Notification toggles: push, email, frequency
- [ ] AC-20.4: Appearance section: theme toggle (dark always active, potential light mode future)
- [ ] AC-20.5: App info: version, links to privacy policy, terms
- [ ] AC-20.6: Sign out action with confirmation

---

### Feature Area: Empty & Error States (Screens 18-19)

#### US-21: Empty States Collection (4 variants)
**As a** consumer
**I want to** see helpful empty states when no content is available
**So that** I understand why a screen is empty and what to do next

**Acceptance Criteria:**
- [ ] AC-21.1: Digest empty: illustration + "No digest today" + "Check back tomorrow" message
- [ ] AC-21.2: Podcast empty: illustration + "No episodes yet" + subscribe CTA
- [ ] AC-21.3: Newsletter empty: illustration + "No issues yet" + subscribe CTA
- [ ] AC-21.4: Search empty: illustration + "No results" + refine search suggestion
- [ ] AC-21.5: All empty states use cyberpunk-themed illustrations with muted neon tones

#### US-22: Error / 404 Screen
**As a** consumer
**I want to** see a clear error screen when something goes wrong
**So that** I can retry or navigate back

**Acceptance Criteria:**
- [ ] AC-22.1: Cyberpunk-styled error illustration (glitch effect)
- [ ] AC-22.2: Error message in plain language (no stack traces)
- [ ] AC-22.3: "Retry" primary CTA
- [ ] AC-22.4: "Go Home" secondary action
- [ ] AC-22.5: Works offline (no network dependency for rendering)

---

### Feature Area: Notifications (Screen 20)

#### US-23: Notification Center
**As a** consumer
**I want to** view all app notifications in one place
**So that** I don't miss new digests, episodes, or pipeline alerts

**Acceptance Criteria:**
- [ ] AC-23.1: Chronological list of notifications with: icon, title, message, timestamp
- [ ] AC-23.2: Unread indicator (neon cyan dot)
- [ ] AC-23.3: Tap notification navigates to relevant content
- [ ] AC-23.4: "Mark all read" action
- [ ] AC-23.5: Swipe-to-dismiss individual notifications
- [ ] AC-23.6: Developer notifications (pipeline failures) distinguished by magenta accent

---

### Feature Area: Sharing (Screen 22)

#### US-24: Share Sheet
**As a** consumer
**I want to** share digest articles, podcast episodes, or newsletter issues
**So that** I can send content to friends or other apps

**Acceptance Criteria:**
- [ ] AC-24.1: Native share sheet invocation (iOS/Android system share)
- [ ] AC-24.2: Custom preview card with: title, snippet, app branding
- [ ] AC-24.3: Copy link action
- [ ] AC-24.4: Share triggers from detail views, player, and newsletter reader

---

### Feature Area: Summary (Screen 23)

#### US-25: Weekly/Monthly Summary
**As a** consumer
**I want to** see a summary of the week's or month's top content
**So that** I can catch up on what I missed

**Acceptance Criteria:**
- [ ] AC-25.1: Top articles ranked by engagement/relevance
- [ ] AC-25.2: Stats section: articles read, podcasts listened, time spent
- [ ] AC-25.3: Topic trend visualization (bar chart or sparklines with neon colors)
- [ ] AC-25.4: Toggle between weekly and monthly views
- [ ] AC-25.5: Share summary action

---

### Feature Area: Email Template (Screen 24)

#### US-26: Email Newsletter Template
**As a** developer
**I want to** a cyberpunk-themed HTML email template for newsletter delivery
**So that** subscribers receive branded content in their inbox

**Acceptance Criteria:**
- [ ] AC-26.1: 600px max width, inline CSS only
- [ ] AC-26.2: Dark-first design using off-black (#0D0D14) and off-white (#F0F0F5)
- [ ] AC-26.3: No pure #000000 or #FFFFFF (prevents Gmail iOS auto-inversion)
- [ ] AC-26.4: Meta tags: `color-scheme` and `supported-color-schemes` for Apple Mail
- [ ] AC-26.5: Light-mode fallback via `@media (prefers-color-scheme: light)`
- [ ] AC-26.6: Neon accent colors used for headings, CTAs, dividers
- [ ] AC-26.7: System fonts only (no web font dependencies)
- [ ] AC-26.8: Renders correctly in Gmail, Apple Mail, Outlook (tested via Litmus or Email on Acid)

---

### Feature Area: Desktop (Screens 25-26)

#### US-27: Desktop Dashboard
**As a** consumer
**I want to** access the digest on a large screen with a dashboard layout
**So that** I can browse content more efficiently on desktop

**Acceptance Criteria:**
- [ ] AC-27.1: Multi-column layout: feed + detail pane (master-detail)
- [ ] AC-27.2: Sidebar navigation replacing bottom tabs
- [ ] AC-27.3: Same cyberpunk theme with adapted spacing for desktop
- [ ] AC-27.4: Podcast player integrated as sidebar widget (not overlay)
- [ ] AC-27.5: Responsive breakpoint: 1024px+ triggers desktop layout

#### US-28: Desktop Admin Panel
**As a** developer
**I want to** manage the pipeline, sources, and content via a desktop admin interface
**So that** I have full control with a productivity-optimized layout

**Acceptance Criteria:**
- [ ] AC-28.1: Multi-panel layout: nav sidebar + content area + detail drawer
- [ ] AC-28.2: Pipeline monitor with real-time status updates
- [ ] AC-28.3: Source management with inline editing
- [ ] AC-28.4: Content moderation: approve/reject/edit generated content
- [ ] AC-28.5: Analytics overview: generation stats, error rates, content volume
- [ ] AC-28.6: Keyboard navigation support

---

### Feature Area: Navigation & Shell

#### US-29: Bottom Tab Navigation
**As a** consumer
**I want to** navigate between app sections via a persistent bottom tab bar
**So that** I can switch contexts quickly

**Acceptance Criteria:**
- [ ] AC-29.1: 5 tabs: Home, Podcasts, Search, Newsletters, Profile
- [ ] AC-29.2: Floating tab bar with cyberpunk styling (translucent dark background, neon active indicator)
- [ ] AC-29.3: Active tab: neon cyan icon + label; inactive: muted gray
- [ ] AC-29.4: Tab bar positioned below mini player when audio is playing
- [ ] AC-29.5: Android max 5 tabs constraint satisfied
- [ ] AC-29.6: Icons from @expo/vector-icons Ionicons set
- [ ] AC-29.7: Touch targets 48px+ per tab item

---

## Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-1 | Stitch MCP generates all 26 screen designs with consistent cyberpunk theme | P0 | Prompt template used; all screens generated within budget |
| FR-2 | NativeWind design token system with CSS variable theming | P0 | All colors, fonts, shadows, spacing defined as Tailwind tokens |
| FR-3 | Expo Router 5-tab navigation with floating cyberpunk tab bar | P0 | 5 tabs render, active states work, mini player sits above |
| FR-4 | Daily digest feed with card layout, pull-to-refresh, category filters | P0 | Cards display all fields; refresh works; filters functional |
| FR-5 | Full podcast player with seek, speed control, background playback | P0 | All controls functional; audio plays in background; lock screen controls |
| FR-6 | Mini player bar with expand/collapse to full player | P0 | gorhom/bottom-sheet animation; visible across tabs |
| FR-7 | Onboarding flow (3 screens + splash) with topic selection | P1 | Skip works; topics saved; shown only on first launch |
| FR-8 | Newsletter archive with subscribe/unsubscribe | P1 | Issues listed; subscription toggle functional |
| FR-9 | Search overlay with cross-content results and filters | P1 | Debounced search; grouped results; filter chips work |
| FR-10 | Configuration dashboard for pipeline settings and source management | P1 | Settings save; sources CRUD works; drag reorder |
| FR-11 | Pipeline monitor with real-time status and session detail drill-down | P1 | Auto-refresh; status badges; error details visible |
| FR-12 | Podcast transcript view synced to audio playback | P1 | Highlights current segment; tap-to-seek; search works |
| FR-13 | Notification center with read/unread and navigation | P1 | Tap navigates; mark all read; swipe dismiss |
| FR-14 | User profile with preference management | P1 | Topics editable; notifications configurable; sign out works |
| FR-15 | Share sheet for all content types | P1 | Native share; copy link; custom preview |
| FR-16 | Weekly/monthly summary with stats and trends | P2 | Stats render; toggle works; charts display |
| FR-17 | Empty states for 4 content types | P1 | Unique illustration and CTA per type |
| FR-18 | Error/404 screen with retry and navigation | P1 | Retry triggers reload; Go Home navigates to feed |
| FR-19 | Email newsletter template (dark-first, inline CSS) | P2 | Renders in Gmail, Apple Mail, Outlook; no auto-inversion issues |
| FR-20 | Desktop dashboard (responsive web build) | P2 | Multi-column at 1024px+; sidebar nav; embedded player |
| FR-21 | Desktop admin panel with pipeline + content management | P2 | Multi-panel layout; inline editing; analytics |
| FR-22 | Digest detail view with full article rendering | P0 | Content renders; code blocks styled; share + bookmark work |

## Non-Functional Requirements

| ID | Requirement | Metric | Target |
|----|-------------|--------|--------|
| NFR-1 | WCAG AA compliance | Color contrast ratio | All text colors >= 4.5:1 on backgrounds |
| NFR-2 | Touch target accessibility | Minimum dimension | 44x44pt (Apple HIG) / 48x48dp (Material) |
| NFR-3 | Reduced motion support | prefers-reduced-motion | All animations/effects disabled when enabled |
| NFR-4 | Feed load performance | Time to interactive | < 2s on 4G connection |
| NFR-5 | Font loading | FOUT prevention | Splash screen holds until fonts loaded |
| NFR-6 | OLED battery optimization | Pure black usage | Background #0A0A0F (near-pure-black) on all primary surfaces |
| NFR-7 | Audio continuity | Background playback | Audio persists across screen changes, app backgrounding, lock |
| NFR-8 | Offline resilience | Error screen rendering | Error/empty states render without network |
| NFR-9 | Stitch generation budget | Monthly usage | <= 52 generations (13% of 400 free tier) |
| NFR-10 | Design consistency | Cross-screen visual coherence | Standardized prompt template prefix for all Stitch calls |
| NFR-11 | Email client compatibility | Rendering correctness | Gmail, Apple Mail, Outlook (desktop + mobile) |
| NFR-12 | Platform navigation limits | Android tab bar | Max 5 bottom tabs |
| NFR-13 | Visual regression | Baseline screenshots | Playwright snapshot tests for web build of all screens |
| NFR-14 | Responsive breakpoints | Desktop layout trigger | 1024px+ for multi-column layout |
| NFR-15 | Search responsiveness | Debounce interval | 300ms debounce on search input |

---

## Glossary

| Term | Definition |
|------|-----------|
| **Stitch MCP** | Google's AI UI design tool accessed via Model Context Protocol; generates screen mockups from text prompts |
| **NativeWind** | Tailwind CSS for React Native; enables utility-first styling with CSS variables |
| **Design Token** | Atomic design value (color, spacing, font) defined once and referenced throughout the system |
| **FOUT** | Flash of Unstyled Text — visible font swap when custom fonts load late |
| **gorhom/bottom-sheet** | React Native bottom sheet library used for mini player expand/collapse |
| **Pipeline** | The AI research and content generation workflow that produces digests and podcasts |
| **OLED-friendly** | Using pure/near-pure black backgrounds so OLED pixels turn off, saving battery |
| **Scanline** | Horizontal line overlay effect mimicking CRT monitor aesthetics |
| **Design DNA** | Extracted color/font/layout patterns that ensure consistency across Stitch generations |
| **GEMINI_3_PRO / FLASH** | Stitch AI model tiers — Pro is higher quality (50/month), Flash is faster (350/month) |

---

## Out of Scope

- Backend API implementation (data fetching, auth, content pipeline logic)
- Actual AI content generation (LLM integration, summarization, podcast synthesis)
- User authentication and account management backend
- Push notification server infrastructure
- App Store / Play Store submission and signing
- Analytics and telemetry integration
- Monetization or payment features
- Light theme (dark-only for this phase; light mode is future work)
- Tablet-specific layouts (mobile and desktop only)
- Offline content caching and sync
- Localization / i18n
- Deep linking / universal links
- CI/CD pipeline setup
- Automated testing framework setup (beyond visual regression baseline)

---

## Dependencies

| Dependency | Type | Status | Impact |
|------------|------|--------|--------|
| Stitch MCP server configured | Tool | Assumed available | Blocks all design generation |
| Google Cloud project with Stitch API | Service | Unverified | Blocks Stitch usage |
| Expo SDK (latest) | Library | Available | Foundation for app |
| NativeWind v4+ | Library | Available (npm) | Theming architecture |
| Expo Router | Library | Available (npm) | Navigation |
| gorhom/bottom-sheet | Library | Available (npm) | Mini player |
| react-native-track-player | Library | Available (npm) | Background audio |
| @expo-google-fonts/jetbrains-mono | Library | Available (npm) | Heading font |
| @expo-google-fonts/inter | Library | Available (npm) | Body font |
| Litmus or Email on Acid | Service | Needs account | Email template testing |
| Transcript data format | Decision | Undecided | Affects US-12 implementation |
| Audio content source | Decision | Undecided | Affects US-10 data layer |
| Email delivery service | Decision | Undecided | Affects US-26 integration |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Stitch design inconsistency across 26 screens | Medium | High | Standardized prompt prefix; Pro model for first 3 anchor screens |
| Stitch MCP server unavailable or misconfigured | Low | Critical | Verify setup before generation; manual Figma fallback |
| NativeWind CSS variable theming edge cases | Low | Medium | Test token system early; fallback to hardcoded values |
| gorhom/bottom-sheet scroll conflicts | Medium | Medium | Use gesture-handler (not PanResponder); test early |
| Electric Blue accessibility failure | Resolved | N/A | Adjusted to #3388FF per research |
| Email template rendering variance | High | Low | Test with Litmus; use conservative inline CSS |
| Scope creep from 26 screens | High | High | Strict P0/P1/P2 prioritization; P2 screens deferred if needed |

---

## Success Criteria

1. **Design Complete**: All 26 Stitch screen designs generated with visually consistent cyberpunk theme
2. **Token System**: Complete NativeWind design token configuration matching Stitch reference colors/fonts/spacing
3. **P0 Screens Functional**: Home feed, digest detail, full podcast player, mini player, and tab navigation all render and operate correctly on iOS and Android
4. **P1 Screens Functional**: All P1 screens render with correct cyberpunk styling and functional interactions
5. **Accessibility**: WCAG AA color contrast passes for all text; 44px+ touch targets; reduced-motion supported
6. **Audio Pipeline**: Podcast plays in background, lock screen controls work, mini player persists across tabs
7. **Visual Evidence**: Screenshots captured from real device/simulator confirming cyberpunk aesthetic matches Stitch references

---

## Unresolved Questions

1. **Transcript format**: What format are transcripts in (SRT, VTT, JSON with timestamps)? Affects parsing logic in US-12.
2. **Audio source**: Where does podcast audio come from? RSS, custom backend, AI-generated? Affects player data layer.
3. **Email service**: Which provider (SendGrid, Resend, Postmark) for newsletter delivery? Affects template testing.
4. **Desktop target**: Are desktop variants (US-27, US-28) responsive web via react-native-web, or separate web app?
5. **Stitch API status**: Is Google Cloud project configured with Stitch API enabled? Must verify before generation phase.
6. **Content moderation**: Does the admin panel (US-28) need content approval workflow, or is AI output auto-published?
7. **State management**: Zustand vs React Context for global audio state? Affects architecture decisions.

---

## Next Steps

1. User reviews and approves requirements (this document)
2. Resolve unresolved questions (especially transcript format, audio source, desktop target)
3. Proceed to design phase: create Stitch project, generate anchor screens (splash, feed, player)
4. Extract design tokens from anchor screens into NativeWind config
5. Generate remaining 23 screens with FLASH model
6. Begin implementation: design system primitives, then navigation shell, then P0 screens
