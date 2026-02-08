# AI Digest Design System Prompt

## Visual Identity

Flat black professional aesthetic inspired by Linear, Vercel, and Raycast. Zero glow, zero neon, zero scanlines. Clean typography, sharp edges, restrained color use.

## Color Palette (Zinc Scale)

- **Background**: #09090B (zinc-950)
- **Surface**: #18181B (zinc-900)
- **Surface Elevated**: #27272A (zinc-800)
- **Border**: #3F3F46 (zinc-700)
- **Border Subtle**: #27272A (zinc-800)
- **Text Primary**: #FAFAFA (zinc-50)
- **Text Secondary**: #A1A1AA (zinc-400)
- **Text Muted**: #71717A (zinc-500)
- **Accent**: #3B82F6 (blue-500)
- **Accent Hover**: #60A5FA (blue-400)
- **Success**: #22C55E (green-500)
- **Warning**: #EAB308 (yellow-500)
- **Destructive**: #EF4444 (red-500)

## Typography

- **Body / UI**: Inter (variable weight)
- **Display / Headings**: Geist Sans
- **Code / Mono**: Geist Mono
- **Scale**: text-xs through text-4xl, tracking-tight on headings

## Spacing & Radius

- Card radius: 6px
- Button radius: 8px
- Input radius: 6px
- Page max-width: 1200px
- Content padding: 16px mobile, 24px tablet, 32px desktop

## Component Style

- Cards: bg surface, 1px border zinc-700, no shadow
- Buttons: bg accent for primary, bg surface for secondary, text only for ghost
- Inputs: bg zinc-950, border zinc-700, focus ring accent/50
- Tables: alternating row bg surface/surface-elevated
- Focus states: ring-2 ring-accent/50 ring-offset-2 ring-offset-bg

## Layout

- Dark background, no gradients
- Generous whitespace
- Left sidebar navigation on admin pages
- Top navbar on consumer pages
- Responsive: single column mobile, two column tablet, full layout desktop

## Anti-Patterns (NEVER use)

- No glow effects
- No neon colors (cyan, magenta, purple as accent)
- No scanline overlays
- No glitch text animations
- No cyberpunk terminology in UI
- No text-shadow for glow
- No box-shadow with colored spread
