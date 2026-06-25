# ArenaPulse — Style Guide

> **Theme Name:** Arena Blue  
> **Philosophy:** Clean, professional, readable. White space, bold blue brand, warm orange accents. Subtle dot grid background adds texture without distraction.

---

## Color Tokens

### Core Palette

| Token              | Hex       | Usage                                      |
|--------------------|-----------|----------------------------------------------|
| `--bg`             | `#F8FAFC` | Page background (behind dot grid)            |
| `--surface`        | `#FFFFFF` | Cards, modals, dropdowns                     |
| `--border`         | `#E2E8F0` | Card borders, dividers, input borders        |
| `--text`           | `#0F172A` | Primary text — headings, body                |
| `--text-secondary` | `#64748B` | Labels, meta info, placeholders, captions    |

### Brand Colors

| Token              | Hex       | Usage                                      |
|--------------------|-----------|----------------------------------------------|
| `--primary`        | `#2563EB` | Logo, links, primary buttons, active states  |
| `--primary-hover`  | `#1D4ED8` | Primary button hover                         |
| `--primary-light`  | `#EFF6FF` | Badges, tag backgrounds, subtle highlights   |

### Accent Colors

| Token              | Hex       | Usage                                      |
|--------------------|-----------|----------------------------------------------|
| `--accent`         | `#EA580C` | CTA buttons, prize pools, urgent actions     |
| `--accent-hover`   | `#C2410C` | Accent button hover                          |
| `--accent-light`   | `#FFF7ED` | Accent badge backgrounds                     |

### Status Colors

| Status    | Background | Text      | Border    | Usage                         |
|-----------|-----------|-----------|-----------|-------------------------------|
| Live      | `#FEF2F2` | `#DC2626` | `#FECACA` | Active/live matches           |
| Open      | `#FFF7ED` | `#EA580C` | `#FED7AA` | Registration open             |
| Upcoming  | `#F0F9FF` | `#0284C7` | `#BAE6FD` | Scheduled, not started        |
| Completed | `#EFF6FF` | `#2563EB` | `#BFDBFE` | Finished tournaments/matches  |
| Rejected  | `#FEF2F2` | `#DC2626` | `#FECACA` | Denied registrations          |
| Pending   | `#FFFBEB` | `#D97706` | `#FDE68A` | Awaiting approval             |

---

## Background — Dot Grid Pattern

Every page in ArenaPulse uses a fixed dot grid background. The dots stay static while content scrolls over them, adding texture without distracting from the UI.

### CSS (apply to body on every page)

```css
body {
  background-color: #F8FAFC;
  background-image: radial-gradient(circle, #CBD5E1 1.5px, transparent 1.5px);
  background-size: 32px 32px;
  background-attachment: fixed;
}
```

### Specs

| Property | Value | Why |
|---|---|---|
| Dot color | `#CBD5E1` | Slate-300 — visible but subtle on `#F8FAFC` |
| Dot size | `1.5px` radius | Large enough to see, small enough to not distract |
| Grid spacing | `32px × 32px` | Balanced density — not too tight, not too sparse |
| Attachment | `fixed` | Dots stay still, content scrolls over them |

### Rules
- **Always apply** this background to `<body>` on every page/route
- **Cards and surfaces** use `background: var(--surface)` (solid white) so dots don't show through
- **Navbar** uses `rgba(255,255,255,0.85)` + `backdrop-filter: blur(12px)` for frosted glass over dots
- **Footer** uses the same frosted glass treatment
- **Modals/Overlays** should have solid `var(--surface)` background — never transparent over dots

---

## Frosted Glass (Navbar & Footer)

The navbar and footer use a frosted glass effect so the dot grid is softly visible behind them.

```css
.navbar, .footer {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

| Property | Value | Why |
|---|---|---|
| Background | `rgba(255,255,255,0.85)` | 85% white — mostly opaque, slight transparency |
| Blur | `12px` | Soft blur of dots behind |
| Border | `1px solid var(--border)` | Bottom for navbar, top for footer |

---

## Typography

| Element         | Font            | Weight | Size      | Color              |
|-----------------|-----------------|--------|-----------|---------------------|
| Font Family     | Inter           | —      | —         | —                   |
| Fallback        | system-ui, sans-serif | — | —       | —                   |
| Page Title (h1) | Inter           | 800    | 3.2rem    | `--text`            |
| Section Title   | Inter           | 700    | 1.6rem    | `--text`            |
| Card Title      | Inter           | 700    | 1.1rem    | `--text`            |
| Body            | Inter           | 400    | 1rem      | `--text`            |
| Body Secondary  | Inter           | 400    | 0.85rem   | `--text-secondary`  |
| Button          | Inter           | 600    | 0.9rem    | (depends on variant)|
| Badge           | Inter           | 600    | 0.75rem   | (depends on status) |
| Small / Caption | Inter           | 500    | 0.7rem    | `--text-secondary`  |

**Google Fonts import:**
```
https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap
```

---

## Spacing & Layout

| Token       | Value   | Usage                          |
|-------------|---------|--------------------------------|
| Page max-width | `1120px` | `.container` max-width      |
| Page padding   | `24px`   | Horizontal padding          |
| Section padding | `60px 0` | Vertical section spacing   |
| Card padding   | `24px`   | Internal card padding       |
| Card gap       | `20px`   | Grid gap between cards       |
| Element gap    | `8px`    | Between inline items         |
| Nav gap        | `32px`   | Between nav links            |

---

## Border Radius

| Token       | Value  | Usage                              |
|-------------|--------|------------------------------------|
| `--radius`  | `12px` | Cards, modals, large containers    |
| Buttons     | `10px` | All buttons                        |
| Badges      | `50px` | Status badges, game tags (pill)    |
| Logo icon   | `10px` | Navbar logo square                 |
| Avatars     | `50%`  | User profile images (circle)       |
| Stats bar   | `16px` | Stats card container               |
| CTA box     | `16px` | Call-to-action banner              |

---

## Shadows

| Token         | Value                                             | Usage                    |
|---------------|---------------------------------------------------|--------------------------|
| `--shadow`    | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Default resting state |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.08)`                    | Hover states, dropdowns  |

