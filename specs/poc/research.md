---
spec: poc
phase: research
created: 2026-02-07T14:30:00-05:00
---

# Research: AI Digest — Full UI/UX Redesign via Stitch MCP with Cyberpunk Dark Theme

## Executive Summary

Google Stitch MCP is confirmed available in our environment with 6 tools (create_project, get_project, list_projects, list_screens, get_screen, generate_screen_from_text) supporting MOBILE/DESKTOP/TABLET device types and Gemini 3 Pro/Flash models. The cyberpunk color palette is largely WCAG AA compliant except Electric Blue (#0066FF) which fails AA for normal text at 4.09:1 and must be adjusted. NativeWind v4/v5 supports CSS variable-based theming ideal for design tokens, and Expo provides first-party packages for JetBrains Mono and Space Mono fonts.

## 1. Stitch MCP Capabilities & API

### Available Tools (Verified in Environment)

| Tool | Parameters | Description |
|------|-----------|-------------|
| `create_project` | `title` (optional) | Create project container |
| `get_project` | `name` (required, format: `projects/{id}`) | Get project details |
| `list_projects` | `filter` (optional: `view=owned`, `view=shared`) | List accessible projects |
| `list_screens` | `projectId` (required) | List screens in project |
| `get_screen` | `projectId`, `screenId` (both required) | Get screen metadata |
| `generate_screen_from_text` | `projectId` (required), `prompt` (required), `deviceType` (optional), `modelId` (optional) | Generate screen from text |

### Device Types (Enum)

| Value | Description |
|-------|-------------|
| `DEVICE_TYPE_UNSPECIFIED` | Unspecified |
| `MOBILE` | Mobile device (default) |
| `DESKTOP` | Desktop device |
| `TABLET` | Tablet device |
| `AGNOSTIC` | Not tied to specific device |

### AI Models

| Model ID | Description | Notes |
|----------|-------------|-------|
| `GEMINI_3_FLASH` | Gemini 3 Flash | Default. Faster, 350 generations/month free |
| `GEMINI_3_PRO` | Gemini 3 Pro | Higher quality, 50 generations/month free |

### Generation Limits (Free Tier)

- **Standard Mode (Flash)**: 350 generations/month
- **Experimental Mode (Pro)**: 50 generations/month
- Total available: 400 generations/month

### Key Workflow Constraints

- Generation takes **several minutes**. DO NOT retry on timeout.
- Failed connections may still succeed -- use `get_screen` to check later.
- `output_components` may return follow-up suggestions; re-call with accepted suggestion.

### Design Consistency Strategy

**CRITICAL FINDING**: Our configured Stitch MCP server does NOT include the `extract_design_context` tool (available in the Kargatharaakash stitch-mcp variant). This means we cannot automatically extract "Design DNA" (colors, fonts, layout patterns) from generated screens.

**Workaround for Consistency**:
1. **Template Prompt Pattern**: Create a master prompt prefix defining the design language (colors, typography, spacing, effects) and prepend it to every generation prompt.
2. **Reference Previous Screens**: Include "consistent with the cyberpunk dark theme used in previous screens" in prompts.
3. **Batch Multi-Select** (via Stitch web UI): Select multiple screens and apply global style changes.
4. **Manual Design DNA**: Document extracted design tokens from first screen and embed in subsequent prompts.

**Recommended Prompt Structure**:
```
[DESIGN SYSTEM PREFIX]
Theme: Cyberpunk dark. Background: deep black (#0A0A0F).
Primary accent: neon cyan (#00FFFF). Secondary: hot magenta (#FF0066).
Success: neon green (#00FF88). Warning: amber (#FFAA00).
Typography: JetBrains Mono for headings, Inter for body.
Effects: Subtle neon glow borders on cards, scanline overlay on hero sections.
Spacing: 16px base grid. Corner radius: 8px (cards), 12px (buttons).

[SCREEN-SPECIFIC PROMPT]
Design a [specific screen description]...
```

### Generation Budget Planning (26 Screens)

| Category | Screens | First Pass | Revisions (est.) | Total Est. |
|----------|---------|-----------|-------------------|------------|
| Mobile screens | 20 | 20 | 20 | 40 |
| Desktop screens | 2 | 2 | 2 | 4 |
| Email template | 1 | 1 | 1 | 2 |
| Error/empty states | 3 | 3 | 3 | 6 |
| **Total** | **26** | **26** | **26** | **52** |

52 of 400 monthly generations = ~13% of free tier. Comfortable margin for iteration.

**Recommendation**: Use GEMINI_3_PRO for the first 2-3 screens to establish high-quality design direction, then switch to GEMINI_3_FLASH for remaining screens to conserve Pro quota.

Source: [Google Stitch Complete Guide](https://almcorp.com/blog/google-stitch-complete-guide-ai-ui-design-tool-2026/), [Stitch MCP GitHub](https://github.com/Kargatharaakash/stitch-mcp), [SOTAAZ Integration Guide](https://blog.sotaaz.com/post/stitch-mcp-integration-en), [Google Developers Blog](https://developers.googleblog.com/stitch-a-new-way-to-design-uis/)

---

## 2. Cyberpunk UI/UX Design Language

### Color Palette & WCAG Accessibility

Computed contrast ratios against background `#0A0A0F`:

| Color | Hex | Ratio | AA Normal (4.5:1) | AA Large (3:1) | AAA Normal (7:1) | AAA Large (4.5:1) |
|-------|-----|-------|-------------------|----------------|-------------------|-------------------|
| Neon Cyan | `#00FFFF` | 15.75:1 | PASS | PASS | PASS | PASS |
| Electric Blue | `#0066FF` | 4.09:1 | **FAIL** | PASS | FAIL | FAIL |
| Hot Magenta | `#FF0066` | 5.12:1 | PASS | PASS | FAIL | PASS |
| Neon Green | `#00FF88` | 14.73:1 | PASS | PASS | PASS | PASS |
| Purple | `#8B5CF6` | 4.66:1 | PASS | PASS | FAIL | PASS |
| White (body) | `#FFFFFF` | 19.75:1 | PASS | PASS | PASS | PASS |
| Light Gray (secondary) | `#A0A0B0` | 7.67:1 | PASS | PASS | PASS | PASS |

**ACTION REQUIRED**: Electric Blue `#0066FF` fails AA for normal text. Options:
1. Lighten to `#3388FF` (~5.5:1, passes AA) -- **recommended**
2. Use only for large text (headings 18pt+), icons, or decorative elements
3. Replace with a brighter blue like `#4D9FFF`

### Design System Components (from CYBERCORE CSS reference)

| Category | Components |
|----------|-----------|
| Core UI | Buttons, cards, inputs, tables, modals, progress bars |
| Effects | Glitch text, neon borders, scanlines, noise overlay, datastream, text glow |
| Accessibility | `prefers-reduced-motion` support, color-mix() for dynamic tints |

### Color Usage Guidelines

| Role | Color | Usage |
|------|-------|-------|
| Primary accent | Neon Cyan `#00FFFF` | CTAs, active states, key highlights |
| Danger/alert | Hot Magenta `#FF0066` | Errors, destructive actions, urgency |
| Success | Neon Green `#00FF88` | Confirmations, positive states, online |
| Interactive | Purple `#8B5CF6` | Links, secondary actions, tags |
| Info/decorative | Electric Blue `#3388FF` (adjusted) | Headers, icons, decorative borders |
| Warning | Amber `#FFAA00` | Warnings, pending states |
| Background (base) | Deep Black `#0A0A0F` | Primary background (OLED-friendly) |
| Background (elevated) | Dark Gray `#12121A` | Cards, elevated surfaces |
| Background (overlay) | Charcoal `#1A1A2E` | Modals, dropdowns |
| Body text | White `#FFFFFF` | Primary readable text |
| Secondary text | Light Gray `#A0A0B0` | Descriptions, metadata |

### Visual Effects Specification

| Effect | Implementation | Usage |
|--------|---------------|-------|
| Neon glow border | `box-shadow: 0 0 10px rgba(0,255,255,0.3)` | Cards, active inputs |
| Scanline overlay | CSS `repeating-linear-gradient` (2px lines, 5% opacity) | Hero sections, splash screen |
| Glitch transition | CSS keyframe with `clip-path` displacement | Page transitions, loading |
| Pulsing accent | CSS `animation: pulse` on glow intensity | Active/playing indicators |
| Noise texture | SVG filter `feTurbulence` at 3-5% opacity | Background texture layer |
| Text glow | `text-shadow: 0 0 8px currentColor` | Headings, emphasis |

**Accessibility**: ALL effects must respect `prefers-reduced-motion: reduce` and disable animations/glitch/pulse when enabled.

Source: [CYBERCORE CSS](https://dev.to/sebyx07/introducing-cybercore-css-a-cyberpunk-design-framework-for-futuristic-uis-2e6c), [Cyberpunk Neon Theme](https://github.com/Roboron3042/Cyberpunk-Neon), [Page Flows Cyberpunk Palette](https://pageflows.com/resources/cyberpunk-color-palette/), [Accessible Dark Theme Design](https://www.fourzerothree.in/p/scalable-accessible-dark-mode)

---

## 3. Mobile-First Design Patterns

### Touch Targets

| Platform | Minimum Size | Recommended |
|----------|-------------|-------------|
| Apple HIG | 44x44 pt | 48x48 pt for edge elements |
| Material Design | 48x48 dp | 48x48 dp |
| WCAG 2.5.5 | 44x44 CSS px | -- |
| Bottom nav items | 44-46px | 48px with 10px+ spacing |

### Bottom Tab Navigation (5 Tabs)

- Android enforces **max 5 tabs** in Material tab bar -- aligns with spec
- Expo Router provides `(tabs)/_layout.tsx` pattern with `Tabs` component
- Icon implementation: `@expo/vector-icons` Ionicons with `tabBarIcon` prop
- Floating tab bar: Use `tabBarStyle` with `position: 'absolute'`, `borderRadius`, and gradient backdrop

**Suggested 5 Tabs**:
1. Home (Daily Digest Feed)
2. Podcasts (Player/Library)
3. Search
4. Newsletter Archive
5. Profile/Settings

### Mini Player (Persistent Audio Bar)

Implementation pattern from Spotify-style React Native apps:
- Render **above** tab bar as absolute-positioned component at root navigation level
- Use `react-native-gesture-handler` + `react-native-reanimated` for swipe-up-to-expand
- `gorhom/bottom-sheet` for snap points (collapsed mini-player / expanded full-screen)
- `LinearGradient` for glass-like overlay blending into tab bar
- State management: Global audio context (Zustand or React Context) for play state across screens
- **Gotcha**: PanResponder conflicts with scroll views -- use gesture-handler library instead

### Card-Based Feed Layout

- De-saturate neon colors for card backgrounds (use 10-15% opacity tints)
- Dark gradient overlay on image cards for text readability
- Elevated surfaces: increment lightness per elevation level (`#0A0A0F` -> `#12121A` -> `#1A1A2E`)
- Standard card anatomy: image/icon + title + meta (date, duration) + action (play, bookmark)

### Onboarding Flow (3 Screens)

Best practices for progressive disclosure:
1. **Screen 1**: Value prop -- "Your AI-curated tech digest" (visual + tagline)
2. **Screen 2**: Topic selection -- Choose interests (AI, ML, Web, Mobile, etc.)
3. **Screen 3**: Delivery preferences -- Push notifications, email frequency
- Provide skip option for experienced users
- Use visual metaphors; minimize copy (users read ~20% of text)
- Pagination dots + "Next" CTA + "Skip" secondary action
- Staged disclosure: show only essentials at each step

### Pull-to-Refresh & Gestures

- Native pull-to-refresh via `RefreshControl` on `ScrollView`/`FlatList`
- Swipe-left on cards for quick actions (bookmark, share, archive)
- Long-press for context menu (share, open in browser)

Source: [LogRocket Touch Targets](https://blog.logrocket.com/ux-design/all-accessible-touch-target-sizes/), [Smashing Magazine Tap Targets](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/), [Expo Router Tabs](https://docs.expo.dev/router/advanced/tabs/), [React Navigation Bottom Tabs](https://reactnavigation.org/docs/bottom-tab-navigator/), [Spotify Bottom Sheet Pattern](https://medium.com/@florian_71106/how-to-build-a-spotify-style-bottom-sheet-tab-navigation-in-react-native-expo-aa7d109abaa2), [Mobile Onboarding Best Practices](https://nextnative.dev/blog/mobile-onboarding-best-practices), [Progressive Disclosure UX Planet](https://uxplanet.org/design-patterns-progressive-disclosure-for-mobile-apps-f41001a293ba)

---

## 4. Technical Stack Research

### NativeWind Theming (v4/v5)

| Feature | Support | Notes |
|---------|---------|-------|
| CSS Variables | Yes | Runtime theme switching via `vars()` function |
| Dark mode | Yes | `useColorScheme()` hook |
| Custom colors in config | Yes | `theme.extend.colors` in `tailwind.config.js` |
| Platform-specific tokens | Yes | `platformSelect()`, `platformColor()` |
| Font scaling | Yes | `fontScale()`, `fontScaleSelect()` |
| Container queries | Yes (v4+) | Responsive without media queries |
| Animations | Yes (v4+) | CSS transition/animation support |

### Design Token Architecture

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // CSS variable-based for runtime switching
        'cyber-bg': 'rgb(var(--color-cyber-bg) / <alpha-value>)',
        'cyber-surface': 'rgb(var(--color-cyber-surface) / <alpha-value>)',
        'cyber-cyan': 'rgb(var(--color-cyber-cyan) / <alpha-value>)',
        'cyber-magenta': 'rgb(var(--color-cyber-magenta) / <alpha-value>)',
        'cyber-green': 'rgb(var(--color-cyber-green) / <alpha-value>)',
        'cyber-purple': 'rgb(var(--color-cyber-purple) / <alpha-value>)',
        'cyber-blue': 'rgb(var(--color-cyber-blue) / <alpha-value>)',
      },
      fontFamily: {
        'mono-heading': ['JetBrains Mono', 'monospace'],
        'sans-body': ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(0, 255, 255, 0.3)',
        'neon-magenta': '0 0 10px rgba(255, 0, 102, 0.3)',
      },
    },
  },
}
```

### Typography Stack

| Font | Package | Weights | Usage |
|------|---------|---------|-------|
| JetBrains Mono | `@expo-google-fonts/jetbrains-mono` | 400, 500, 600, 700 | Headings, code, labels |
| Space Mono | `@expo-google-fonts/space-mono` | 400, 700 | Alternative mono, tags |
| Inter | `@expo-google-fonts/inter` | 400, 500, 600, 700 | Body text, descriptions |

All available via Expo Google Fonts with `useFonts` hook for async loading.

### Component Architecture (26+ Screens)

Recommended structure:
```
src/
  design-system/
    tokens/          # colors, spacing, typography, shadows
    primitives/      # Text, Button, Card, Input, Icon
    composites/      # PlayerBar, DigestCard, NavHeader
    effects/         # NeonBorder, Scanline, GlitchText
    layouts/         # ScreenLayout, TabLayout, ModalLayout
  features/
    onboarding/      # 3 screens
    digest/          # feed, detail, weekly summary
    podcast/         # player, mini-player, transcript
    newsletter/      # archive, reader
    search/          # overlay
    profile/         # settings, preferences
    config/          # dashboard, admin
    notifications/   # center
    shared/          # empty states, error screens, share sheet
