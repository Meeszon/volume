import { describe, it, expect } from "vitest";
import type { TreeNode } from "../types";
import {
  getAllIntentsForKind,
  getGoalIntentsForKind,
  getRecentIntentsForKind,
  getSyntheticJustClimbing,
} from "./intentResolver";
import { JUST_CLIMBING_LEAF_ID } from "../data/syntheticIntents";

const MOCK_TREE: TreeNode[] = [
  {
    id: "technique",
    label: "Technique",
    children: [
      {
        id: "footwork",
        label: "Footwork",
        allowedKinds: ["climb"],
      },
      {
        id: "finger-strength",
        label: "Finger Strength",
        allowedKinds: ["climb", "train"],
      },
    ],
  },
  {
    id: "mobility",
    label: "Mobility",
    children: [
      {
        id: "hip-mobility",
        label: "Hip Mobility",
        allowedKinds: ["train"],
      },
    ],
  },
];

describe("getAllIntentsForKind", () => {
  it("returns only Climb-allowed leaves for Climb", () => {
    const ids = getAllIntentsForKind("climb", MOCK_TREE).map((l) => l.id);
    expect(ids).toEqual(["footwork", "finger-strength"]);
  });

  it("returns only Train-allowed leaves for Train", () => {
    const ids = getAllIntentsForKind("train", MOCK_TREE).map((l) => l.id);
    expect(ids).toEqual(["finger-strength", "hip-mobility"]);
  });

  it("returns [] for Warmup (no leaf is warmup-allowed)", () => {
    expect(getAllIntentsForKind("warmup", MOCK_TREE)).toEqual([]);
  });

  it("does not include the synthetic Just Climbing leaf", () => {
    const ids = getAllIntentsForKind("climb", MOCK_TREE).map((l) => l.id);
    expect(ids).not.toContain(JUST_CLIMBING_LEAF_ID);
  });
});

describe("getSyntheticJustClimbing", () => {
  it("returns the Just Climbing leaf", () => {
    const leaf = getSyntheticJustClimbing();
    expect(leaf.id).toBe(JUST_CLIMBING_LEAF_ID);
    expect(leaf.label).toBe("Just Climbing");
  });

  it("the synthetic leaf is Climb-only", () => {
    expect(getSyntheticJustClimbing().allowedKinds).toEqual(["climb"]);
  });
});

describe("getGoalIntentsForKind", () => {
  it("returns goal leaves filtered by current Kind", () => {
    const goals = [
      { leafId: "footwork" },
      { leafId: "hip-mobility" },
      { leafId: "finger-strength" },
    ];
    const climbIds = getGoalIntentsForKind("climb", goals, MOCK_TREE).map(
      (l) => l.id,
    );
    expect(climbIds).toEqual(["footwork", "finger-strength"]);

    const trainIds = getGoalIntentsForKind("train", goals, MOCK_TREE).map(
      (l) => l.id,
    );
    expect(trainIds).toEqual(["hip-mobility", "finger-strength"]);
  });

  it("preserves goal order", () => {
    const goals = [
      { leafId: "finger-strength" },
      { leafId: "footwork" },
    ];
    const ids = getGoalIntentsForKind("climb", goals, MOCK_TREE).map(
      (l) => l.id,
    );
    expect(ids).toEqual(["finger-strength", "footwork"]);
  });

  it("skips unknown leaf ids", () => {
    const goals = [
      { leafId: "footwork" },
      { leafId: "ghost-leaf" },
    ];
    const ids = getGoalIntentsForKind("climb", goals, MOCK_TREE).map(
      (l) => l.id,
    );
    expect(ids).toEqual(["footwork"]);
  });

  it("returns [] when goals is empty", () => {
    expect(getGoalIntentsForKind("climb", [], MOCK_TREE)).toEqual([]);
  });

  it("does not return the synthetic Just Climbing leaf even if it appears as a goal", () => {
    const goals = [{ leafId: JUST_CLIMBING_LEAF_ID }, { leafId: "footwork" }];
    const ids = getGoalIntentsForKind("climb", goals, MOCK_TREE).map(
      (l) => l.id,
    );
    // Just-Climbing is a synthetic, not a real Goal target — but if the
    // resolver receives it, it should at least surface only via the Climb
    // pinned slot, not by inflating Goals tab content with a synthetic.
    expect(ids).not.toContain(JUST_CLIMBING_LEAF_ID);
  });
});

describe("getRecentIntentsForKind", () => {
  it("returns recents in given order, filtered by Kind", () => {
    const recentIds = ["finger-strength", "hip-mobility", "footwork"];
    const ids = getRecentIntentsForKind("climb", recentIds, MOCK_TREE).map(
      (l) => l.id,
    );
    expect(ids).toEqual(["finger-strength", "footwork"]);
  });

  it("includes the synthetic Just Climbing leaf when Kind = Climb", () => {
    const recentIds = [JUST_CLIMBING_LEAF_ID, "footwork"];
    const ids = getRecentIntentsForKind("climb", recentIds, MOCK_TREE).map(
      (l) => l.id,
    );
    expect(ids).toEqual([JUST_CLIMBING_LEAF_ID, "footwork"]);
  });

  it("excludes the synthetic Just Climbing leaf when Kind ≠ Climb", () => {
    const recentIds = [JUST_CLIMBING_LEAF_ID, "hip-mobility"];
    const ids = getRecentIntentsForKind("train", recentIds, MOCK_TREE).map(
      (l) => l.id,
    );
    expect(ids).toEqual(["hip-mobility"]);
  });

  it("skips unknown leaf ids", () => {
    const recentIds = ["ghost-leaf", "footwork"];
    const ids = getRecentIntentsForKind("climb", recentIds, MOCK_TREE).map(
      (l) => l.id,
    );
    expect(ids).toEqual(["footwork"]);
  });

  it("returns [] when recentIds is empty", () => {
    expect(getRecentIntentsForKind("climb", [], MOCK_TREE)).toEqual([]);
  });
});