---

## Buttons

### Variants

| Variant      | Background      | Text Color     | Border              | Usage                    |
|-------------|-----------------|----------------|----------------------|--------------------------|
| Primary     | `--primary`     | `#FFFFFF`      | none                 | Main actions (Save, Submit) |
| Accent      | `--accent`      | `#FFFFFF`      | none                 | CTAs (Sign Up, Register)   |
| Outline     | `transparent`   | `--text`       | `1.5px solid --border` | Secondary actions         |
| White       | `#FFFFFF`       | `--primary`    | none                 | Inside colored sections    |

### States

- **Hover:** Darken background (use `-hover` token), `translateY(-1px)`, apply `--shadow-md`
- **Disabled:** `opacity: 0.5`, `cursor: not-allowed`, no hover effect
- **Active:** `translateY(0)`

### Sizing

```
padding: 10px 22px;
font-size: 0.9rem;
border-radius: 10px;
```

---

## Cards

### Tournament Card Structure

```
┌──────────────────────────────┐
│  [Game Badge]    [Status]    │  ← card-top
│                              │
│  Tournament Title            │  ← card-title
│  📅 Jun 20 – Jun 28, 2026   │  ← card-meta
│  👥 Single Elim · 5v5       │
│                              │
│ ─────────────────────────── │  ← border-top divider
│  $5,000        32/32 Teams   │  ← card-footer
└──────────────────────────────┘
```

### Card Behavior

- Default: `border: 1px solid --border`, `background: --surface`
- Hover: `box-shadow: --shadow-md`, `transform: translateY(-2px)`
- Transition: `0.2s ease`
- Background must be **solid white** — dots must not show through cards

---

## Badges

### Game Badge
```css
background: var(--primary-light);
color: var(--primary);
border: 1px solid #BFDBFE;
padding: 4px 12px;
border-radius: 50px;
font-size: 0.75rem;
font-weight: 600;
```

### Status Badge
```css
padding: 4px 10px;
border-radius: 50px;
font-size: 0.7rem;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.04em;
```

---

## Component Reference

| Component        | Background           | Border            | Radius  | Notes                  |
|-----------------|----------------------|--------------------|---------|------------------------|
| Navbar          | `rgba(255,255,255,0.85)` + blur | bottom `--border` | none | Frosted glass over dots |
| Tournament Card | `--surface`          | `--border`         | `12px`  | Solid white, no dots   |
| Feature Card    | `--surface`          | `--border`         | `12px`  | Solid white, no dots   |
| Stats Bar       | `--surface`          | `--border`         | `16px`  | Solid white, no dots   |
| Modal           | `--surface`          | none               | `16px`  | Solid white, no dots   |
| Dropdown        | `--surface`          | `--border`         | `10px`  | Solid white, no dots   |
| Input           | `--surface`          | `--border`         | `10px`  | Solid white            |
| CTA Banner      | `--primary`          | none               | `16px`  | Solid blue             |
| Footer          | `rgba(255,255,255,0.85)` + blur | top `--border` | none | Frosted glass over dots |

---

## Responsive Breakpoints

| Breakpoint | Max Width | Adjustments                                  |
|-----------|-----------|----------------------------------------------|
| Desktop   | > 768px   | Default styles                               |
| Tablet    | ≤ 768px   | Hide nav links, stack grids to 1-2 cols, reduce hero font |
| Mobile    | ≤ 480px   | Single column grids, compact padding         |

---

## Do's and Don'ts

### ✅ Do
- Use the dot grid background on every page (`background-attachment: fixed`)
- Use solid white `var(--surface)` for all cards and surfaces (dots must not show through)
- Use frosted glass (`backdrop-filter: blur`) for navbar and footer only
- Use blue (`--primary`) for brand identity and positive actions
- Use orange (`--accent`) sparingly — only for CTAs and urgency
- Keep cards clean with generous padding and subtle borders
- Use Inter font everywhere — no mixing fonts
- Add hover transitions on all interactive elements (0.2s)

### ❌ Don't
- Don't use transparent backgrounds on cards (dots will show through)
- Don't use dark backgrounds as the default theme
- Don't use purple, neon, or gradient-heavy designs
- Don't use more than 2 brand colors (blue + orange)
- Don't add heavy shadows — keep them subtle
- Don't use rounded corners larger than 16px
- Don't use `background-attachment: scroll` — dots must always be fixed
