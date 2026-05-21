<!--
This is the source-of-truth for the Volume visual identity. Subsequent
surface redesigns add `0002-...md`, `0003-...md`, etc. that extend this
vocabulary. Token names, font choices, and the tape/chalk/wall metaphor
come from here.
-->

# Handoff: Volume — Weekly Schedule redesign

## Overview

This is a redesign of the **Weekly Schedule** page for Volume — the
bouldering training planner. The visual identity is built around the
metaphor of an **indoor bouldering wall**: a warm-cool paper-grey
"wall" surface as the background, and bright skill-tree category
colours used as the only saturated accents, applied like the strips
of route tape gyms stick next to a problem to identify it.

Only the **Schedule page** is in scope. Sidebar nav, Activities page,
Skill Tree page, modals (AddActivity, IntentPicker, ActivityDetail),
auth, etc. are out of scope for this handoff. The sidebar is shown
in the mockup only for visual completeness.

## About the design files

The files in this bundle are **design references built in vanilla
HTML + a single inline-JSX React script**. They are **not production
code to copy verbatim**. The job is to **recreate this design inside
the existing Volume codebase** — the React 18 + TypeScript + CSS
Modules project at `volume-app/`, preserving its existing component
boundaries, hooks (`useWeekActivities`, `useGoals`, `useActivityLog`,
…), context providers, drag-and-drop wiring (`@hello-pangea/dnd`),
routing, and tests.

The CSS in `Weekly Schedule.html` is a reference for visual values
(colours, spacing, type, shadows, borders) and component structure —
copy values across into the existing `*.module.css` files; do not
copy the global stylesheet wholesale.

## Fidelity

**High-fidelity.** Final colours, typography, spacing, borders,
shadows, and interactions are all settled. Recreate this pixel-for-
pixel using the codebase's existing CSS Modules pattern.

## Files in this bundle

| File | Purpose |
|---|---|
| `Weekly Schedule.html` | Host page with all CSS in a `<style>` block + font imports + React/Babel CDN scripts. |
| `schedule-app.jsx` | Single inline-JSX file containing every React component used in the mock (App, Sidebar, Header, GoalStrip, DayColumn, ActivityCard, VolumeMark) plus the demo `WEEK` and `GOALS` data. |
| `README.md` | This document. |

Open `Weekly Schedule.html` directly in a browser to view the design.

## Mapping the design into the codebase

| Mockup component | Real codebase file |
|---|---|
| `App` (mock root) | `src/app/App.tsx` (already exists, no changes needed) |
| `Sidebar` + `VolumeMark` | `src/components/Sidebar/Sidebar.tsx` — replace the small triangle SVG with the new hexagonal `VolumeMark`. Also update active-item styling (`Sidebar.module.css`). |
| `Header` (top bar with title + week picker) | The top portion of `src/features/schedule/SchedulePage.tsx` — currently a minimal header with only the week picker. **Add** the big "Week N" / date subtitle on the left. |
| `GoalStrip` (Goal coverage row) | `src/features/schedule/LoadSummaryBar.tsx` + `LoadSummaryBar.module.css`. This component is currently a placeholder; build it out per the design here. |
| `DayColumn` | The 7-column kanban inside `SchedulePage.tsx`. |
| `ActivityCard` | `src/features/schedule/ActivityCard.tsx` + the `.activityCard` / `.cardSeparator` / `.cardText` rules in `schedule.module.css`. |
| Per-card color from category | Replace the existing `task.accent` plumbing with a category-color lookup. The accent should be the category color of the activity's intent leaf, not a per-activity value. See "Category colors" below. |

The existing `schedule.module.css` should be largely rewritten to
match the values in this handoff. Existing class names can be kept
(`.activityCard`, `.cardList`, `.kanbanColumn`, etc.) — only the
styles change.

## Design tokens

Drop these into `src/index.css` (extending the existing `:root`
block) or — preferred — into a new `src/styles/tokens.css` imported
from `main.tsx`.

```css
:root {
  /* WALL — the page background */
  --wall-base:  #ecedee;
  --wall-deep:  #dcdcdc;
  --wall-light: #f5f6f6;

  /* INK — text + chrome (kept warm-near-black, not pure #000) */
  --ink:    #1a1814;
  --ink-2:  #3b3630;
  --ink-3:  #6a6359;
  --ink-4:  #8d8f92;

  /* CHALK — activity card surface; off-white, slightly cooler than
     pure white so cards don't punch off the wall */
  --chalk:  #f6f7f8;

  /* TYPE */
  --font-display: "Bricolage Grotesque", system-ui, sans-serif;
  --font-ui:      "Bricolage Grotesque", system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, monospace;
}
```

