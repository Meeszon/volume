import { describe, it, expect } from "vitest";
import type { DbActivity, Goal } from "../types";
import { JUST_CLIMBING_LEAF_ID } from "../data/syntheticIntents";
import { getGoalCoverage, getOtherIntentsThisWeek } from "./goalCoverage";

const WEEK_START = new Date(2026, 4, 18); // Mon 18 May 2026
const WEEK_END = new Date(2026, 4, 24); // Sun 24 May 2026

function makeActivity(overrides: Partial<DbActivity>): DbActivity {
  return {
    id: overrides.id ?? `act-${Math.random()}`,
    user_id: "user-1",
    scheduled_date: overrides.scheduled_date ?? "2026-05-20",
    kind: overrides.kind ?? "climb",
    intent_leaf_id: overrides.intent_leaf_id ?? null,
    block: overrides.block ?? null,
    order: overrides.order ?? 0,
    created_at: overrides.created_at ?? "2026-05-20T00:00:00Z",
  };
}

describe("getGoalCoverage", () => {
  it("returns one entry per goal with the count of in-window activities targeting it", () => {
    const goals: Goal[] = [{ leafId: "footwork" }, { leafId: "finger-strength" }];
    const activities = [
      makeActivity({ kind: "climb", intent_leaf_id: "footwork" }),
      makeActivity({ kind: "climb", intent_leaf_id: "footwork" }),
      makeActivity({ kind: "train", intent_leaf_id: "finger-strength" }),
    ];

    expect(getGoalCoverage(activities, goals, WEEK_START, WEEK_END)).toEqual([
      { leafId: "footwork", count: 2 },
      { leafId: "finger-strength", count: 1 },
    ]);
  });

  it("preserves goal order in the returned list", () => {
    const goals: Goal[] = [
      { leafId: "finger-strength" },
      { leafId: "footwork" },
      { leafId: "hip-mobility" },
    ];

    expect(
      getGoalCoverage([], goals, WEEK_START, WEEK_END).map((c) => c.leafId),
    ).toEqual(["finger-strength", "footwork", "hip-mobility"]);
  });

  it("returns zero-count rows for goals with no matching activities", () => {
    const goals: Goal[] = [{ leafId: "footwork" }, { leafId: "hip-mobility" }];
    const activities = [
      makeActivity({ kind: "climb", intent_leaf_id: "footwork" }),
    ];

    expect(getGoalCoverage(activities, goals, WEEK_START, WEEK_END)).toEqual([
      { leafId: "footwork", count: 1 },
      { leafId: "hip-mobility", count: 0 },
    ]);
  });

  it("excludes Warmup activities", () => {
    const goals: Goal[] = [{ leafId: "footwork" }];
    const activities = [
      makeActivity({ kind: "climb", intent_leaf_id: "footwork" }),
      // A Warmup with a stray intent_leaf_id should still be excluded.
      makeActivity({ kind: "warmup", intent_leaf_id: "footwork" }),
    ];

    expect(getGoalCoverage(activities, goals, WEEK_START, WEEK_END)).toEqual([
      { leafId: "footwork", count: 1 },
    ]);
  });

  it("excludes Just-Climbing activities", () => {
    const goals: Goal[] = [{ leafId: JUST_CLIMBING_LEAF_ID }];
    const activities = [
      makeActivity({ kind: "climb", intent_leaf_id: JUST_CLIMBING_LEAF_ID }),
      makeActivity({ kind: "climb", intent_leaf_id: JUST_CLIMBING_LEAF_ID }),
    ];

    expect(getGoalCoverage(activities, goals, WEEK_START, WEEK_END)).toEqual([
      { leafId: JUST_CLIMBING_LEAF_ID, count: 0 },
    ]);
  });

  it("ignores activities outside the supplied week window", () => {
    const goals: Goal[] = [{ leafId: "footwork" }];
    const activities = [
      makeActivity({ scheduled_date: "2026-05-17", intent_leaf_id: "footwork" }), // before
      makeActivity({ scheduled_date: "2026-05-18", intent_leaf_id: "footwork" }), // start (inclusive)
      makeActivity({ scheduled_date: "2026-05-24", intent_leaf_id: "footwork" }), // end (inclusive)
      makeActivity({ scheduled_date: "2026-05-25", intent_leaf_id: "footwork" }), // after
    ];

    expect(getGoalCoverage(activities, goals, WEEK_START, WEEK_END)).toEqual([
      { leafId: "footwork", count: 2 },
    ]);
  });

  it("returns [] when there are no goals", () => {
    const activities = [
      makeActivity({ kind: "climb", intent_leaf_id: "footwork" }),
    ];
    expect(getGoalCoverage(activities, [], WEEK_START, WEEK_END)).toEqual([]);
  });

  it("does not count activities whose intent_leaf_id is not a goal", () => {
    const goals: Goal[] = [{ leafId: "footwork" }];
    const activities = [
      makeActivity({ kind: "climb", intent_leaf_id: "finger-strength" }),
    ];
    expect(getGoalCoverage(activities, goals, WEEK_START, WEEK_END)).toEqual([
      { leafId: "footwork", count: 0 },
    ]);
  });
});

describe("getOtherIntentsThisWeek", () => {
  it("counts in-window non-goal intents, sorted by count desc", () => {
    const goals: Goal[] = [{ leafId: "footwork" }];
    const activities = [
      makeActivity({ kind: "climb", intent_leaf_id: "footwork" }),
      makeActivity({ kind: "climb", intent_leaf_id: "body-positioning" }),
      makeActivity({ kind: "climb", intent_leaf_id: "body-positioning" }),
      makeActivity({ kind: "train", intent_leaf_id: "finger-strength" }),
    ];

    expect(
      getOtherIntentsThisWeek(activities, goals, WEEK_START, WEEK_END),
    ).toEqual([
      { leafId: "body-positioning", count: 2 },
      { leafId: "finger-strength", count: 1 },
    ]);
  });

  it("excludes Warmup and Just-Climbing activities", () => {
    const activities = [
      makeActivity({ kind: "warmup", intent_leaf_id: null }),
      makeActivity({ kind: "climb", intent_leaf_id: JUST_CLIMBING_LEAF_ID }),
      makeActivity({ kind: "climb", intent_leaf_id: "body-positioning" }),
    ];

    expect(getOtherIntentsThisWeek(activities, [], WEEK_START, WEEK_END)).toEqual(
      [{ leafId: "body-positioning", count: 1 }],
    );
  });

  it("ignores activities outside the week window", () => {
    const activities = [
      makeActivity({ scheduled_date: "2026-05-10", intent_leaf_id: "footwork" }),
      makeActivity({ scheduled_date: "2026-05-20", intent_leaf_id: "footwork" }),
    ];

    expect(getOtherIntentsThisWeek(activities, [], WEEK_START, WEEK_END)).toEqual(
      [{ leafId: "footwork", count: 1 }],
    );
  });

  it("returns [] when no non-goal activities are in the window", () => {
    const goals: Goal[] = [{ leafId: "footwork" }];
    const activities = [
      makeActivity({ kind: "climb", intent_leaf_id: "footwork" }),
    ];
    expect(
      getOtherIntentsThisWeek(activities, goals, WEEK_START, WEEK_END),
    ).toEqual([]);
  });
});
