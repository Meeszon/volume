import { describe, it, expect } from "vitest";
import type { TreeNode } from "../types";
import {
  getAllIntentsForKind,
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
        exercises: [],
      },
      {
        id: "finger-strength",
        label: "Finger Strength",
        allowedKinds: ["climb", "train"],
        exercises: [],
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
        exercises: [],
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
