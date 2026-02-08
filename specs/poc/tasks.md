---
spec: poc
phase: tasks
total_tasks: 52
created: 2026-02-08
---

# Tasks: AI Digest Cyberpunk Mobile App

## Execution Context

- **Testing depth**: Comprehensive -- functional validation plus Playwright visual regression baselines for web build
- **Execution priority**: Quality first -- build design system thoroughly before screens, ensure every component is polished
- **Architecture**: Standalone Expo app at `apps/mobile` in existing Turborepo monorepo
- **Integration**: Consume existing Next.js API routes via typed fetch client with Bearer token auth
- **Validation mandate**: No mocks, no unit tests -- validate through real systems, real API calls, real simulator builds
- **Monorepo**: pnpm 8.6.0, Turborepo, existing apps at `apps/web` and `apps/worker`, packages at `packages/*`
- **Quality commands**: `pnpm check-types` (root), `pnpm --filter @ai-digest/mobile check-types` (mobile)

---

## Phase 1: Foundation (Scaffold + Monorepo + Tokens + Fonts)

- [x] 1.1 Scaffold Expo app at apps/mobile with TypeScript, Expo Router, NativeWind
  - **Do**:
    1. Run `npx create-expo-app@latest apps/mobile --template blank-typescript`
    2. Install core deps: `expo-router`, `nativewind@^4`, `tailwindcss`, `react-native-reanimated`, `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-screens`
    3. Create `tailwind.config.js` with `content: ["./src/**/*.{ts,tsx}"]` and `presets: [require("nativewind/preset")]`
    4. Create `global.css` with Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`)
    5. Create `babel.config.js` with NativeWind preset
    6. Create `metro.config.js` with monorepo watchFolders for `../../packages/*`
    7. Set `package.json` name to `@ai-digest/mobile` with scripts: `dev`, `build`, `check-types`, `ios`, `android`, `web`
    8. Create `tsconfig.json` extending shared TS config with strict mode, paths for `@/` alias pointing to `./src`
    9. Create `src/app/_layout.tsx` minimal root layout with `<Slot />`
    10. Create `src/app/index.tsx` placeholder screen "AI Digest" on black bg
  - **Files**: `apps/mobile/package.json`, `apps/mobile/app.json`, `apps/mobile/tsconfig.json`, `apps/mobile/tailwind.config.js`, `apps/mobile/global.css`, `apps/mobile/babel.config.js`, `apps/mobile/metro.config.js`, `apps/mobile/src/app/_layout.tsx`, `apps/mobile/src/app/index.tsx`
  - **Done when**: `npx expo start` launches without errors; placeholder screen renders
  - **Verify**: `cd apps/mobile && npx expo export:web 2>&1 | tail -5` exits 0
  - **Commit**: `feat(mobile): scaffold Expo app with TypeScript, Expo Router, NativeWind`
  - _Requirements: FR-2, FR-3_
  - _Design: Architecture, File Structure_

- [ ] 1.2 Configure monorepo integration (pnpm workspace, turbo.json, metro symlinks)
  - **Do**:
    1. Verify `pnpm-workspace.yaml` already includes `apps/*` (it does)
    2. Update `turbo.json` to add mobile tasks in `tasks` section (build outputs `dist/**`)
    3. Configure `metro.config.js` to resolve `@ai-digest/shared` via `watchFolders` and `nodeModulesPaths`
    4. Add `@ai-digest/shared` as dependency in `apps/mobile/package.json`
    5. Run `pnpm install` from root to link workspace deps
    6. Create `apps/mobile/src/types/shared.ts` that re-exports from `@ai-digest/shared` to verify import chain
  - **Files**: `turbo.json`, `apps/mobile/metro.config.js`, `apps/mobile/package.json`, `apps/mobile/src/types/shared.ts`
  - **Done when**: `import type { Digest } from "@ai-digest/shared"` resolves in mobile app
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): configure monorepo integration with shared packages`
  - _Requirements: FR-2_
  - _Design: Architecture, Existing Patterns_

- [ ] 1.3 Implement design token system (CSS variables, Tailwind config, token constants)
  - **Do**:
    1. Update `global.css` with all 11 CSS variable definitions from design.md (:root block with `--color-cyber-*`)
    2. Update `tailwind.config.js` with full theme: colors (cyber.*), fontFamily, fontSize scale, spacing, borderRadius, boxShadow (neon-*)
    3. Create `src/design-system/tokens/colors.ts` -- export color constants + CSS variable names as TypeScript objects
    4. Create `src/design-system/tokens/typography.ts` -- export font family names, scale definitions
    5. Create `src/design-system/tokens/spacing.ts` -- export spacing scale, radii constants
    6. Create `src/design-system/tokens/shadows.ts` -- export neon glow shadow definitions
    7. Create `src/design-system/tokens/index.ts` -- barrel export
  - **Files**: `apps/mobile/global.css`, `apps/mobile/tailwind.config.js`, `apps/mobile/src/design-system/tokens/colors.ts`, `apps/mobile/src/design-system/tokens/typography.ts`, `apps/mobile/src/design-system/tokens/spacing.ts`, `apps/mobile/src/design-system/tokens/shadows.ts`, `apps/mobile/src/design-system/tokens/index.ts`
  - **Done when**: All 11 color tokens, 3 font families, 10 spacing values, 4 radii, and 5 shadows defined
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): implement cyberpunk design token system`
  - _Requirements: FR-2, AC-2.1 through AC-2.6_
  - _Design: Design System, Color Tokens_

- [ ] 1.4 Configure font loading (JetBrains Mono, Inter, Space Mono + splash hold)
  - **Do**:
    1. Install: `@expo-google-fonts/jetbrains-mono`, `@expo-google-fonts/inter`, `@expo-google-fonts/space-mono`, `expo-splash-screen`
    2. Update `src/app/_layout.tsx` to use `useFonts` hook loading all required weights: JetBrainsMono_400Regular, JetBrainsMono_500Medium, JetBrainsMono_700Bold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, SpaceMono_400Regular
    3. Call `SplashScreen.preventAutoHideAsync()` before component; hide when fonts loaded
    4. Add fallback: if fonts fail to load after 5s timeout, proceed with system fonts
    5. Verify font names match `tailwind.config.js` fontFamily values
  - **Files**: `apps/mobile/package.json`, `apps/mobile/src/app/_layout.tsx`
  - **Done when**: Fonts load on app start; splash screen holds until ready; no FOUT
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): configure font loading with splash screen hold`
  - _Requirements: NFR-5, AC-3.4_
  - _Design: Technical Decisions (Font loading)_

- [ ] 1.5 [VERIFY] Quality checkpoint: type check foundation
  - **Do**: Run type check on mobile package to confirm all foundation files compile
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5` exits 0
  - **Done when**: Zero type errors in mobile package
  - **Commit**: `chore(mobile): pass foundation quality checkpoint` (only if fixes needed)

---

## Phase 2: Design System (Primitives + Composites + Effects)

- [ ] 2.1 Build Text primitive (heading, body, caption, tag, code variants)
  - **Do**:
    1. Create `src/design-system/primitives/Text.tsx` with `CyberText` component
    2. Variants via `variant` prop: `h1` (JetBrains Mono 700, 30px), `h2` (700, 24px), `h3` (500, 20px), `body` (Inter 400, 16px), `body-medium` (500, 16px), `body-small` (400, 14px), `caption` (400, 12px), `tag` (Space Mono 400, 12px), `code` (JetBrains Mono 400, 14px)
    3. Accept `color` prop with defaults per variant (cyber-text for body, cyber-text-secondary for caption)
    4. Accept `className` for NativeWind overrides
    5. All text uses NativeWind classes for styling
  - **Files**: `apps/mobile/src/design-system/primitives/Text.tsx`
  - **Done when**: All 9 variants render with correct font, size, color
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): build Text primitive with 9 variants`
  - _Requirements: AC-2.3, FR-2_
  - _Design: Component Primitives, Typography Scale_

- [ ] 2.2 Build Button primitive (primary, danger, ghost, outline variants)
  - **Do**:
    1. Create `src/design-system/primitives/Button.tsx` with `CyberButton` component
    2. `variant` prop: `primary` (cyan bg, black text, neon-cyan shadow), `danger` (magenta bg), `ghost` (transparent, cyan text), `outline` (cyan border, transparent bg)
    3. `size` prop: `sm` (32px height), `md` (44px), `lg` (52px) -- all >= 44px touch target
    4. `loading` prop: show ActivityIndicator, disable press
    5. `disabled` prop: reduce opacity to 0.5, disable press
    6. Use `Pressable` with `onPressIn` state for pressed glow effect
    7. 12px border radius per design spec
  - **Files**: `apps/mobile/src/design-system/primitives/Button.tsx`
  - **Done when**: All 4 variants render; touch targets >= 44px; loading/disabled states work
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): build Button primitive with 4 variants`
  - _Requirements: NFR-2, AC-2.5, FR-2_
  - _Design: Component Primitives_

- [ ] 2.3 Build Card, Input, Badge, Toggle, Icon, Divider primitives
  - **Do**:
    1. `Card.tsx`: Elevated surface (#12121A bg), 8px radius, optional `glow` prop (none/cyan/magenta), `onPress` for pressable variant, `Pressable` wrapper when onPress provided
    2. `Input.tsx`: Text input with cyber-surface bg, cyan glow on focus via `onFocus`/`onBlur` state, `label` prop, `error` prop (magenta text below), variants: text, email, password, search
    3. `Badge.tsx`: Small pill with variant colors -- `status` (green/amber/magenta bg), `tag` (purple/blue bg), rounded-pill (24px)
    4. `Toggle.tsx`: Switch component with neon accent color when enabled (cyan default), wraps RN Switch
    5. `Icon.tsx`: Wrapper around Ionicons from `@expo/vector-icons` with size tokens (sm=16, md=24, lg=32) and color prop
    6. `Divider.tsx`: Horizontal rule with optional neon glow tint
    7. Create `src/design-system/primitives/index.ts` barrel
  - **Files**: `apps/mobile/src/design-system/primitives/Card.tsx`, `apps/mobile/src/design-system/primitives/Input.tsx`, `apps/mobile/src/design-system/primitives/Badge.tsx`, `apps/mobile/src/design-system/primitives/Toggle.tsx`, `apps/mobile/src/design-system/primitives/Icon.tsx`, `apps/mobile/src/design-system/primitives/Divider.tsx`, `apps/mobile/src/design-system/primitives/index.ts`
  - **Done when**: All 6 primitives render with correct styling; barrel export works
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): build Card, Input, Badge, Toggle, Icon, Divider primitives`
  - _Requirements: FR-2, NFR-2_
  - _Design: Component Primitives_

- [ ] 2.4 [VERIFY] Quality checkpoint: primitives type check
  - **Do**: Run type check to confirm all primitives compile
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5` exits 0
  - **Done when**: Zero type errors
  - **Commit**: `chore(mobile): pass primitives quality checkpoint` (only if fixes needed)

- [ ] 2.5 Build composite components (DigestCard, EpisodeRow, CategoryChip, TopicChip, StatusBadge, SettingsGroup, EmptyState)
  - **Do**:
    1. `DigestCard.tsx`: Uses Card + Text + Badge. Props: title, source, summary (2-3 lines), category tag, timestamp, onPress. Truncate summary with `numberOfLines={3}`
    2. `EpisodeRow.tsx`: Horizontal row with episode art (40px Image), title, date, duration, play button (Icon). `onPlay` + `onPress` callbacks
    3. `CategoryChip.tsx`: Horizontal-scroll filter chip. Selected state: cyan border + glow. Props: label, selected, onPress
    4. `TopicChip.tsx`: Selectable grid chip for onboarding/profile. Selected: neon glow effect. Props: label, selected, onToggle
    5. `StatusBadge.tsx`: Pipeline status with color-coded Badge. Props: status enum (running/success/failed/queued). Running = pulsing cyan, success = green, failed = magenta, queued = purple
    6. `SettingsGroup.tsx`: Grouped settings section with title (h3) + list of setting rows. Props: title, children
    7. `EmptyState.tsx`: Centered layout with illustration placeholder, message Text, optional CTA Button. Props: variant (digest/podcast/newsletter/search), message, ctaLabel, onCta
    8. Create `src/design-system/composites/index.ts` barrel
  - **Files**: `apps/mobile/src/design-system/composites/DigestCard.tsx`, `apps/mobile/src/design-system/composites/EpisodeRow.tsx`, `apps/mobile/src/design-system/composites/CategoryChip.tsx`, `apps/mobile/src/design-system/composites/TopicChip.tsx`, `apps/mobile/src/design-system/composites/StatusBadge.tsx`, `apps/mobile/src/design-system/composites/SettingsGroup.tsx`, `apps/mobile/src/design-system/composites/EmptyState.tsx`, `apps/mobile/src/design-system/composites/index.ts`
  - **Done when**: All 7 composites render with correct design tokens
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): build 7 composite design system components`
  - _Requirements: FR-2, FR-4, AC-7.2, AC-9.1, AC-7.5, AC-5.1, AC-17.2, AC-21.1_
  - _Design: Component Primitives, Screen Inventory_

- [ ] 2.6 Build effects (NeonBorder, Scanline, GlitchText, PulsingDot) with reduced-motion support
  - **Do**:
    1. Create `src/hooks/useReducedMotion.ts` -- check `AccessibilityInfo.isReduceMotionEnabled()` or use `useReducedMotion` from reanimated
    2. `NeonBorder.tsx`: Animated neon glow wrapper using `react-native-reanimated`. Wraps children with animated border shadow. Props: color (cyan/magenta/green), intensity, animated (default true). When reduced-motion: static border, no animation.
    3. `Scanline.tsx`: CRT scanline overlay using `LinearGradient` repeating pattern at 5% opacity over children. When reduced-motion: hidden entirely.
    4. `GlitchText.tsx`: Text with glitch animation via reanimated (clip-path displacement). Props: text, active. When reduced-motion: static text, no glitch.
    5. `PulsingDot.tsx`: Small dot with pulsing opacity animation. Props: color, size. When reduced-motion: static dot.
    6. Create `src/design-system/effects/index.ts` barrel
  - **Files**: `apps/mobile/src/hooks/useReducedMotion.ts`, `apps/mobile/src/design-system/effects/NeonBorder.tsx`, `apps/mobile/src/design-system/effects/Scanline.tsx`, `apps/mobile/src/design-system/effects/GlitchText.tsx`, `apps/mobile/src/design-system/effects/PulsingDot.tsx`, `apps/mobile/src/design-system/effects/index.ts`
  - **Done when**: All 4 effects render; reduced-motion disables animations
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): build cyberpunk effects with reduced-motion support`
  - _Requirements: NFR-3, AC-3.2, AC-3.3, AC-3.6_
  - _Design: Design System, Effects_

- [ ] 2.7 Build layout components (ScreenLayout, TabShell, ModalLayout)
  - **Do**:
    1. `ScreenLayout.tsx`: SafeAreaView wrapper + StatusBar (light-content) + cyber-bg background. Props: children, scrollable (wraps in ScrollView), edges
    2. `TabShell.tsx`: Container for tab screens that reserves space for mini player (64px) above tab bar. Uses `KeyboardAvoidingView` to handle keyboard + mini player coexistence
    3. `ModalLayout.tsx`: Bottom sheet modal wrapper using gorhom/bottom-sheet. Props: snapPoints, children, onClose
    4. Install `@gorhom/bottom-sheet` and `expo-linear-gradient`
    5. Create `src/design-system/layouts/index.ts` barrel
  - **Files**: `apps/mobile/src/design-system/layouts/ScreenLayout.tsx`, `apps/mobile/src/design-system/layouts/TabShell.tsx`, `apps/mobile/src/design-system/layouts/ModalLayout.tsx`, `apps/mobile/src/design-system/layouts/index.ts`, `apps/mobile/package.json`
  - **Done when**: All 3 layouts render correctly
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): build layout components with bottom sheet support`
  - _Requirements: FR-3, FR-6, AC-11.6_
  - _Design: Layouts_

- [ ] 2.8 [VERIFY] Quality checkpoint: full design system type check
  - **Do**: Run type check on entire mobile package including all design system files
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5` exits 0
  - **Done when**: Zero type errors across all design system components
  - **Commit**: `chore(mobile): pass design system quality checkpoint` (only if fixes needed)

---

## Phase 3: Infrastructure (API Client + Auth + Stores + Audio + Server JWT)

- [ ] 3.1 Add JWT Bearer token support to web app login endpoint
  - **Do**:
    1. Install `jose` (lightweight JWT lib) in `apps/web`: `pnpm --filter @ai-digest/web add jose`
    2. Create `apps/web/src/lib/mobile-auth.ts` with `signMobileToken(payload)` and `verifyMobileToken(token)` using `SESSION_SECRET` env var. JWT expiry: 7 days. Payload: `{ userId, email, role }`
    3. Modify `apps/web/src/app/api/auth/login/route.ts`: after session save, check `request.headers.get("X-Client-Type") === "mobile"`. If mobile, call `signMobileToken` and include `token` field in response data
    4. Modify `apps/web/src/lib/admin-auth.ts` `requireAdminFromRequest()`: before checking iron-session, check for `Authorization: Bearer <token>` header. If present, verify with `verifyMobileToken`, check role === "admin". This makes all admin API routes work with Bearer tokens.
    5. Modify `apps/web/src/middleware.ts`: for `/api/admin/*` routes, also accept `Authorization` header (not just session cookie)
  - **Files**: `apps/web/package.json`, `apps/web/src/lib/mobile-auth.ts`, `apps/web/src/app/api/auth/login/route.ts`, `apps/web/src/lib/admin-auth.ts`, `apps/web/src/middleware.ts`
  - **Done when**: `curl -X POST localhost:3000/api/auth/login -H "X-Client-Type: mobile" -H "Content-Type: application/json" -d '{"email":"...","password":"..."}' | jq .data.token` returns a JWT string
  - **Verify**: `pnpm --filter @ai-digest/web check-types 2>&1 | tail -5` exits 0
  - **Commit**: `feat(web): add JWT Bearer token auth for mobile clients`
  - _Requirements: FR-22 (auth prerequisite)_
  - _Design: Auth Strategy, Server-Side Changes Required_

- [ ] 3.2 Add Bearer token validation to public API routes (auth/me, auth/logout)
  - **Do**:
    1. Create `apps/web/src/lib/auth-from-request.ts` with `getUserFromRequest(request)` that: (a) checks `Authorization: Bearer <token>` header first, verifies JWT, returns user info; (b) falls back to iron-session; (c) returns null if neither
    2. Update `apps/web/src/app/api/auth/me/route.ts` to use `getUserFromRequest` instead of only `getSession`
    3. Update `apps/web/src/app/api/auth/logout/route.ts` to handle Bearer token (just return success, client discards token)
  - **Files**: `apps/web/src/lib/auth-from-request.ts`, `apps/web/src/app/api/auth/me/route.ts`, `apps/web/src/app/api/auth/logout/route.ts`
  - **Done when**: `/api/auth/me` responds correctly with Bearer token
  - **Verify**: `pnpm --filter @ai-digest/web check-types 2>&1 | tail -5` exits 0
  - **Commit**: `feat(web): add Bearer token support to auth/me and auth/logout`
  - _Design: Auth Strategy_

- [ ] 3.3 [VERIFY] Quality checkpoint: server JWT changes
  - **Do**: Run type check on web app to confirm JWT changes compile
  - **Verify**: `pnpm --filter @ai-digest/web check-types 2>&1 | tail -5` exits 0
  - **Done when**: Zero type errors in web package
  - **Commit**: `chore(web): pass JWT auth quality checkpoint` (only if fixes needed)

- [ ] 3.4 Implement API client with typed fetch wrapper and Bearer token auth
  - **Do**:
    1. Install `expo-secure-store` in mobile package
    2. Create `src/services/api-client.ts` -- typed `request<T>()` function per design.md spec. Reads `EXPO_PUBLIC_API_URL` env var. Sends `X-Client-Type: mobile` header. Sends `Authorization: Bearer <token>` from SecureStore when `requireAuth: true`. Returns `ApiResponse<T>`.
    3. Create `src/services/api-endpoints.ts` -- export `api` object with all endpoint methods per design.md (getDigests, getDigest, getLatestDigest, getEpisodes, getEpisode, search, subscribe, unsubscribe, login, register, logout, getMe, getStats, getSources, etc.)
    4. Handle 401 responses: clear token from SecureStore, signal auth store to redirect to login
    5. Handle 429 responses: surface rate limit error to caller
  - **Files**: `apps/mobile/package.json`, `apps/mobile/src/services/api-client.ts`, `apps/mobile/src/services/api-endpoints.ts`
  - **Done when**: All API methods typed; 401/429 handling implemented
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): implement typed API client with Bearer token auth`
  - _Requirements: FR-4, FR-22_
  - _Design: API Client Layer_

- [ ] 3.5 Implement Zustand stores (auth, digest, audio, search, preferences, admin)
  - **Do**:
    1. Install `zustand` in mobile package
    2. `stores/auth-store.ts`: token persistence via SecureStore, login/logout/getMe actions, isLoggedIn/isAdmin computed
    3. `stores/digest-store.ts`: digests array, currentDigest, fetchDigests/fetchDigest actions, pagination state
    4. `stores/audio-store.ts`: Mirror web pattern -- currentEpisode, isPlaying, currentTime, duration, playbackSpeed, transcript, isExpanded. Actions async (delegate to TrackPlayer later). Include expandPlayer/collapsePlayer.
    5. `stores/search-store.ts`: query, results, recentSearches (persisted in AsyncStorage), debounced search action
    6. `stores/preferences-store.ts`: topics, notification prefs, onboardingComplete flag (AsyncStorage persisted)
    7. `stores/admin-store.ts`: pipeline runs, sources, config state + CRUD actions
  - **Files**: `apps/mobile/src/stores/auth-store.ts`, `apps/mobile/src/stores/digest-store.ts`, `apps/mobile/src/stores/audio-store.ts`, `apps/mobile/src/stores/search-store.ts`, `apps/mobile/src/stores/preferences-store.ts`, `apps/mobile/src/stores/admin-store.ts`
  - **Done when**: All 6 stores export typed interfaces with actions
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): implement 6 Zustand stores for app state`
  - _Requirements: FR-4, FR-5, FR-9_
  - _Design: Audio Store, Technical Decisions (Zustand)_

- [ ] 3.6 Implement audio service (react-native-track-player setup + background service)
  - **Do**:
    1. Install `react-native-track-player` in mobile package
    2. Create `src/services/audio-service.ts` per design.md: `setupAudioService()` (TrackPlayer.setupPlayer with 50MB cache, capabilities) and `playbackService()` (event listeners for RemotePlay, RemotePause, RemoteSeek, RemoteJumpForward/Backward)
    3. Create `index.ts` (or update entry point) to register `playbackService` with `TrackPlayer.registerPlaybackService`
    4. Create `src/hooks/useAudioPlayer.ts`: subscribes to TrackPlayer events (PlaybackProgressUpdated, PlaybackState), pushes updates into audioStore. Returns convenience methods.
    5. Wire audioStore actions to TrackPlayer methods: play -> add track + TrackPlayer.play(), pause -> TrackPlayer.pause(), seek -> TrackPlayer.seekTo(), setSpeed -> TrackPlayer.setRate()
  - **Files**: `apps/mobile/package.json`, `apps/mobile/src/services/audio-service.ts`, `apps/mobile/index.ts`, `apps/mobile/src/hooks/useAudioPlayer.ts`, `apps/mobile/src/stores/audio-store.ts` (update)
  - **Done when**: Audio service registered; store actions delegate to TrackPlayer; hook bridges events
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): implement audio service with TrackPlayer and background playback`
  - _Requirements: FR-5, NFR-7, AC-10.7, AC-10.8_
  - _Design: Audio Architecture, Service Worker Pattern_

- [ ] 3.7 Implement utility hooks (useApi, usePullToRefresh, useDebounce, useOnboarding)
  - **Do**:
    1. `hooks/useApi.ts`: Generic fetcher hook wrapping api calls with loading/error/data state + refetch
    2. `hooks/usePullToRefresh.ts`: Returns refreshing boolean + onRefresh callback for RefreshControl
    3. `hooks/useDebounce.ts`: Debounced value hook (300ms default)
    4. `hooks/useOnboarding.ts`: Check AsyncStorage for `onboarding_complete` key, return { isFirstLaunch, completeOnboarding }
    5. `utils/format.ts`: formatDate, formatDuration, formatRelativeTime utilities
    6. `utils/colors.ts`: Color manipulation for glow opacity
    7. `utils/platform.ts`: Platform-specific helpers (isIOS, isAndroid, isWeb)
    8. Create `src/services/storage.ts`: AsyncStorage helpers for type-safe get/set
  - **Files**: `apps/mobile/src/hooks/useApi.ts`, `apps/mobile/src/hooks/usePullToRefresh.ts`, `apps/mobile/src/hooks/useDebounce.ts`, `apps/mobile/src/hooks/useOnboarding.ts`, `apps/mobile/src/utils/format.ts`, `apps/mobile/src/utils/colors.ts`, `apps/mobile/src/utils/platform.ts`, `apps/mobile/src/services/storage.ts`
  - **Done when**: All hooks and utils export correctly
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): implement utility hooks, formatters, and storage helpers`
  - _Requirements: NFR-4, NFR-15, FR-7_
  - _Design: Hooks, Utils_

- [ ] 3.8 [VERIFY] Quality checkpoint: infrastructure type check
  - **Do**: Run type check on both web and mobile packages
  - **Verify**: `pnpm check-types 2>&1 | tail -10` exits 0 (root turbo check-types)
  - **Done when**: Zero type errors across both web and mobile packages
  - **Commit**: `chore: pass infrastructure quality checkpoint` (only if fixes needed)

---

## Phase 4: P0 Screens (Feed + Digest Detail + Full Player + Mini Player + Tab Navigation)

- [ ] 4.1 Implement 5-tab navigation shell with cyberpunk floating tab bar
  - **Do**:
    1. Create `src/app/(tabs)/_layout.tsx` with Expo Router `Tabs` component
    2. 5 tabs: Home (index), Podcasts (podcasts/index), Search (search), Newsletters (newsletters/index), Profile (profile)
    3. Style tab bar: translucent dark bg (#0A0A0F/90%), floating with border radius, neon cyan active indicator, muted gray inactive, 48px+ touch targets
    4. Icons from Ionicons: home-outline, headset-outline, search-outline, newspaper-outline, person-outline
    5. Active tab: cyan icon + label text; inactive: gray icon only
    6. Tab bar positioned with `position: absolute`, `bottom: 0` for floating effect
    7. Create placeholder screens for each tab (minimal, just ScreenLayout + title)
  - **Files**: `apps/mobile/src/app/(tabs)/_layout.tsx`, `apps/mobile/src/app/(tabs)/index.tsx`, `apps/mobile/src/app/(tabs)/podcasts/index.tsx`, `apps/mobile/src/app/(tabs)/search.tsx`, `apps/mobile/src/app/(tabs)/newsletters/index.tsx`, `apps/mobile/src/app/(tabs)/profile.tsx`
  - **Done when**: All 5 tabs render with correct icons, active states, floating style
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): implement 5-tab navigation with cyberpunk floating tab bar`
  - _Requirements: FR-3, AC-29.1 through AC-29.7_
  - _Design: Navigation Types, Screen Inventory_

- [ ] 4.2 Implement Home - Daily Digest Feed screen
  - **Do**:
    1. Create `src/features/digest/DigestFeed.tsx`: FlatList rendering DigestCard components. Pull-to-refresh via usePullToRefresh. Horizontal CategoryChip scroll at top. Empty state when no digests.
    2. Update `src/app/(tabs)/index.tsx` to render DigestFeed inside ScreenLayout
    3. Wire to digestStore: fetchDigests on mount, refresh action, pagination via onEndReached
    4. Category filter chips: All, AI, ML, Web, Mobile, Security, Data (hardcoded categories for now)
    5. Tap DigestCard navigates to `/digest/[id]` via `router.push`
    6. Create route `src/app/digest/[id].tsx` as placeholder
  - **Files**: `apps/mobile/src/features/digest/DigestFeed.tsx`, `apps/mobile/src/app/(tabs)/index.tsx`, `apps/mobile/src/app/digest/[id].tsx`
  - **Done when**: Feed renders cards; pull-to-refresh works; category chips filter; tap navigates
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): implement daily digest feed with cards, filters, pull-to-refresh`
  - _Requirements: FR-4, AC-7.1 through AC-7.8_
  - _Design: Data Flow (Digest Feed Loading)_

- [ ] 4.3 Implement Digest Detail view
  - **Do**:
    1. Create `src/features/digest/DigestDetail.tsx`: ScrollView with full article content. Title (h1), source attribution with link, reading time estimate, summary + items. Code blocks in JetBrains Mono. Share button triggers native share. Bookmark action with visual feedback (cyan fill toggle).
    2. Update `src/app/digest/[id].tsx` to render DigestDetail, fetch via `api.getDigest(id)` using route params
    3. Back navigation via router.back() or header back button
    4. Create `src/features/shared/ShareSheet.tsx`: wraps `Share.share()` from react-native with title + url
  - **Files**: `apps/mobile/src/features/digest/DigestDetail.tsx`, `apps/mobile/src/app/digest/[id].tsx`, `apps/mobile/src/features/shared/ShareSheet.tsx`
  - **Done when**: Full digest renders; share works; bookmark toggles; code blocks styled
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): implement digest detail view with share and bookmark`
  - _Requirements: FR-22, AC-8.1 through AC-8.6_
  - _Design: Screen Inventory (screen 6)_

- [ ] 4.4 [VERIFY] Quality checkpoint: feed + detail type check
  - **Do**: Run type check after P0 screen work
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5` exits 0
  - **Done when**: Zero type errors
  - **Commit**: `chore(mobile): pass P0 screens quality checkpoint` (only if fixes needed)

- [ ] 4.5 Implement Mini Player with gorhom/bottom-sheet
  - **Do**:
    1. Create `src/features/podcast/MiniPlayer.tsx`: 64px bar with episode art thumbnail (40px), truncated title (1 line), play/pause button. Tap handler calls audioStore.expandPlayer()
    2. Integrate into `src/app/(tabs)/_layout.tsx`: render BottomSheet with snap points [64, "95%"]. When audioStore.currentEpisode is null, hide completely. Content switches between MiniPlayer (collapsed) and FullPlayer (expanded) based on audioStore.isExpanded.
    3. Swipe-up gesture handled by BottomSheet natively
    4. Mini player positioned above tab bar (absolute positioning)
    5. Visible across all tab screens when audio playing
  - **Files**: `apps/mobile/src/features/podcast/MiniPlayer.tsx`, `apps/mobile/src/app/(tabs)/_layout.tsx` (update)
  - **Done when**: Mini player shows when episode loaded; tap expands; collapse returns to mini bar
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): implement mini player with bottom sheet expand/collapse`
  - _Requirements: FR-6, AC-11.1 through AC-11.6_
  - _Design: Mini Player / Full Player State Sync_

- [ ] 4.6 Implement Full Podcast Player
  - **Do**:
    1. Create `src/features/podcast/FullPlayer.tsx`: Large episode art (60-70% width) with NeonBorder. Background gradient with cyberpunk tint. Play/Pause center (48px+), skip forward/back 15s flanking. Elapsed/remaining time. Secondary row: speed selector, sleep timer placeholder, bookmark, share, transcript toggle.
    2. Create `src/features/podcast/WaveformSeek.tsx`: Seek bar component (simplified waveform visual using bars). Touch/drag to seek via PanGestureHandler. Shows elapsed/buffered/remaining.
    3. Speed selector: 0.5x, 1x, 1.25x, 1.5x, 2x pills. Active shows cyan accent.
    4. Wire all controls to audioStore actions
    5. Transcript toggle navigates to `/transcript/[episodeId]`
    6. Create `src/app/transcript/[episodeId].tsx` placeholder
  - **Files**: `apps/mobile/src/features/podcast/FullPlayer.tsx`, `apps/mobile/src/features/podcast/WaveformSeek.tsx`, `apps/mobile/src/app/transcript/[episodeId].tsx`
  - **Done when**: All player controls functional; speed selector works; seek bar drags; art displays
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): implement full podcast player with seek bar and speed control`
  - _Requirements: FR-5, AC-10.1 through AC-10.8_
  - _Design: Full-Screen Player Design_

- [ ] 4.7 Implement Splash screen with cyberpunk loading
  - **Do**:
    1. Update `src/app/_layout.tsx` root layout: while fonts loading, show splash view with deep black bg (#0A0A0F), centered app logo/title (GlitchText "AI DIGEST"), Scanline overlay, PulsingDot loading indicator (cyan). Auto-navigate based on auth state + onboarding state when ready.
    2. Navigation logic: if first launch -> onboarding; if not logged in -> auth/login; else -> (tabs)
    3. Add provider wrappers: GestureHandlerRootView, BottomSheetModalProvider, QueryClientProvider
  - **Files**: `apps/mobile/src/app/_layout.tsx` (update)
  - **Done when**: Splash renders with effects; transitions to correct screen based on state
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): implement cyberpunk splash screen with conditional navigation`
  - _Requirements: FR-7, AC-3.1 through AC-3.6_
  - _Design: Screen Inventory (screen 1)_

- [ ] 4.8 [VERIFY] Quality checkpoint: P0 screens complete
  - **Do**: Run full type check on mobile package
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5` exits 0
  - **Done when**: All P0 screens compile with zero type errors
  - **Commit**: `chore(mobile): pass P0 screens complete checkpoint` (only if fixes needed)

---

## Phase 5: P1 Screens (Auth + Onboarding + Episodes + Search + Newsletter + Profile + Admin + Notifications + Error/Empty States)

- [ ] 5.1 Implement Auth screens (Login + Register)
  - **Do**:
    1. Create `src/app/(auth)/login.tsx`: ScreenLayout with cyberpunk title, email Input, password Input, primary Button "Log In". On submit: call api.login() with X-Client-Type mobile, store token in SecureStore via authStore, navigate to (tabs).
    2. Create `src/app/(auth)/register.tsx`: Similar form with email + password + confirm password. Call api.register(), then auto-login.
    3. Create `src/app/(auth)/_layout.tsx`: Stack layout for auth screens
    4. Handle 401 errors inline (show error message below form)
  - **Files**: `apps/mobile/src/app/(auth)/_layout.tsx`, `apps/mobile/src/app/(auth)/login.tsx`, `apps/mobile/src/app/(auth)/register.tsx`
  - **Done when**: Login stores JWT; register creates account; error states display
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): implement login and register screens with JWT auth`
  - _Requirements: FR-22_
  - _Design: Auth Strategy_

- [ ] 5.2 Implement Onboarding flow (3 screens + pagination)
  - **Do**:
    1. Create `src/app/(onboarding)/_layout.tsx`: Stack layout
    2. `src/app/(onboarding)/welcome.tsx`: Hero graphic placeholder, tagline "Your AI-curated tech digest", "Get Started" primary CTA, "Skip" secondary. Pagination dots (1/3).
    3. `src/app/(onboarding)/topics.tsx`: Grid of TopicChip components. At least 8 topics: AI, Machine Learning, Web Dev, Mobile, Security, Data Science, DevOps, Cloud. Min 1 selected to enable "Next". Pagination dots (2/3).
    4. `src/app/(onboarding)/notifications.tsx`: Push notification toggle (requests permission), email input with validation, frequency selector (daily/weekly). "Done" CTA navigates to (tabs). All optional. Pagination dots (3/3).
    5. Save preferences to preferencesStore + AsyncStorage on completion
    6. Create `src/features/onboarding/WelcomeHero.tsx`, `src/features/onboarding/TopicSelector.tsx`, `src/features/onboarding/NotificationSetup.tsx`
  - **Files**: `apps/mobile/src/app/(onboarding)/_layout.tsx`, `apps/mobile/src/app/(onboarding)/welcome.tsx`, `apps/mobile/src/app/(onboarding)/topics.tsx`, `apps/mobile/src/app/(onboarding)/notifications.tsx`, `apps/mobile/src/features/onboarding/WelcomeHero.tsx`, `apps/mobile/src/features/onboarding/TopicSelector.tsx`, `apps/mobile/src/features/onboarding/NotificationSetup.tsx`
  - **Done when**: 3-screen flow works; topics persist; skip works; shown only on first launch
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): implement onboarding flow with topic selection and notifications`
  - _Requirements: FR-7, AC-4.1 through AC-6.5_
  - _Design: Screen Inventory (screens 2-4)_

- [ ] 5.3 [VERIFY] Quality checkpoint: auth + onboarding
  - **Do**: Run type check
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5` exits 0
  - **Done when**: Zero type errors
  - **Commit**: `chore(mobile): pass auth+onboarding quality checkpoint` (only if fixes needed)

- [ ] 5.4 Implement Episode List and Transcript View
  - **Do**:
    1. Create `src/features/podcast/EpisodeList.tsx`: FlatList of EpisodeRow components. Sort toggle (newest/oldest). Currently playing episode highlighted with cyan accent. Play button per row starts playback via audioStore.
    2. Update `src/app/(tabs)/podcasts/index.tsx` to render EpisodeList
    3. Create `src/features/podcast/TranscriptView.tsx`: Speaker labels with color per speaker, timestamps (tap to seek), auto-scroll to current segment based on audioStore.currentTime, in-transcript search with highlight. Chat-bubble layout per speaker.
    4. Update `src/app/transcript/[episodeId].tsx` to render TranscriptView, fetch episode + transcript data
  - **Files**: `apps/mobile/src/features/podcast/EpisodeList.tsx`, `apps/mobile/src/app/(tabs)/podcasts/index.tsx`, `apps/mobile/src/features/podcast/TranscriptView.tsx`, `apps/mobile/src/app/transcript/[episodeId].tsx`
  - **Done when**: Episodes list; sort works; play starts audio; transcript syncs with playback
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): implement episode list and synced transcript view`
  - _Requirements: FR-12, AC-9.1 through AC-9.5, AC-12.1 through AC-12.5_
  - _Design: Screen Inventory (screens 7, 10)_

- [ ] 5.5 Implement Search Overlay
  - **Do**:
    1. Create `src/features/search/SearchOverlay.tsx`: Full-screen with auto-focused Input (search variant). Debounced 300ms via useDebounce. Results grouped by type (Digests, Podcasts, Newsletters) with section headers. Filter chips: content type, date range, topic. Recent searches from searchStore (persisted).
    2. Create `src/features/search/SearchResults.tsx`: SectionList rendering grouped results
    3. Update `src/app/(tabs)/search.tsx` to render SearchOverlay
    4. Empty results state with suggestion text
  - **Files**: `apps/mobile/src/features/search/SearchOverlay.tsx`, `apps/mobile/src/features/search/SearchResults.tsx`, `apps/mobile/src/app/(tabs)/search.tsx`
  - **Done when**: Search debounces; results grouped; filter chips work; recent searches persist
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): implement search overlay with grouped results and filters`
  - _Requirements: FR-9, AC-19.1 through AC-19.6, NFR-15_
  - _Design: Screen Inventory (screen 13)_

- [ ] 5.6 Implement Newsletter Archive + Reader
  - **Do**:
    1. Create `src/features/newsletter/NewsletterArchive.tsx`: Chronological FlatList of newsletter issues (reusing digest data filtered by type). Subscribe/unsubscribe toggle with email input. Frequency preference selector.
    2. Update `src/app/(tabs)/newsletters/index.tsx` to render NewsletterArchive
    3. Create `src/features/newsletter/NewsletterReader.tsx`: Full content renderer with cyberpunk theme. Inline images. External links open in in-app browser (`Linking.openURL` or WebBrowser). Share + bookmark actions.
    4. Create `src/app/(tabs)/newsletters/[id].tsx` to render NewsletterReader
  - **Files**: `apps/mobile/src/features/newsletter/NewsletterArchive.tsx`, `apps/mobile/src/app/(tabs)/newsletters/index.tsx`, `apps/mobile/src/features/newsletter/NewsletterReader.tsx`, `apps/mobile/src/app/(tabs)/newsletters/[id].tsx`
  - **Done when**: Archive lists issues; subscribe toggle works; reader renders content; links open
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): implement newsletter archive and reader`
  - _Requirements: FR-8, AC-13.1 through AC-14.5_
  - _Design: Screen Inventory (screens 11-12)_

- [ ] 5.7 [VERIFY] Quality checkpoint: P1 screens batch 1
  - **Do**: Run type check
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5` exits 0
  - **Done when**: Zero type errors
  - **Commit**: `chore(mobile): pass P1 batch 1 quality checkpoint` (only if fixes needed)

- [ ] 5.8 Implement Profile screen
  - **Do**:
    1. Create `src/features/profile/ProfileView.tsx`: Profile section (avatar placeholder, display name, email from authStore). Topic preferences editor reusing TopicChip grid. Notification toggles (push, email, frequency). Appearance section (dark theme indicator). App info (version from app.json, privacy/terms links). Sign out with confirmation Alert.
    2. Create `src/features/profile/TopicEditor.tsx`: Reusable topic chip selector (same as onboarding but edit mode)
    3. Update `src/app/(tabs)/profile.tsx` to render ProfileView
  - **Files**: `apps/mobile/src/features/profile/ProfileView.tsx`, `apps/mobile/src/features/profile/TopicEditor.tsx`, `apps/mobile/src/app/(tabs)/profile.tsx`
  - **Done when**: Profile displays user info; topics editable; toggles functional; sign out works
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): implement profile screen with preferences management`
  - _Requirements: FR-14, AC-20.1 through AC-20.6_
  - _Design: Screen Inventory (screen 14)_

- [ ] 5.9 Implement Admin screens (Config, Sources, Pipeline Monitor, Session Detail)
  - **Do**:
    1. Create `src/app/admin/_layout.tsx`: Stack layout with admin auth guard (check authStore.isAdmin, redirect if not)
    2. Create `src/features/admin/ConfigDashboard.tsx`: Grouped settings using SettingsGroup. Sections: Sources, Processing, Delivery, Schedule. Toggle switches, text inputs with glow focus. Save action with green flash feedback. Reset to defaults with confirmation.
    3. Create `src/features/admin/SourceManager.tsx`: FlatList of sources with name, type, status indicator (green/amber/magenta). Add source form. Swipe-to-delete. Status indicators using StatusBadge.
    4. Create `src/features/admin/PipelineMonitor.tsx`: Timeline of pipeline runs with StatusBadge (running=pulsing cyan, success=green, failed=magenta, queued=purple). Auto-refresh every 30s. Filter by status. Tap expands to session detail.
    5. Create `src/features/admin/SessionDetail.tsx`: Step-by-step execution log. Each step: name, status, duration, input/output summary. Error details in monospace. Re-run action button.
    6. Create route files: `src/app/admin/config.tsx`, `src/app/admin/sources.tsx`, `src/app/admin/pipeline/index.tsx`, `src/app/admin/pipeline/[runId].tsx`
  - **Files**: `apps/mobile/src/app/admin/_layout.tsx`, `apps/mobile/src/app/admin/config.tsx`, `apps/mobile/src/app/admin/sources.tsx`, `apps/mobile/src/app/admin/pipeline/index.tsx`, `apps/mobile/src/app/admin/pipeline/[runId].tsx`, `apps/mobile/src/features/admin/ConfigDashboard.tsx`, `apps/mobile/src/features/admin/SourceManager.tsx`, `apps/mobile/src/features/admin/PipelineMonitor.tsx`, `apps/mobile/src/features/admin/SessionDetail.tsx`
  - **Done when**: Config saves; sources CRUD works; pipeline status auto-refreshes; session detail shows steps
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): implement admin screens for config, sources, and pipeline`
  - _Requirements: FR-10, FR-11, AC-15.1 through AC-18.5_
  - _Design: Screen Inventory (screens 15-18)_

- [ ] 5.10 Implement Notifications, Error screen, and Empty states
  - **Do**:
    1. Create `src/features/shared/NotificationCenter.tsx`: Chronological FlatList with icon, title, message, timestamp. Unread indicator (cyan dot Badge). Tap navigates to relevant content. "Mark all read" action. Swipe-to-dismiss. Developer notifications distinguished by magenta accent.
    2. Create `src/app/notifications.tsx` route
    3. Create `src/features/shared/ErrorScreen.tsx`: Cyberpunk error illustration placeholder, error message (plain language), "Retry" primary CTA, "Go Home" secondary. Works offline (no network deps for rendering).
    4. Create `src/app/error.tsx` route
    5. Update `EmptyState.tsx` composite with 4 concrete variants: digest ("No digest today"), podcast ("No episodes yet"), newsletter ("No issues yet"), search ("No results"). Each with unique illustration placeholder and appropriate CTA.
  - **Files**: `apps/mobile/src/features/shared/NotificationCenter.tsx`, `apps/mobile/src/app/notifications.tsx`, `apps/mobile/src/features/shared/ErrorScreen.tsx`, `apps/mobile/src/app/error.tsx`, `apps/mobile/src/design-system/composites/EmptyState.tsx` (update)
  - **Done when**: Notifications list; error screen retries; all 4 empty states render correctly
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): implement notifications, error screen, and empty states`
  - _Requirements: FR-13, FR-17, FR-18, AC-21.1 through AC-22.5, AC-23.1 through AC-23.6_
  - _Design: Screen Inventory (screens 19-24)_

- [ ] 5.11 [VERIFY] Quality checkpoint: all P1 screens
  - **Do**: Run full type check on mobile and web packages
  - **Verify**: `pnpm check-types 2>&1 | tail -10` exits 0
  - **Done when**: Zero type errors across entire project
  - **Commit**: `chore: pass all P1 screens quality checkpoint` (only if fixes needed)

---

## Phase 6: P2 Screens (Summary + Desktop Responsive + Email Template)

- [ ] 6.1 Implement Weekly/Monthly Summary screen
  - **Do**:
    1. Create `src/features/digest/DigestSummary.tsx`: Top articles ranked list. Stats section: articles read, podcasts listened, time spent (placeholder data for now). Topic trend visualization using colored bars (NativeWind styled View bars). Toggle between weekly/monthly views. Share summary action.
    2. Create `src/app/summary.tsx` route
  - **Files**: `apps/mobile/src/features/digest/DigestSummary.tsx`, `apps/mobile/src/app/summary.tsx`
  - **Done when**: Stats render; toggle switches views; share works
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5`
  - **Commit**: `feat(mobile): implement weekly/monthly summary screen`
  - _Requirements: FR-16, AC-25.1 through AC-25.5_
  - _Design: Screen Inventory (screen 26)_

- [ ] 6.2 Implement desktop responsive layouts (1024px+ breakpoints)
  - **Do**:
    1. Use `useWindowDimensions` to detect 1024px+ breakpoint
    2. Create responsive variants: Home becomes master-detail (feed left, detail right). Tab bar becomes sidebar nav. Podcast player becomes sidebar widget instead of overlay.
    3. Apply via NativeWind responsive classes or conditional rendering
    4. Test with web export: `npx expo export:web`
  - **Files**: `apps/mobile/src/app/(tabs)/_layout.tsx` (update), `apps/mobile/src/features/digest/DigestFeed.tsx` (update), `apps/mobile/src/features/podcast/FullPlayer.tsx` (update)
  - **Done when**: 1024px+ shows multi-column; sidebar replaces tabs; player as widget
  - **Verify**: `npx expo export:web 2>&1 | tail -5` exits 0
  - **Commit**: `feat(mobile): add desktop responsive layouts for 1024px+ breakpoint`
  - _Requirements: FR-20, FR-21, AC-27.1 through AC-28.6, NFR-14_
  - _Design: Screen Inventory (screens 30-31)_

- [ ] 6.3 Implement cyberpunk email newsletter template
  - **Do**:
    1. Create `apps/mobile/src/email-template/newsletter.html`: 600px max width, inline CSS, dark-first design. Off-black #0D0D14 (not #000000), off-white #F0F0F5 (not #FFFFFF). Meta tags: color-scheme, supported-color-schemes. Neon accents for headings, CTAs, dividers. System fonts only. Light-mode fallback via `@media (prefers-color-scheme: light)`.
    2. Structure: header with logo, digest title, content sections with article summaries, CTA buttons (cyan), footer with unsubscribe link
    3. Table-based layout for Outlook compatibility
  - **Files**: `apps/mobile/src/email-template/newsletter.html`
  - **Done when**: Template renders with dark theme; no pure black/white; meta tags present
  - **Verify**: `grep -c "color-scheme" apps/mobile/src/email-template/newsletter.html` returns > 0
  - **Commit**: `feat(mobile): implement cyberpunk email newsletter template`
  - _Requirements: FR-19, AC-26.1 through AC-26.8_
  - _Design: Email Newsletter Design_

- [ ] 6.4 [VERIFY] Quality checkpoint: P2 screens + web export
  - **Do**: Run type check and verify web export builds
  - **Verify**: `pnpm --filter @ai-digest/mobile check-types 2>&1 | tail -5` exits 0 && `cd apps/mobile && npx expo export:web 2>&1 | tail -5`
  - **Done when**: Types pass; web export succeeds
  - **Commit**: `chore(mobile): pass P2 screens quality checkpoint` (only if fixes needed)

---

## Phase 7: Stitch Design Generation

- [ ] 7.1 Create Stitch project and generate 3 anchor screens (Pro model)
  - **Do**:
    1. Call `create_project({ title: "AI Digest Cyberpunk Mobile" })` via Stitch MCP
    2. Store returned project name/ID
    3. Generate 3 anchor screens with GEMINI_3_PRO model:
       - Screen 1 (Splash): Design system prefix + "Splash/loading screen. Centered app title 'AI DIGEST' in glitch-effect monospace text. Deep black background with faint horizontal scanline overlay. Neon cyan pulsing loading indicator below title. Minimal, dramatic, OLED-friendly."
       - Screen 2 (Daily Digest Feed): Design system prefix + "Daily AI digest feed screen. Top: horizontal scrollable category filter chips (cyan border on selected). Below: vertically scrollable card list. Each card: elevated dark surface, title in bold monospace, source tag in purple pill, 2-line summary in regular text, timestamp. Pull-to-refresh indicator. Bottom: floating 5-tab bar with neon cyan active tab."
       - Screen 3 (Full Podcast Player): Design system prefix + "Full-screen podcast player. Large square episode artwork (60% width) with neon cyan glow border. Below artwork: episode title, show name. Waveform-style seek bar with elapsed/remaining time. Large play/pause button center (48px+), skip back/forward 15s flanking. Speed selector pills (0.5x-2x). Secondary row: sleep timer, bookmark, share, transcript icons. Dark gradient background with subtle cyan tint."
    4. Use `get_screen` to retrieve each generated screen
  - **Files**: None (Stitch MCP operations)
  - **Done when**: 3 screens generated and viewable in Stitch project
  - **Verify**: Call `list_screens` on the project and confirm 3 screens exist
  - **Commit**: `docs(mobile): generate 3 anchor screen designs via Stitch Pro`
  - _Requirements: FR-1, AC-1.1, AC-1.2, AC-1.4_
  - _Design: Stitch MCP Workflow, Generation Order_

- [ ] 7.2 Generate P0 + core screens (Flash model, 5 screens)
  - **Do**: Generate with GEMINI_3_FLASH + design system prefix:
    1. Digest Detail: Article detail view with full content, code blocks, back nav, share/bookmark
    2. Mini Player: Persistent 64px bar above tab bar with episode art, truncated title, play/pause
    3. Tab Bar Shell: 5-tab floating bar with icons, neon active state, translucent dark bg
    4. Episode List: Podcast episodes with thumbnails, duration, play buttons, sort toggle
    5. Search Overlay: Full-screen search with auto-focused input, grouped results by type, filter chips
  - **Files**: None (Stitch MCP operations)
  - **Done when**: 5 additional screens generated
  - **Verify**: Call `list_screens` and confirm 8 total screens
  - **Commit**: `docs(mobile): generate 5 core screen designs via Stitch Flash`
  - _Requirements: FR-1, AC-1.3_
  - _Design: Generation Order Phase 2_

- [ ] 7.3 Generate P1 feature screens (Flash model, 8 screens)
  - **Do**: Generate with GEMINI_3_FLASH + design system prefix:
    1. Onboarding Welcome: Hero graphic, tagline, Get Started CTA, Skip, pagination dots
    2. Onboarding Topics: Grid of selectable topic chips with neon glow on selected
    3. Onboarding Notifications: Toggle switches, email input, frequency selector, Done CTA
    4. Newsletter Archive: Chronological issue list, subscribe toggle
    5. Newsletter Reader: Full article with cyberpunk styling, inline images
    6. User Profile: Avatar, preferences, notification toggles, sign out
    7. Notification Center: Chronological list with unread dots, swipe actions
    8. Transcript View: Speaker-labeled segments, timestamps, auto-scroll highlighting
  - **Files**: None (Stitch MCP operations)
  - **Done when**: 8 screens generated
  - **Verify**: Call `list_screens` and confirm 16 total screens
  - **Commit**: `docs(mobile): generate 8 P1 feature screen designs via Stitch Flash`
  - _Requirements: FR-1, AC-1.3_
  - _Design: Generation Order Phase 3_

- [ ] 7.4 Generate admin + edge case + desktop + email screens (Flash model, 10 screens)
  - **Do**: Generate with GEMINI_3_FLASH + design system prefix:
    1. Config Dashboard: Grouped settings with toggles and inputs
    2. Source Management: Source list with status indicators, add form
    3. Pipeline Monitor: Timeline with status badges (pulsing/green/magenta)
    4. Session Detail: Step log with timestamps, error details
    5. Empty State - Digest: Illustration + "No digest today"
    6. Empty State - Search: Illustration + "No results"
    7. Error/404 Screen: Glitch illustration, retry/go home buttons
    8. Weekly Summary: Stats, trend bars, weekly/monthly toggle
    9. Desktop Dashboard (DESKTOP type): Multi-column with sidebar nav
    10. Email Template (AGNOSTIC type): 600px dark newsletter layout
  - **Files**: None (Stitch MCP operations)
  - **Done when**: All 26 screens generated
  - **Verify**: Call `list_screens` and confirm 26 total screens. Total generations <= 52.
  - **Commit**: `docs(mobile): complete all 26 Stitch screen designs`
  - _Requirements: FR-1, AC-1.3, AC-1.5, NFR-9_
  - _Design: Generation Order Phases 4-7_

---

## Phase 8: Functional Validation

- [ ] 8.1 Build and validate on iOS Simulator
  - **Do**:
    1. Start Next.js dev server: `pnpm --filter @ai-digest/web dev`
    2. Start Expo dev server: `pnpm --filter @ai-digest/mobile ios`
    3. Walk through all flows on iOS Simulator:
       - Splash screen loads with fonts, transitions to correct screen
       - Onboarding: 3 screens, topic selection, skip works
       - Login with real credentials via Bearer token
       - Home feed: cards render with real digest data from API
       - Digest detail: full content renders, share works
       - Podcast: episode list loads, tap plays audio, mini player appears
       - Mini player: persists across tabs, expands to full player
       - Full player: seek bar, speed control, skip controls work
       - Search: debounced results, filter chips
       - Newsletter archive: issues list, reader renders
       - Profile: preferences display, sign out works
       - Admin: pipeline monitor, config, sources (if admin)
       - Notifications: list renders
       - Error state: kill API server, verify error screen
       - Empty state: verify when no data
    4. Capture screenshots via `xcrun simctl io booted screenshot` for each major screen
  - **Files**: None (validation only)
  - **Done when**: All flows work end-to-end on real simulator with real API
  - **Verify**: Screenshots captured for all P0 screens; `ls *.png | wc -l` shows >= 10 screenshots
  - **Commit**: `feat(mobile): validate all flows on iOS simulator`
  - _Requirements: All P0/P1 FRs_
  - _Design: Testing Strategy, Evidence Capture Checklist_

- [ ] 8.2 Validate API integration with Bearer tokens (cURL proof)
  - **Do**:
    1. Start web server
    2. Login via cURL with X-Client-Type: mobile, capture JWT token
    3. Call protected endpoints with Bearer token: `/api/auth/me`, `/api/admin/stats`, `/api/admin/pipeline/status`
    4. Verify 401 when no token, 403 when non-admin token on admin routes
    5. Document all cURL commands and responses
  - **Files**: None (validation only)
  - **Done when**: All API calls succeed with Bearer token; auth errors return correct codes
  - **Verify**: `curl -s -H "Authorization: Bearer $TOKEN" localhost:3000/api/auth/me | jq .success` returns true
  - **Commit**: None (validation only)
  - _Requirements: FR-22_
  - _Design: Auth Strategy_

- [ ] 8.3 Validate audio background playback
  - **Do**:
    1. Play an episode in the simulator
    2. Press home button (background the app)
    3. Verify audio continues playing
    4. Check lock screen / notification controls appear
    5. Use controls to pause/play/skip from lock screen
    6. Return to app, verify state is synced
  - **Files**: None (validation only)
  - **Done when**: Audio plays in background; lock screen controls work; state syncs on foreground
  - **Verify**: Audio continues when app backgrounded (manual observation on simulator)
  - **Commit**: None (validation only)
  - _Requirements: NFR-7, AC-10.7, AC-10.8_
  - _Design: Audio Architecture_

---

## Phase 9: Visual Regression Baselines (Playwright)

- [ ] 9.1 Set up Playwright for web build visual regression
  - **Do**:
    1. Install Playwright in mobile package: `pnpm --filter @ai-digest/mobile add -D @playwright/test`
    2. Create `apps/mobile/playwright.config.ts`: projects for mobile viewport (375x812) and desktop viewport (1440x900), webServer pointing to `npx serve dist -l 8080`
    3. Create `apps/mobile/e2e/` directory for test files
    4. Add script to package.json: `"test:e2e": "npx playwright test"`, `"test:e2e:update": "npx playwright test --update-snapshots"`
  - **Files**: `apps/mobile/package.json`, `apps/mobile/playwright.config.ts`, `apps/mobile/e2e/`
  - **Done when**: Playwright config created; scripts added
  - **Verify**: `pnpm --filter @ai-digest/mobile exec playwright --version`
  - **Commit**: `feat(mobile): set up Playwright for visual regression testing`
  - _Requirements: NFR-13_
  - _Design: Testing Strategy (Visual Regression)_

- [ ] 9.2 Create visual regression baseline tests for all screens
  - **Do**:
    1. Build web: `cd apps/mobile && npx expo export:web`
    2. Create `e2e/visual-regression.spec.ts` with screenshot tests for each route:
       - Home feed (mobile + desktop viewports)
       - Digest detail
       - Episode list
       - Search (empty state)
       - Newsletter archive
       - Profile
       - Login
       - Onboarding welcome
       - Error screen
       - Empty states
    3. Mask dynamic content (timestamps, IDs) with `mask` option
    4. Disable animations via `prefers-reduced-motion` media query
    5. Run `npx playwright test --update-snapshots` to capture baselines
  - **Files**: `apps/mobile/e2e/visual-regression.spec.ts`
  - **Done when**: Baseline screenshots captured for all routes in both viewports
  - **Verify**: `ls apps/mobile/e2e/visual-regression.spec.ts-snapshots/ | wc -l` shows >= 10 baselines
  - **Commit**: `test(mobile): capture visual regression baselines for all screens`
  - _Requirements: NFR-13_
  - _Design: Testing Strategy (Playwright steps)_

- [ ] 9.3 [VERIFY] Quality checkpoint: Playwright baselines pass
  - **Do**: Run Playwright tests against baselines (should all pass since we just captured them)
  - **Verify**: `cd apps/mobile && npx expo export:web && npx playwright test 2>&1 | tail -10`
  - **Done when**: All visual regression tests pass
  - **Commit**: `chore(mobile): pass visual regression quality checkpoint` (only if fixes needed)

---

## Phase 10: Quality Gates

- [ ] 10.1 [VERIFY] Full local CI: type check + web export + Playwright
  - **Do**: Run complete quality suite
  - **Verify**: All commands pass:
    - `pnpm check-types 2>&1 | tail -10` (root turbo type check)
    - `cd apps/mobile && npx expo export:web 2>&1 | tail -5` (web build)
    - `cd apps/mobile && npx playwright test 2>&1 | tail -10` (visual regression)
  - **Done when**: All commands exit 0
  - **Commit**: `chore(mobile): pass full local CI suite` (if fixes needed)

- [ ] 10.2 Create PR and verify CI
  - **Do**:
    1. Verify current branch is a feature branch: `git branch --show-current`
    2. If on default branch, STOP and alert user
    3. Push branch: `git push -u origin <branch-name>`
    4. Create PR: `gh pr create --title "feat(mobile): cyberpunk mobile app with design system, 26 screens, audio player" --body "<summary>"`
    5. Monitor CI: `gh pr checks --watch`
  - **Verify**: `gh pr checks` shows all green
  - **Done when**: All CI checks pass; PR ready for review
  - **Commit**: None

---

## Phase 11: PR Lifecycle

- [ ] 11.1 [VERIFY] CI pipeline passes
  - **Do**: Verify GitHub Actions/CI passes after push
  - **Verify**: `gh pr checks` shows all green
  - **Done when**: CI pipeline passes
  - **Commit**: None

- [ ] 11.2 [VERIFY] AC checklist verification
  - **Do**: Programmatically verify each acceptance criteria:
    1. AC-1.*: Stitch screens generated (list_screens count = 26)
    2. AC-2.*: Design tokens defined (grep tailwind.config.js for all 11 colors, 3 font families, shadow definitions)
    3. AC-3.*: Splash screen component exists with Scanline + PulsingDot
    4. AC-7.*: DigestFeed component with FlatList, pull-to-refresh, CategoryChip
    5. AC-10.*: FullPlayer component with seek, speed, skip controls
    6. AC-11.*: MiniPlayer with BottomSheet snap points
    7. AC-29.*: Tab layout with 5 tabs, Ionicons, 48px targets
    8. NFR-1: Color tokens use WCAG-compliant values (grep for #3388FF instead of #0066FF)
    9. NFR-3: useReducedMotion hook exists and used by all effects
    10. NFR-7: TrackPlayer service registered with background capabilities
  - **Verify**: Series of grep/file-existence checks confirming implementation
  - **Done when**: All acceptance criteria confirmed met
  - **Commit**: None

---

## Notes

- **Quality-first approach**: Design system (Phase 2) is thorough before any screens. Each primitive polished with all variants, accessibility, reduced-motion.
- **Server changes isolated**: Phase 3 tasks 3.1-3.3 modify `apps/web` only. All other tasks are in `apps/mobile`.
- **Stitch generation in Phase 7**: Deliberately after implementation so generated designs serve as comparison reference, not blockers. Can be moved earlier if desired.
- **Audio validation manual**: Task 8.3 requires manual observation on simulator. Cannot be fully automated but is the honest validation.
- **Newsletter assumption**: Newsletter archive reuses digest model (no separate table). If this proves incorrect, Task 5.6 will need adjustment.
- **P2 screens deferrable**: Phase 6 tasks (summary, desktop, email template) can be deferred without blocking the core experience.
- **Stitch budget**: 3 Pro + 23 Flash first pass + 26 revisions = 52 generations (13% of free tier).
- **POC shortcuts taken**: Empty state illustrations are placeholders (no real art). Stats in summary screen use placeholder data. Email template not tested in real email clients.
- **Production TODOs**: Real illustrations for empty/error states. Push notification infrastructure. Offline caching. Tablet layouts. CI/CD for mobile builds. App store submission config.