```

### Playwright Visual Regression

- `expect(page).toHaveScreenshot()` for baseline comparison
- Pixel-by-pixel diffing across Chromium, Firefox, WebKit
- Best practices: freeze dynamic content, disable animations, fix viewport size
- Mask timestamps/dynamic data with `mask` option
- Run in CI with consistent OS/browser versions for reproducibility
- Applicable to web build of React Native app (via react-native-web)

Source: [NativeWind Themes Guide](https://www.nativewind.dev/docs/guides/themes), [NativeWind v4 Announcement](https://www.nativewind.dev/blog/announcement-nativewind-v4), [Expo Fonts Docs](https://docs.expo.dev/develop/user-interface/fonts/), [JetBrains Mono Expo Package](https://www.npmjs.com/package/@expo-google-fonts/jetbrains-mono), [Playwright Visual Testing](https://playwright.dev/docs/test-snapshots), [Playwright Visual Regression Guide](https://codoid.com/automation-testing/playwright-visual-testing-a-comprehensive-guide-to-ui-regression/)

---

## 5. Audio/Podcast Player UX

### Full-Screen Player Design

| Element | Pattern | Notes |
|---------|---------|-------|
| Album art / episode art | Large centered image (60-70% width) | Neon glow border effect |
| Waveform visualization | Audio waveform seek bar | Touch/drag to seek |
| Playback controls | Play/Pause (center, large), Skip 15s/30s (flanking) | 48px+ touch targets |
| Speed control | Pill selector: 0.5x, 1x, 1.25x, 1.5x, 2x | Common podcast speeds |
| Progress indicator | Elapsed / Remaining time with seek bar | Current position highlight |
| Additional controls | Sleep timer, bookmark, share, transcript toggle | Secondary action row |
| Background gradient | LinearGradient from episode art dominant color | Cyberpunk: dark gradient with neon tint |

### Mini Player Bar

- Height: 56-64px
- Contents: Episode art thumbnail (40px), title (truncated), play/pause button
- Position: Fixed above bottom tab bar
- Interaction: Tap to expand to full player, swipe up gesture
- Animation: `react-native-reanimated` shared element transition

### Transcript View

| Feature | Implementation |
|---------|---------------|
| Speaker labels | Bold name/initials with unique color per speaker |
| Timestamps | Clickable, jump-to-position on tap |
| Auto-scroll | Highlight current segment, auto-scroll with audio |
| Search | In-transcript text search with highlight |
| Segment granularity | Speaker changes or 30s-2min intervals |
| Layout | Chat-bubble or paragraph style per speaker |

### Background Playback

- Expo AV or `react-native-track-player` for background audio
- Lock screen controls: play/pause, skip, seek
- Notification bar media controls (Android)
- Control Center integration (iOS)

Source: [WaveformPlayer](https://waveformplayer.com/), [Android Waveform SeekBar](https://github.com/massoudss/waveformSeekBar), [Apple Podcasts Transcripts](https://podcasters.apple.com/support/5316-transcripts-on-apple-podcasts), [Snipd AI Podcast App](https://www.snipd.com/), [Metacast Podcast App](https://metacast.app/blog/product/metacast-launch-powerful-podcast-app-transcripts-android-ios)

---

## 6. Email Newsletter Design

### Dark Mode Handling by Client

| Client | Behavior | CSS Support |
|--------|----------|-------------|
| Apple Mail / iOS Mail | Respects `prefers-color-scheme` | Full media query |
| Gmail Desktop | No color changes | None |
| Gmail iOS | Full color invert | None (auto invert) |
| Outlook.com | Partial invert (light->dark) | `[data-ogsc]` prefix |
| Outlook Windows 2021+ | Full color invert | VML gradient workaround |
| Outlook macOS | Respects `prefers-color-scheme` | Full media query |

### Critical Technical Constraints

1. **Inline CSS required** for Gmail compatibility
2. **Max width**: 600px standard
3. **Avoid pure #FFFFFF and #000000** -- they get auto-swapped in dark mode
4. **Meta tags required**: `<meta name="color-scheme" content="light dark">` and `<meta name="supported-color-schemes" content="light dark">`
5. **Image handling**: Add translucent outlines to transparent PNGs; use APNG over GIF
6. **Font limitations**: System fonts only (no custom web fonts reliably)

### Cyberpunk Email Template Strategy

Since we're designing dark-first, the email already matches dark mode expectations:
- Use off-black (`#0D0D14`) instead of pure `#000000` to prevent Gmail inversion
- Use off-white (`#F0F0F5`) instead of pure `#FFFFFF`
- Inline all styles; use `background-color` on `<td>` elements
- Neon accent colors work well in email -- high contrast on dark backgrounds
- Provide light-mode fallback via `@media (prefers-color-scheme: light)` for Apple Mail
- **Test with Litmus or Email on Acid** for cross-client validation

