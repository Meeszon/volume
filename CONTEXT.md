# Volume — Domain Glossary

Canonical vocabulary for this app. Don't drift to synonyms; flag conflicts.

## Activity

A single scheduled session on the weekly board. Belongs to one Day, has one
**Kind** (Climb / Warmup / Train), and — unless it's a Warmup — one **Intent**.
Train and Warmup Activities also carry a **Block** (a training prescription).
Climb Activities carry no Block and no duration. An Activity is the unit
users add, drag, complete, and log.

## Activity Kind

What top-level shape this session has. Three kinds:

- **Climb** — wall climbing. Has an Intent (a Skill Tree leaf), no template,
  no duration. Flow: pick Climb → pick Intent → done.
- **Warmup** — pre-session scaffolding. Has a template (from a small warmup
  library, e.g. "General Warmup", "On-the-Wall Warmup", "Finger Warmup"). No
  Intent — Warmups don't count as training. Flow: pick Warmup → pick warmup
  template → done.
- **Train** — any non-climbing training: strength, mobility, conditioning,
  power. Has an Intent (a Skill Tree leaf) AND a Block (a training
  prescription tied to that leaf). The tree _is_ the type system for Train —
  there are no "Power session" / "Conditioning session" / "Mobility session"
  identities separate from where you land in the tree. Flow: pick Train →
  drill tree via Intent picker → pick leaf → pick Block → edit defaults →
  submit.

> Renamed from "Activity Type." The earlier 5-value taxonomy (Climbing /
> Power / Conditioning / Mobility / Warmup) collapsed because Power,
> Conditioning, and Mobility were all distinguished by _where in the tree_
> their Intent landed, not by anything structurally distinct. Collapsing
> them removes redundancy.

Per-leaf `allowedKinds` tag declares whether a leaf is reachable from Climb,
Train, or both:

- `footwork`, `route-reading`, `dynamic-movement`, `just-climbing` → Climb only
- `finger-strength`, `power-endurance` → Climb + Train (wall finger work
  vs. hangboard finger work)
- `hip-mobility`, `shoulder-mobility`, `antagonist-training` → Train only

Warmups don't draw from the tree at all.

## Intent