### Fonts

Replace the existing Google Fonts `<link>` in `index.html` with:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=JetBrains+Mono:wght@400;500;600&display=swap"
  rel="stylesheet" />
```

`body` font-family in `src/index.css` becomes
`"Bricolage Grotesque", system-ui, sans-serif`.

### Category colors

These already exist in `src/data/skillTree.ts` as `CATEGORY_COLORS`.
**No changes needed.** They are:

| Category id | Label | Hex |
|---|---|---|
| `technique` | Technique | `#F5A623` |
| `flexibility-mobility` | Mobility | `#EF4E8B` |
| `mental` | Mental | `#12B89A` |
| `grips` | Longevity | `#7C4DFF` |
| `physical-strength` | Strength | `#4DACF7` |

Plus the synthetic neutral used for `just-climbing` / warmups:
`#7E7B73`.

These are applied via a CSS custom property `--cat` set inline on
each card and goal chip, e.g.:

```tsx
<div className={styles.card} style={{ "--cat": categoryColor }}>
```

CSS then references `var(--cat)` — see `.card-strip`, `.goal-chip-dot`,
`.card-kind`.

### Today accent color

Used only by the small "TODAY" pip next to the current day's date.

| Token | Hex |
|---|---|
| Today text | `#C77A1E` |
| Today dot fill | `#E08F25` |
| Today dot halo | `rgba(224,143,37,0.18)` |

## Typography scale

| Element | Family | Size | Weight | Letter-spacing | Notes |
|---|---|---|---|---|---|
| Week title (`Week 21`) | Display | 28px | 600 | -0.015em | line-height 1 |
| Date subtitle | Mono | 11px | 400 | 0.06em | uppercase |
| Goal-strip label ("Goal coverage") | Display | 13px | 600 | 0 | |
| Goal-chip leaf name | UI | 12px | 500 | -0.005em | |
| Goal-chip count `× N` | Mono | 11px / 10px (`×`) | 600 on num | 0 | |
| Day name (MON…SUN) | Display | 16px | 600 (700 on today) | -0.01em | |
| Day date (MAY 18) | Mono | 9.5px | 400 | 0.08em | uppercase |
| TODAY pip | Mono | 9px | 400 | 0.14em | color `#C77A1E` |
| Add-activity button | UI | 12px | 500 | -0.005em | |
| Rest-day text | UI | 12px | 400 | 0 | italic |
| Card KIND eyebrow | Mono | 9.5px | 500 | 0.14em | uppercase, color = `var(--cat)` × `brightness(0.7)` |
| Card grade chip | Mono | 9.5px | 400 | 0.06em | uppercase, bg `rgba(26,24,20,0.06)` |
| Card intent (main label) | Display | 14.5px | 500 | -0.01em | line-height 1.18 |
| Brand text "VOLUME" | Display | 22px | 700 | 0.04em | uppercase |
| Sidebar nav item | UI | 14px | 400 (500 active) | 0 | |
| Week picker buttons | UI | 12px | 400 | 0 | |

"Display" and "UI" both resolve to **Bricolage Grotesque**. They're
separate variables in case the team ever wants to differentiate them
again — keep them split in the CSS.

## Spacing & layout

### App shell

- `body`: `background: var(--wall-base)`, `overflow: hidden`,
  `font-family: var(--font-ui)`, `color: var(--ink)`.
- `.app` is a CSS grid with `grid-template-columns: 176px 1fr`, `gap: 12px`,
  `padding: 12px`. Full viewport height.
