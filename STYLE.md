# ArenaPulse — Style Guide

> **Theme Name:** Stadium Green  
> **Philosophy:** Clean, professional, readable. No dark-mode-first, no neon, no AI clichés. White space, bold green, warm orange accents.

---

## Color Tokens

### Core Palette

| Token              | Hex       | Usage                                      |
|--------------------|-----------|----------------------------------------------|
| `--bg`             | `#FAFAFA` | Page background                              |
| `--surface`        | `#FFFFFF` | Cards, navbar, footer, modals, dropdowns     |
| `--border`         | `#E5E7EB` | Card borders, dividers, input borders        |
| `--text`           | `#111827` | Primary text — headings, body                |
| `--text-secondary` | `#6B7280` | Labels, meta info, placeholders, captions    |

### Brand Colors

| Token              | Hex       | Usage                                      |
|--------------------|-----------|----------------------------------------------|
| `--primary`        | `#16A34A` | Logo, links, primary buttons, active states  |
| `--primary-hover`  | `#15803D` | Primary button hover                         |
| `--primary-light`  | `#F0FDF4` | Badges, tag backgrounds, subtle highlights   |

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
| Completed | `#F0FDF4` | `#16A34A` | `#BBF7D0` | Finished tournaments/matches  |
| Rejected  | `#FEF2F2` | `#DC2626` | `#FECACA` | Denied registrations          |
| Pending   | `#FFFBEB` | `#D97706` | `#FDE68A` | Awaiting approval             |

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

---

## Badges

### Game Badge
```css
background: var(--primary-light);
color: var(--primary);
border: 1px solid #BBF7D0;
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

| Component        | Background   | Border          | Radius  | Shadow on hover |
|-----------------|-------------|-----------------|---------|-----------------|
| Navbar          | `--surface` | bottom `--border` | none    | none            |
| Tournament Card | `--surface` | `--border`       | `12px`  | `--shadow-md`   |
| Feature Card    | `--surface` | `--border`       | `12px`  | `--shadow-md`   |
| Modal           | `--surface` | none             | `16px`  | `--shadow-md`   |
| Dropdown        | `--surface` | `--border`       | `10px`  | `--shadow-md`   |
| Input           | `--surface` | `--border`       | `10px`  | none            |
| CTA Banner      | `--primary` | none             | `16px`  | none            |
| Footer          | `--surface` | top `--border`   | none    | none            |

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
- Use white/off-white backgrounds for all main surfaces
- Use green (`--primary`) for brand identity and positive actions
- Use orange (`--accent`) sparingly — only for CTAs and urgency
- Keep cards clean with generous padding and subtle borders
- Use Inter font everywhere — no mixing fonts
- Add hover transitions on all interactive elements (0.2s)

### ❌ Don't
- Don't use dark backgrounds as the default theme
- Don't use purple, neon, or gradient-heavy designs
- Don't use more than 2 brand colors (green + orange)
- Don't add heavy shadows — keep them subtle
- Don't use rounded corners larger than 16px
- Don't skip the border on cards (they need visual separation on white bg)
