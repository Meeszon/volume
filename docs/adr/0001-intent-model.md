# ADR 0001 — The Intent Model

**Status:** Accepted (2026-05-19)

## Context

Volume is a climbing-focused training scheduler. Its core differentiator is
_bringing intent into a session_ — the user wants to know what they are
choosing to train, see when categories are being forgotten, and connect
long-term goals to per-session decisions.

Before this decision the codebase carried **three overlapping models** trying
to express "intent":

1. **`FocusOption`** — a hardcoded enum of 5 values (Endurance, Power,
   Technique, Footwork, Finger Strength), attached as an _optional_ `focus`
   field to Climbing-type Activities only.
2. **`SKILL_TREE`** — a rich hierarchical taxonomy of ~17 leaves grouped
   under 5 categories. Rendered by a separate Skill Tree page but **not
   connected** to scheduled Activities.
3. **`Goal`** — `{ areaId, selectedNodeIds[], isPrimary }` in `GoalsContext`,
   up to 3 per user. Rendered by a Goals dashboard but **not connected** to
   scheduled Activities.

These three overlapped (e.g. "Finger Strength" appears as a `FocusOption`
value, a `SKILL_TREE` leaf, and a possible Goal target), did not share an
identifier space, and only one of them — Focus — was actually attached to
sessions, and only for Climbing.

The Activity Type taxonomy was `climbing | conditioning | mobility | warmup`
(4 values). The user identified gaps: board / campus / fingerboard sessions
had no home, and core training had no home.

## Decision

Adopt a single unified Intent Model with the following components.

### 1. Activity Kind: 3 values, not 5

```ts
Kind = "climb" | "warmup" | "train"
```

The earlier 5-value taxonomy (Climbing / Power / Conditioning / Mobility /
Warmup) was redundant: Power, Conditioning, and Mobility were only
distinguished by _where in the Skill Tree their Intent landed_, not by
anything structurally distinct. They collapse into a single `train` kind.
**The tree itself is the type system for Train sessions.**

Per-leaf `allowedKinds: ("climb" | "train")[]` declares reachability:

- `footwork`, `route-reading` → `["climb"]`
- `finger-strength`, `power-endurance` → `["climb", "train"]`
- `hip-mobility`, `antagonist-training` → `["train"]`

Warmups don't draw from the tree at all.

### 2. Intent: a Skill Tree leaf, attached to every non-Warmup Activity

```ts
Activity.intentLeafId: string
```

Replaces `FocusOption`. Required on Climb and Train; absent on Warmup. A
synthetic `just-climbing` pseudo-intent exists for Climb sessions with no
training purpose ("fun climb with friends") — it satisfies the
required-Intent rule but is excluded from the forgotten-categories rollup.

The Intent Picker is a dedicated 3-tab modal: **All** (tree drill-down) /
**Goals** / **Recents**. All three tabs filter by the current Kind's
`allowedKinds`.

### 3. Goal: a single tree leaf the user has committed to

```ts
Goal { leafId: string }
```

Replaces `Goal { areaId, selectedNodeIds[], isPrimary }`. Same identifier
space as Intent — a Goal _is_ a leaf-you've-committed-to; an Intent _is_
a leaf-picked-for-a-session. Up to **5 Goals**, **no Primary** (the old
flag had no functional dependents; vestigial). Set / removed on the Skill
Tree page via `SkillDetailPanel`.

### 4. Block: the training prescription for Train and Warmup activities

```ts
Block { exercises: ExerciseDetail[] }
```

**All training is in Blocks.** The old `ActivityTemplate.kind === "exercise"`
standalone variant is removed. Train-reachable leaves carry **one or many**
Blocks (e.g. `finger-strength` carries "Hangboard Repeaters" + "Max Hangs"
+ "Min Edge" — same Intent, different protocols). Warmup Blocks live in a
small library outside the tree.

### 5. `LoadSummaryBar` shows Goal coverage, not Type counts

The weekly bar drops the type-count rollup entirely. Replaces it with up to
5 Goal rows (one per Goal, counting this-week Activities targeting that
leaf) plus an "Other intents this week" tail. Compact + expandable.

### 6. Skill Tree page becomes a longer-window heat-map

The Skill Tree page gains a heat-map of Intent usage over ~30 days,
surfacing neglected categories. Same surface that defines what intents exist
becomes the surface that shows how the user has used them.

## Consequences

**Removed from the model:**

- `FocusOption` enum, `Activity.focus` field, `FOCUS_OPTIONS` constant.
- `ActivityType` values `climbing | conditioning | mobility` (collapsed
  under `train`); Type renamed to Kind.
- `ActivityTemplate.kind === "exercise"` variant.
- `Activity.durationMinutes` — Climb has no duration; Train duration is
  implied by the Block.
- `Goal.areaId`, `Goal.selectedNodeIds`, `Goal.isPrimary`.

**Added to the model:**

- `Activity.kind: Kind`.
- `Activity.intentLeafId: string | null` (null only when `kind === "warmup"`).
- `Activity.block: Block` (for Train and Warmup).
- `SkillTreeLeaf.allowedKinds: Kind[]`.
- `SkillTreeLeaf.blocks: Block[]` (for Train-reachable leaves).
- A warmup Block library (separate from the tree).
- `Goal { leafId }`, max 5.

**UI changes:**

- `AddActivityModal` rewritten: `Kind → Intent picker (modal) → Block picker
  (Train only) → edit → submit`. Climb is 2 picks, Train is 3, Warmup is 1.
- The 3-tab Intent picker is a new modal.
- `LoadSummaryBar` rewritten: goal-centric, drops type counts.
- `SkillDetailPanel` gains "Set as Goal" / "Remove Goal" action.
- `SkillTreePage` gets goal-leaf highlighting and (deferred) intent-usage
  heat-map.

**Behavioral changes:**

- Intent is required on every Climb and Train Activity — forces deliberate
  choice.
- Goals must be specific leaves, not categories — forces specificity.
- The two rollups (weekly Goal-coverage on `LoadSummaryBar`; 30-day heat-map
  on Skill Tree page) replace the prior single Type-count rollup.

**Migration:**

Existing Activities, Focus values, and Goals are wiped rather than migrated
— the app is in early development with no production users.

## Alternatives Considered

- **Three competing intent models (status quo).** Keep Focus, Skill Tree,
  and Goals separate. Rejected — produced confusion, none of them actually
  drove Activity behavior beyond the single optional Focus field on Climbing.
- **Loose coupling between Type and Intent.** Any Type could have any
  Intent. Rejected — the user's mental model is more selective (a Climbing
  session shouldn't have Hip Mobility as its intent).
- **Strict category-locked coupling.** Each Type maps to exactly one tree
  Category. Rejected — too rigid (Finger Strength is legitimately both
  Climb-trainable and Train-trainable).
- **Type as one dimension with Intent.** Make the Type and the Intent's
  category the same field. Rejected — collapses the cross-product (Climb
  session × Finger Strength intent) that the model is trying to preserve.
- **Goal as Category + sub-nodes** (existing code). Rejected — produces
  structural duplication of the tree itself; Goal = leaf is simpler and
  forces specificity.
- **Keep `kind: "exercise"` templates alongside Blocks.** Rejected — every
  training session in practice is a block (or a single-exercise block); the
  dual-shape adds complexity without benefit.
- **Keep `Goal.isPrimary`.** Rejected — no functional dependents; vestigial.
- **5 Activity Kinds instead of 3** (Climbing, Power, Conditioning,
  Mobility, Warmup). Rejected — Power / Conditioning / Mobility had no
  structural distinction beyond their typical Intent neighborhood in the
  tree.