Source: [Litmus Dark Mode Guide](https://www.litmus.com/blog/the-ultimate-guide-to-dark-mode-for-email-marketers), [Campaign Monitor Dark Mode](https://www.campaignmonitor.com/resources/guides/dark-mode-in-email/), [Frontend Masters Email Template](https://frontendmasters.com/blog/simple-typographic-email-template/), [Email on Acid Dark Mode](https://www.emailonacid.com/blog/article/email-development/dark-mode-for-email/)

---

## 7. Existing Codebase Assessment

### Current State

The project is **greenfield** -- no existing application code, only spec infrastructure:

```
ai-digest/
  .git/
  .gitignore           # ignores specs/.current-spec, **/.progress.md
  .omc/                # oh-my-claudecode state
  specs/
    .current-spec      # "poc"
    CLAUDE.md
    poc/
      .ralph-state.json
      .progress.md
      CLAUDE.md
```

### Constraints

- No `package.json`, no dependencies, no existing tech stack
- No build commands, lint commands, or test commands
- No monorepo structure detected
- Clean slate for architectural decisions

### Implication

All technology choices (Expo, NativeWind, navigation library, audio library, state management) are open decisions for the requirements phase. No legacy constraints.

---

## 8. Related Specs

No other specs exist in the project -- `poc` is the only spec. No cross-spec dependencies or conflicts.

---

## 9. Quality Commands

**Not applicable** -- greenfield project with no `package.json`, `Makefile`, or CI configuration. Quality commands will be defined during implementation setup.

| Type | Command | Source |
|------|---------|--------|
| Lint | Not found | N/A |
| TypeCheck | Not found | N/A |
| Unit Test | Not found | N/A |
| Integration Test | Not found | N/A |
| E2E Test | Not found | N/A |
| Build | Not found | N/A |

---

## Feasibility Assessment

| Aspect | Assessment | Notes |
|--------|------------|-------|
| Technical Viability | **High** | Stitch MCP available and tested; NativeWind mature; all fonts accessible |
| Effort Estimate | **L** | 26 screens + design system + implementation = significant scope |
| Risk Level | **Medium** | Stitch consistency across 26 screens without `extract_design_context`; generation quality variance |
| Stitch Budget | **Low Risk** | ~52 generations of 400/month free tier |
| Accessibility | **Medium Risk** | Electric Blue needs adjustment; all effects need reduced-motion fallbacks |

---

## Recommendations for Requirements

1. **Adjust Electric Blue**: Change `#0066FF` to `#3388FF` or lighter to pass WCAG AA for normal text. Use original only for decorative/large-text elements.

2. **Stitch Workflow**: Start with GEMINI_3_PRO for first 3 screens (splash, digest feed, full player) to establish design DNA, then switch to GEMINI_3_FLASH for remaining 23 screens.

3. **Prompt Template**: Create a standardized design system prompt prefix (colors, fonts, spacing, effects) and prepend to every `generate_screen_from_text` call for visual consistency.

4. **Consider Kargatharaakash stitch-mcp**: If design consistency proves challenging, evaluate switching to the community MCP server that includes `extract_design_context` and `fetch_screen_code` tools.

5. **Screen Priority Order**: Generate screens in dependency order -- design system primitives first (splash, basic card layout), then composite screens (feed, player), then edge cases (empty states, errors).

6. **Design Tokens First**: Define the complete NativeWind/Tailwind token set before generating screens, so Stitch prompts reference exact values that match the implementation.

7. **Email Template Separately**: Generate the email template as AGNOSTIC device type with explicit 600px width constraint in the prompt, and inline all styles.

8. **Reduced Motion**: Require `prefers-reduced-motion` support for all cyberpunk effects (scanlines, glitch, pulse, neon glow animations).

9. **Font Loading Strategy**: Use Expo Google Fonts with `useFonts` hook and display splash screen until fonts load to prevent FOUT.

10. **Audio Library Selection**: Evaluate `react-native-track-player` (background playback, lock screen controls) vs Expo AV during requirements phase.

---

## Open Questions

1. **Stitch Account**: Is Google Cloud project configured with Stitch API enabled? Need to verify before generation.
2. **Generation Quality**: How consistent is Stitch's cyberpunk aesthetic across sequential generations? May need POC of 2-3 screens first.
3. **Code Export**: Will we use Stitch-generated HTML/code as reference only, or attempt to extract components? (Recommendation: reference only, implement in NativeWind)
4. **Desktop Scope**: Are desktop variants (dashboard + admin) responsive web or separate Electron/desktop app?
5. **Newsletter Delivery**: What email service (SendGrid, Resend, Postmark) for newsletter delivery? Affects template testing approach.
6. **Audio Source**: Where does podcast audio content come from? Pre-generated AI audio, RSS feeds, or custom backend?
7. **Transcript Format**: What format are transcripts in? SRT, VTT, JSON with timestamps? Affects UI parsing.

---

## Sources

### Stitch MCP
- [Google Developers Blog - Stitch](https://developers.googleblog.com/stitch-a-new-way-to-design-uis/)
- [Stitch MCP (Kargatharaakash)](https://github.com/Kargatharaakash/stitch-mcp)
- [Stitch Gemini CLI Extension](https://github.com/gemini-cli-extensions/stitch)
- [SOTAAZ Stitch Integration Guide](https://blog.sotaaz.com/post/stitch-mcp-integration-en)
- [Google Stitch Complete Guide 2026](https://almcorp.com/blog/google-stitch-complete-guide-ai-ui-design-tool-2026/)
- [Stitch Design Consistency Discussion](https://discuss.ai.google.dev/t/stitch-consistency-in-design-generations-via-uploaded-figma-screenshots/111773)

### Cyberpunk Design
- [CYBERCORE CSS Framework](https://dev.to/sebyx07/introducing-cybercore-css-a-cyberpunk-design-framework-for-futuristic-uis-2e6c)
- [Cyberpunk Neon Theme](https://github.com/Roboron3042/Cyberpunk-Neon)
- [Page Flows Cyberpunk Color Palette](https://pageflows.com/resources/cyberpunk-color-palette/)
- [Scalable Accessible Dark Theme](https://www.fourzerothree.in/p/scalable-accessible-dark-mode)

### Accessibility
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [WCAG 2.1 Contrast Requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Smashing Magazine Tap Targets](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/)
- [All Accessible Touch Target Sizes](https://blog.logrocket.com/ux-design/all-accessible-touch-target-sizes/)

### React Native / NativeWind
- [NativeWind Themes Guide](https://www.nativewind.dev/docs/guides/themes)
- [NativeWind v4 Announcement](https://www.nativewind.dev/blog/announcement-nativewind-v4)
- [Expo Fonts Documentation](https://docs.expo.dev/develop/user-interface/fonts/)
- [Expo Router Tabs](https://docs.expo.dev/router/advanced/tabs/)
- [React Navigation Bottom Tabs](https://reactnavigation.org/docs/bottom-tab-navigator/)

### Podcast / Audio UX
- [Apple Podcasts Transcripts](https://podcasters.apple.com/support/5316-transcripts-on-apple-podcasts)
- [Snipd AI Podcast App](https://www.snipd.com/)
- [Spotify Bottom Sheet Navigation](https://medium.com/@florian_71106/how-to-build-a-spotify-style-bottom-sheet-tab-navigation-in-react-native-expo-aa7d109abaa2)
- [WaveformPlayer](https://waveformplayer.com/)

### Email
- [Litmus Dark Mode Email Guide](https://www.litmus.com/blog/the-ultimate-guide-to-dark-mode-for-email-marketers)
- [Campaign Monitor Dark Mode Guide](https://www.campaignmonitor.com/resources/guides/dark-mode-in-email/)
- [Email on Acid Dark Mode](https://www.emailonacid.com/blog/article/email-development/dark-mode-for-email/)

### Mobile Design Patterns
- [Plotline Mobile Onboarding Examples 2026](https://www.plotline.so/blog/mobile-app-onboarding-examples)
- [Progressive Disclosure for Mobile](https://uxplanet.org/design-patterns-progressive-disclosure-for-mobile-apps-f41001a293ba)
- [Dark Mode Design Guide 2025](https://ui-deploy.com/blog/complete-dark-mode-design-guide-ui-patterns-and-implementation-best-practices-2025)
- [Empty States UX](https://www.eleken.co/blog-posts/empty-state-ux)

### Visual Testing
- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Playwright Visual Regression Guide](https://codoid.com/automation-testing/playwright-visual-testing-a-comprehensive-guide-to-ui-regression/)