- A fixed `.wall-bg` covers the full viewport at `z-index: -1`,
  background `var(--wall-base)`. (Currently flat — see "Optional
  texture" at the bottom for an alternate.)

### Sidebar (176px wide)

- `padding: 18px 14px 14px`, `gap: 22px`, `flex` column.
- **Brand row:** `flex` row, `gap: 10px`. Brand mark is 28px square
  containing the 22×22 SVG `VolumeMark`. Brand text: 22px Bricolage
  700, uppercase, tracking 0.04em, color `--ink`.
- **Nav:** `flex` column, `gap: 4px`. Each item is `flex` row,
  `gap: 10px`, `padding: 7px 10px`, `border-radius: 8px`,
  `font-size: 14px`.
  - Default text color `--ink-3`.
  - Hover: `background: rgba(26,24,20,0.04)`, color `--ink-2`.
  - Active: `background: rgba(26,24,20,0.06)`, color `--ink`,
    `font-weight: 500`. The active dot is `--ink`; inactive is `--ink-4`.
  - Dot: `6×6` circle.

### Main card (`.main-card`)

Frosted panel:
- `background: rgba(255,253,247,0.34)`
- `border: 1px solid rgba(26,24,20,0.10)`
- `border-radius: 14px`
- `box-shadow: inset 0 1px 0 rgba(255,255,255,0.55), 0 1px 0 rgba(0,0,0,0.04)`
- `backdrop-filter: blur(1px)`
- `overflow: hidden`, `flex` column, `min-width: 0`.

### Header (`.top-bar`)

- `padding: 16px 22px 14px`, dashed bottom border
  `1px dashed rgba(26,24,20,0.16)`.
- Flex row, `justify-content: space-between`, `gap: 16px`,
  `align-items: center`.
- **Left:** flex column, `gap: 4px` — big title above, mono subtitle below.
- **Right:** week picker pill.

### Week picker

- `flex` row, `height: 30px`, `border-radius: 999px`,
  `background: var(--chalk)`, `border: 1px solid rgba(26,24,20,0.14)`,
  `overflow: hidden`, text color `--ink-2`.
- Arrow buttons: `padding: 0 10px`, `font-size: 14px`, color `--ink-3`.
- Center label button: `padding: 0 12px`, `font-size: 12px`.
- Hover state on any button: `background: rgba(26,24,20,0.05)`,
  color `--ink`.
- Dividers: `width: 1px; height: 16px; background: rgba(26,24,20,0.12)`.

### Goal strip (`.goal-strip`)

- `padding: 10px 22px`, dashed bottom border.
- Flex row, `gap: 16px`, `align-items: center`.
- **"Goal coverage" label:** 13px Bricolage 600, color `--ink-2`,
  `padding-right: 14px`, dashed right border
  `1px dashed rgba(26,24,20,0.16)` — acts as a visual separator from
  the chips.
- **Chip row:** flex, `gap: 8px`, wraps.

### Goal chip ("Ghost" style)

The chip is intentionally bare — **no chip chrome**. It's just a small
colored dot + the leaf name + a `× N` counter.

- `display: inline-flex`, `align-items: center`, `gap: 6px`,
  `height: 28px`, `padding: 0 10px`. No background, no border, no shadow.
- **Dot:** `8×8` circle, `background: var(--cat)`.
- **Leaf:** 12px Bricolage 500, color `--ink`, letter-spacing `-0.005em`,
  `white-space: nowrap`.
- **Count:** mono, `gap: 2px`, baseline-aligned.
  - The `×` glyph: 10px, color `--ink-4`.
  - The number: 11px, weight 600, color `--ink`.

**Important:** counts are just **how many activities this week used
this Goal's leaf as their Intent** — there's no per-week target. Don't
render `2/3`, fractions, or progress bars. Just the count.

The Goal list itself comes from `useGoals()` (up to 5). The per-Goal
count comes from counting matching `Activity.intentLeafId` values in
the current week's activities (use `useWeekActivities`). Exclude
Warmup activities and Just-Climbing intents.

### Board (`.board`)

- 7-column grid, `grid-template-columns: repeat(7, minmax(150px, 1fr))`,
  `gap: 2px`, `padding: 14px 12px 20px`.
- `overflow-x: auto`, `overflow-y: auto`. Custom thin scrollbar.
- Wrapped in `.board-wrap { position: relative; overflow: hidden; flex: 1; min-height: 0 }`.

### Day column

- `padding: 0 6px`, `flex` column, `min-width: 0`.
- Between columns: a dashed vertical divider (`::before` pseudo on
  every column after the first):
  `position: absolute; left: -2px; top: 8px; bottom: 8px; width: 1px;`
  `background: repeating-linear-gradient(to bottom, rgba(26,24,20,0.10) 0 4px, transparent 4px 9px);`
- **Day header** (`.day-head`): `margin-bottom: 10px`.
  - **Day name** ("MON"): 16px Bricolage 600, line-height 1, color `--ink`.
    On today's column, weight bumps to 700 — no other today highlight
    on the day-col itself (no orange outline, no tinted background).
  - **Day date row:** flex row, mono date + optional "TODAY" pip,
    `margin-top: 4px`.
- **Add-activity button:** see below.
- **Day stack:** `flex` column, `gap: 10px`, `flex: 1`.
  - If the day has no activities, render `<div class="rest-day">Rest day</div>`
    — 12px italic, color `--ink-4`, `padding: 16px 4px`. No
    decorations, no circles.

### Today pip

Replaces the old dark pill. Lives inline next to the day date.

- 9px mono uppercase, letter-spacing `0.14em`, color `#C77A1E`.
- `::before` is a 5×5 orange dot (`#E08F25`) with a soft halo
  (`box-shadow: 0 0 0 2px rgba(224,143,37,0.18)`), `gap: 4px` between
  the dot and "TODAY" text.
- The `today: true` flag on the Day determines if it renders.

### Add-activity button

Dashed ghost button — clean, no organic shapes:
- `height: 32px`, `width: 100%`, `border: 1px dashed rgba(26,24,20,0.22)`,
  `border-radius: 6px`, `padding: 0 12px`.
- Flex row, `justify-content: flex-start`, `gap: 6px`.
- "+" sign: 16px, weight 500.
- "Add activity" label: 12px UI 500, letter-spacing `-0.005em`.
- Default text color `--ink-4`.
- Hover: `border-color: --ink-3`, color `--ink-2`,
  `background: rgba(255,255,255,0.5)`.
- Transition: `all 0.15s ease`.
- `margin-bottom: 10px`.

### Activity card ("Tape" style)

This is the single most identity-carrying piece of UI.

- `display: flex` row, `align-items: stretch`, `min-height: 64px`.
- `background: var(--chalk)`, `border: 1px solid rgba(26,24,20,0.10)`,
  `border-radius: 6px`, `overflow: hidden`.
- Shadow (resting):
  ```
  0 1px 0 rgba(255,255,255,0.7) inset,
  0 1px 2px rgba(20,16,10,0.06),
  0 4px 10px rgba(20,16,10,0.07)
  ```
- A deterministic ±0.5° rotation is applied via inline transform
  (use the `jitter()` function in `schedule-app.jsx` keyed off the
  activity id). On hover, the rotation snaps back to 0deg.
- Hover shadow:
  ```
  0 1px 0 rgba(255,255,255,0.7) inset,
  0 2px 4px rgba(20,16,10,0.07),
  0 10px 22px rgba(20,16,10,0.10)
  ```
  and `transform: translateY(-1px) rotate(0)`.
- Cursor: `grab`, `grabbing` while dragging.

#### Card strip (the "route tape")

- 12px wide on the left, full height, `flex-shrink: 0`.
- `background: var(--cat)` (set inline from activity's category color).
- `inset -1px 0 0 rgba(0,0,0,0.10)` shadow so it reads as fastened
  on rather than printed.
- A subtle fabric speckle is drawn via an SVG `feTurbulence` noise as a
  `background-image` on `.card-strip::before`, `mix-blend-mode: multiply`,
  `opacity: 0.5`. This is what makes the tape read as actual tape and
  not a solid swatch — **keep it**. Inline SVG markup is in the CSS.

#### Card body

- `padding: 9px 12px 10px 12px`, flex column, `gap: 3px`, `flex: 1`,
  `min-width: 0`.
- **Eyebrow row:** flex, `justify-content: space-between`, `gap: 8px`,
  `min-height: 14px`.
  - **KIND label:** mono 9.5px 500, letter-spacing `0.14em`, uppercase,
    color `var(--cat)` darkened via CSS `filter: brightness(0.7)`.
    (This is a CSS-only trick to derive a dark variant of the category
    color without needing extra inline JS. Verify it looks correct on
    each of the five hues — it does in the mock.)
  - **Grade chip** (only when activity has a `grade`): mono 9.5px,
    letter-spacing `0.06em`, uppercase, color `--ink-3`,
    `padding: 1px 6px`, `border-radius: 3px`,
    `background: rgba(26,24,20,0.06)`.
- **Intent (main label):** 14.5px Bricolage 500, line-height 1.18,
  letter-spacing `-0.01em`, color `--ink`, `word-wrap: break-word`.

**Do not render the Block name as a subtitle on the card.** Block
details show in the `ActivityDetailPanel` (already exists), not on the
card surface.

#### Per-Kind treatment

All three Kinds (Climb / Train / Warmup) render with **identical
sizing, weight, and opacity** — the only differentiators are:

1. The KIND label text in the eyebrow ("CLIMB" / "TRAIN" / "WARMUP")
2. The category color of the tape strip

Don't dim warmups or shrink their type. Past iterations did and it
was wrong.

## Volume hexagonal mark (logo)

Replaces the existing `favicon.svg`-derived triangle in the Sidebar.

Pointy-top regular hexagon, circumradius 14, centered at (16, 16) on
a 32×32 viewBox, split into **six triangular facets** with the light
modeled as coming from the top-left. Each facet is a `<polygon>`:

| Facet (vertices) | Fill |
|---|---|
| center → upper-left → top | `#4A453D` |
| center → top → upper-right | `#3A352D` |
| center → upper-right → lower-right | `#1A1814` |
| center → lower-right → bottom | `#0F0D0A` |
| center → bottom → lower-left | `#1A1814` |
| center → lower-left → upper-left | `#2A2620` |

Vertices (rounded to 2dp):
- top `(16, 2)`
- upper-right `(28.12, 9)`
- lower-right `(28.12, 23)`
- bottom `(16, 30)`
- lower-left `(3.88, 23)`
- upper-left `(3.88, 9)`
- center `(16, 16)`

See `VolumeMark` in `schedule-app.jsx` for the exact JSX. Also use
this same shape in `public/favicon.svg` (single dark fill `#1A1814` is
fine for the favicon — faceted mark in the sidebar only).

## Interactions

The interactive behaviour that already exists in
`SchedulePage.tsx` / `ActivityCard.tsx` (drag-and-drop via
`@hello-pangea/dnd`, click-to-open `ActivityDetailPanel`, week
navigation, hover delete affordance, log/completion indicator) is
**all preserved**. The redesign is visual only — same React
component tree, same hooks, same handlers.

Things to verify still work post-redesign:
- Drag a card between columns.
- Drag a card within a column to reorder.
- Click a card → opens `ActivityDetailPanel`.
- Click "+ Add activity" → opens `AddActivityModal`.
- Click week picker arrows → navigates weeks.
- Click "This week" label (when not on the current week) → returns
  to current week.
- Logged-activity indicator (currently the small dark check badge
  in the bottom-right of `ActivityCard`) needs a new visual on the
  redesigned card — see the note below.

### Logged-activity indicator (not in the mock)

The mock does not show what a logged/completed activity looks like.
Match the rest of the design: replace the existing dark filled circle
with a small **inline check icon** in the card eyebrow row, aligned
to the right (replace or sit next to the grade chip). Use color
`--ink-3` for the check; do not dim the entire card. The 0.6 opacity
"logged-card" dim that exists in `schedule.module.css` today should
also go — the inline check is enough signal.

### Drag-scroll the board

The existing `SchedulePage.tsx` implements click-and-drag horizontal
scrolling on empty board area via the `onBoardMouseDown` /
`onBoardMouseMove` handlers. Preserve it.

## State management

No changes from current. The redesign uses the same data shapes
defined in `src/types/index.ts` (`Activity`, `Day`, `Kind`, `Block`,
`Goal`, `Columns`, `DbActivity`) and the same hooks
(`useWeekActivities`, `useGoals`, `useActivityLog`).

The mock's `WEEK` and `GOALS` arrays in `schedule-app.jsx` are
**demo data only** — do not port them. The real data plumbing
already exists.

## What's NOT in this handoff

- `AddActivityModal` redesign — separate task.
- `IntentPickerModal` redesign — separate task.
- `ActivityDetailPanel` redesign — separate task.
- `SkillTreePage` redesign — separate task.
- `ActivitiesPage` redesign — separate task.
- Mobile / responsive behaviour — current design assumes a desktop
  viewport, same as the existing app.
- Dark mode — not designed.

## Optional: paper grain texture

The user has so far stuck with a **flat** wall background. If you
later want the subtle paper-grain texture I considered, layer this
on `.wall-bg`:

```css
.wall-bg {
  background-color: var(--wall-base);
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='2' seed='4' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.10 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  background-size: 240px 240px;
}
```

That `0.10` alpha is the "fine grain" level; the user rejected
heavier values.

## Assets

No raster images, no external icons, no fonts beyond Bricolage
Grotesque + JetBrains Mono (both via Google Fonts). The hexagonal
brand mark is inline SVG.
