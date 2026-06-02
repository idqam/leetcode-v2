# Aesthetic System — Winter Pastels / Study Focus

A reusable design system for calm, focused interfaces. Built around warm cream backgrounds, deep blue ink, and muted blue / green / pastel accents. Tone: a personal tool, not a product. Quiet, deliberate, room to breathe.

---

## Philosophy

- **Calm over flashy.** No saturated brand colors, no gradients, no shadows except where they earn it.
- **Personal, not corporate.** Serif for emotional moments (hero, donation note). Sans-serif for everything else.
- **Information first.** Status colors carry meaning (overdue / due / done). Decorations don't.
- **Restraint.** Default to muted blue-gray text. Reserve deep ink for emphasis.

---

## Color Palette

### Neutrals (the foundation)

| Token            | Light       | Dark        | Use                                  |
| ---------------- | ----------- | ----------- | ------------------------------------ |
| `bg-base`        | `#F7F5F0`   | `#0F1419`   | Page background                      |
| `bg-surface`     | `#EDEAE3`   | `#1A2230`   | Cards, raised surfaces               |
| `bg-deep`        | `#E4E1D9`   | `#243040`   | Recessed surfaces, chips             |
| `border`         | `#D4CFC6`   | `#2A3A4A`   | All borders                          |
| `text-primary`   | `#1C2B3A`   | `#E8EDF2`   | Headings, body emphasis              |
| `text-muted`     | `#6B7F8E`   | `#7A90A4`   | Body, labels, helper text            |

### Accent — Blue (primary action, links)

| Token            | Light     | Dark      | Use                  |
| ---------------- | --------- | --------- | -------------------- |
| `blue`           | `#3D7EAA` | `#5B9EC9` | Primary buttons, links, active state |
| `blue-hover`     | `#2E6A94` | `#3D7EAA` | Button hover         |
| `blue-soft`      | `#D6E8F5` | `#1E3A52` | Soft blue backgrounds (info badges, hover) |

### Accent — Green (success, easy, growth)

| Token       | Light     | Dark      | Use |
| ----------- | --------- | --------- | --- |
| `green`     | `#4A8C6F` | `#5FAD8A` | Easy tags, success state, growth accents |
| `green-soft`| `#D4EDE3` | `#1A3D2E` | Backgrounds for success chips |
| Heatmap ramp | `#9FCFB8 → #5FAD8A → #4A8C6F → #2E6B52` | (mirror) | Intensity gradients |

### Accent — Amber (medium difficulty, warning, note)

| Token        | Light     | Dark      | Use |
| ------------ | --------- | --------- | --- |
| `amber`      | `#B8922A` | `#D4A843` | Medium tags, "due today", small notes |
| `amber-soft` | `#FBF0D6` | `#3D2E0A` | Backgrounds for amber chips |

### Accent — Red (hard difficulty, overdue, destructive)

| Token      | Light     | Dark      | Use |
| ---------- | --------- | --------- | --- |
| `red`      | `#B54A4A` | `#D46A6A` | Hard tags, overdue, sign-out hover, locked state |
| `red-soft` | `#F5DADA` | `#3D1A1A` | Backgrounds for red chips |

### Rules of thumb