A user's stated reason for an Activity — _what they are choosing to train this
session_. Required on every non-Warmup Activity (so: required on Climb and
Train). Used to drive the forgotten-categories rollup ("you've done 6
sessions this month but 0 were Technique-intent").

An Intent is one of:

- A **Skill Tree leaf** (e.g. `footwork`, `finger-strength`). The primary case.
- The synthetic **Just Climbing** intent — pinned above the tree in the picker
  when Kind = Climb, satisfies the Intent-required rule, but is excluded from
  the forgotten-categories rollup. Used for fun / social / non-training climbs.

Distinct from **Focus** (the old hardcoded 5-option enum on climbing sessions —
removed) and from **Goal** (a longer-horizon commitment, same identifier space).

## Block

A named, ordered list of exercises with default sets / reps-or-seconds / rest.
Every Train Activity has a Block; every Warmup Activity has a Block; Climb
Activities have none. Replaces the old `ActivityTemplate` model:

- The `kind: "exercise"` variant is removed — there are no standalone-exercise
  Activities anymore. A "Weighted Pull Ups" session is a Block (possibly with
  one exercise, possibly bundled with related accessory work).
- For Train: Blocks are owned by Skill Tree leaves. A leaf can carry **one
  or many** Blocks (e.g. `finger-strength` could carry "Hangboard Repeaters",
  "Max Recruitment Hangs", "Minimum Edge" — same Intent, different protocols).
- For Warmup: Blocks live in a small warmup library outside the tree.

When the user picks an Intent (leaf) during Train, they then pick which of
that leaf's Blocks they're doing, then edit defaults. Block contents are
editable per-Activity; the Block defaults are the starting point.

## Skill Tree

A hierarchical taxonomy of training intents: 5 top-level Categories, each
with Branches and Leaves. The single source of truth for what Intent values
exist. Each Leaf carries:

- `allowedKinds: ("climb" | "train")[]` — which Activity Kinds this leaf can
  be picked on.
- `blocks: Block[]` — for Train-reachable leaves, one or more training
  prescriptions tied to this intent.

> **Note:** the current tree contents (category names, leaf names, exercise
> prescriptions) are placeholder — they will be redesigned. The _structure_
> (Categories → Branches → Leaves, plus per-leaf `allowedKinds` and `blocks`)
> is what we're committing to.

Known direction for the redesign:

- **Longevity** category will mean _injury prevention / pre-hab work_ — done
  primarily in Train sessions. The current "Slopers / Crimps / Pinches"
  content (grip styles) does **not** belong under Longevity — it will move
  (likely under Technique or Strength), and its `allowedKinds` will be
  `["climb"]` (you train grip styles on the wall).

## Goal

A Skill Tree **leaf** the user has committed to working on. Up to **5 per
user**, no Primary (three-equal-among-five model). Same identifier space as
Intent — a Goal _is_ a leaf-you've-committed-to; an Intent _is_ a
leaf-picked-for-a-session. Two roles for the same leaf id, observed at
different time horizons.

```
Goal { leafId: string }
```

Set / removed on the **Skill Tree page**, via the existing
`SkillDetailPanel` (tap a leaf → "Set as Goal" / "Remove Goal"). Goal-marked
leaves are visually distinct in the tree.

Goals plug into the Intent picker via the **Goals tab** (lists the user's
goal leaf-ids, filtered by current Kind's `allowedKinds`). Goals also drive
the weekly bar in `LoadSummaryBar` — each Goal becomes a row counting how
many of this week's Activities used that leaf as their Intent.

Forces specificity: you cannot have a Goal like "the whole Mental category."
You commit to a specific leaf ("Fear Management"). Use multiple goal slots
if you want to span sub-areas.

## Intent Picker

A dedicated modal opened during Add-Activity (after Kind is picked; never for
Warmup). Three tabs:

1. **All** — full Skill Tree, drill-down through categories → leaves. Filtered
   by the current Kind's `allowedKinds`.
2. **Goals** — the user's goal leaf-ids (up to 5), filtered by current Kind.
3. **Recents** — last 5 picked Intents, filtered by current Kind.

The synthetic **Just Climbing** intent is pinned at the top of every tab when
Kind = Climb. Selecting it ends the flow (Climb has no Block step).

For Climb, picking an Intent (leaf) ends the picker — the Activity is created.
For Train, picking a leaf transitions to the leaf's Block picker (one or many
Blocks), then to an edit-defaults step, then submit.

### Visual design

Same visual vocabulary as `SkillTreePage` — **hex glyphs**, category colors,
Lucide icons — laid out for the small modal instead of the pentagon canvas:

- **All tab:** initial view shows a single row of 5 category hexes (color +
  icon + label). Tapping a category **collapses the row** (categories
  disappear) and replaces it with that category's leaves shown as smaller
  hexes, with a back-arrow to return to the category row. Drill behavior
  mirrors `SkillTreePage`'s expand-on-tap interaction. Only leaves whose
  `allowedKinds` includes the current Kind are rendered.
- **Goals tab:** flat row of the user's goal leaves as hexes (1–5),
  filtered by current Kind. Each hex carries its category color, icon, and
  label. Empty state when no goals set: a CTA pointing to the Skill Tree
  page.
- **Recents tab:** identical layout to Goals; contents are the last 5
  picked leaves (filtered, deduplicated, most-recent first). Empty state
  when no history: "No recent intents yet."
- **Just-Climbing hex** sits above the tab body whenever Kind = Climb.
  Tapping it ends the flow immediately (no Block step).

## LoadSummaryBar (weekly)

The top-of-schedule strip. **No longer tracks Activity Type counts** — those
are dropped. Tracks Goal coverage instead: one row per Goal (≤ 5 rows),
showing how many of this week's Activities used that Goal's leaf as their
Intent. Plus a tail of "Other intents this week" — Intents picked this week
that don't belong to any Goal. Compact by default, expandable for per-leaf
detail. Excludes Warmup Activities and Just-Climbing Intents.

Answers: _"what am I training this week, and am I working on my goals enough?"_

## Skill Tree Rollup (longer term)

The Skill Tree page becomes a heat-map of Intent usage over a longer window
(~30 days). Each leaf shows usage volume; neglected categories surface as
the warning signal ("you haven't trained Mental in 30 days"). The tree
becomes a visualization of where the user has actually been training, not
just a static reference.

## Activity Log

Per-Activity record of what actually happened: perceived intensity, sets/reps,
notes. Stored locally (today) keyed by Activity id. Separate from Intent — Intent
is the plan, Log is the outcome.