- **Text on `bg-base`:** always `text-primary` or `text-muted`.
- **Borders are always `border`.** Never use a colored border except as an *active* state (then it's `blue` or `red` for locked).
- **Backgrounds layer in this order:** base → surface → deep. Don't skip layers.
- **Soft variants are only used as backgrounds for the matching colored text.** A red chip is always `red-soft` bg + `red` text. Never mix.

---

## Typography

### Font families

- **Sans (default):** system-ui stack. Used for everything UI.
- **Serif (Georgia):** reserved for hero headings and emotional moments (donation note, welcome screens). Always at weight 400, often italic. Never use serif for UI controls or body.

### Scale & weight pairing

| Token   | Size (px) | Weight | Use |
| ------- | --------- | ------ | --- |
| `display` | 56 | 400 serif | Landing hero |
| `welcome` | 36 | 400 serif | Login / one-off page titles |
| `h1`    | 24 | 700 | Page titles |
| `h2`    | 18 | 600 | Section headings |
| `h3`    | 14 | 600 | Card titles, group headers |
| `body`  | 14 | 400 | Body text, table cells |
| `small` | 13 | 400 | Helper text, descriptions |
| `xs`    | 12 | 500 | Inline metadata |
| `label` | 11 | 600 | Uppercase labels, tracking-wider |
| `chip`  | 10–11 | 600 | Status chips, tags |

### Letter-spacing

- Hero serif: `tracking-tight` (-0.02em).
- Labels (uppercase): `tracking-widest` (0.06–0.1em).
- Everything else: default.

### Line height

- Hero: `1.1`
- Welcome / display: `1.15`
- Body: `1.5–1.6`
- UI (table rows, chips): default

---

## Spacing & Layout

### Page widths

| Context              | Width |
| -------------------- | ----- |
| Reading column       | `max-w-2xl` (672px) |
| App content          | `max-w-5xl` (1024px) |
| Wide grids (bento, dashboard) | `max-w-5xl` |
| Patterns split view  | `max-w-6xl` |

### Padding rhythm

- Page padding: `px-6 py-6` to `px-8 py-8`
- Card padding: `p-3` (small) / `p-4` (default) / `p-7` (donation, hero)
- Inline chip: `px-2 py-0.5`

### Gaps

- Tight (chip rows, dot grids): `gap-2`
- Default (form fields, nav links): `gap-3` to `gap-6`
- Sectioned content: `space-y-6` to `space-y-10`

---

## Border radius

| Token       | Radius | Use |
| ----------- | ------ | --- |
| `radius-xs` | 2px    | Heatmap dots |
| `radius-sm` | 4px    | Chips, small inline tags |
| `radius`    | 6–8px  | Inputs, buttons, code blocks |
| `radius-lg` | 10px   | CTAs, cards |
| `radius-xl` | 16px   | Hero / donation cards |
| `radius-full` | 9999px | Pills, badges with leading dot |

---

## Components

### Status chip

```html
<span class="text-xs px-2 py-0.5 rounded font-medium {color-soft} {color}">
  Overdue
</span>
```

Always: `color-soft` background + `color` foreground + `font-medium`. Never a border.

### Difficulty tag

- **Easy** → `green` on `green-soft`
- **Medium** → `amber` on `amber-soft`
- **Hard** → `red` on `red-soft`

### Primary button

```html
<button class="bg-blue hover:bg-blue-hover text-white px-4 py-1.5 rounded text-sm font-medium">
  Action
</button>
```

### Ghost / secondary button

```html
<button class="border border-border bg-bg-base text-text-primary px-4 py-1.5 rounded text-sm font-medium hover:bg-bg-surface">
  Action
</button>
```

### Card

```html
<div class="bg-bg-surface border border-border rounded-lg p-4">
  …
</div>
```

### Input

```html
<input class="border border-border rounded px-3 py-1.5 text-sm bg-bg-base text-text-primary placeholder:text-text-muted focus:border-blue focus:ring-2 focus:ring-blue/20" />
```

### Section label (uppercase)

```html
<h3 class="text-xs font-semibold uppercase tracking-wide text-text-muted">
  Review History
</h3>
```

### Pill badge with leading dot

```html
<span class="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium bg-green-soft text-green">
  <span class="w-1.5 h-1.5 rounded-full bg-green"></span>
  Built for focus
</span>
```

### Donation / personal note card

```html
<div class="bg-bg-surface border border-border rounded-2xl p-7 text-center">
  <div class="text-[10px] font-semibold uppercase tracking-[0.1em] text-green mb-2.5">
    A small note
  </div>
  <h4 class="text-lg italic mb-2" style="font-family: Georgia, serif">
    This isn't a product.
  </h4>
  <p class="text-sm leading-relaxed text-text-muted mb-4">…</p>
  <a class="inline-block bg-bg-base border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-soft">
    ☕ Buy me a coffee
  </a>
</div>
```

---

## Motion

- **Default transition:** `transition-colors` (150ms ease). Apply to anything that responds to hover or active state.
- **Card flip / 3D:** 450ms ease. Use sparingly — meaningful state changes only.
- **No fades, no scales, no springs.** Color shifts are enough.

---

## Backgrounds & elevation

- Pages use a subtle vertical gradient on marketing surfaces only:
  ```css
  bg-gradient-to-b from-#F7F5F0 to-#EDEAE3
  ```
- App pages use flat `bg-base`. No drop shadows.
- The one exception: locked / focused state — a soft colored ring:
  ```css
  border-color: #D46A6A;
  box-shadow: 0 0 0 2px rgba(212, 106, 106, 0.25);
  ```

---

## Iconography

- **Lucide** at 12–16px for inline icons.
- **Unicode glyphs** (◐ ⊞ ◇) for landing feature tiles — keeps the page lightweight and matches the calm tone.
- Icons are always tinted to match their context (`text-blue` inside a blue chip, etc.).

---

## What this system avoids

- ❌ Pure black (`#000`) — use `text-primary` instead.
- ❌ Pure white (`#fff`) on light mode — use `bg-base` (`#F7F5F0`).
- ❌ Shadows for decoration. Only for focus/locked rings.
- ❌ Saturated brand colors (no `#FF` anything).
- ❌ More than three weights in any single view.
- ❌ Animations for hover (color shifts only).
- ❌ Gradients except on landing/marketing surfaces.

---

## Quick-start: dropping this into a new Tailwind project

Add to your Tailwind config:

```js
theme: {
  extend: {
    colors: {
      base: { DEFAULT: '#F7F5F0', dark: '#0F1419' },
      surface: { DEFAULT: '#EDEAE3', dark: '#1A2230' },
      deep: { DEFAULT: '#E4E1D9', dark: '#243040' },
      ink: { DEFAULT: '#1C2B3A', dark: '#E8EDF2' },
      muted: { DEFAULT: '#6B7F8E', dark: '#7A90A4' },
      line: { DEFAULT: '#D4CFC6', dark: '#2A3A4A' },
      brand: { DEFAULT: '#3D7EAA', hover: '#2E6A94', soft: '#D6E8F5' },
      success: { DEFAULT: '#4A8C6F', soft: '#D4EDE3' },
      warn: { DEFAULT: '#B8922A', soft: '#FBF0D6' },
      danger: { DEFAULT: '#B54A4A', soft: '#F5DADA' },
    },
    fontFamily: {
      serif: ['Georgia', 'Times New Roman', 'serif'],
    },
  },
}
```
