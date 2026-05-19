import { describe, it, expect } from "vitest";
import type { TreeNode } from "../types";
import {
  findLeaf,
  getAllLeaves,
  getLeafCategory,
  getLeavesByKind,
} from "./skillTreeLookup";

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

describe("getAllLeaves", () => {
  it("returns every leaf in the tree", () => {
    const ids = getAllLeaves(MOCK_TREE).map((l) => l.id);
    expect(ids).toEqual(["footwork", "finger-strength", "hip-mobility"]);
  });

  it("returns [] for an empty tree", () => {
    expect(getAllLeaves([])).toEqual([]);
  });
});

describe("findLeaf", () => {
  it("returns the leaf when the id matches", () => {
    expect(findLeaf(MOCK_TREE, "footwork")?.label).toBe("Footwork");
  });

  it("returns null when the id does not match", () => {
    expect(findLeaf(MOCK_TREE, "nope")).toBeNull();
  });

  it("does not match a branch id", () => {
    expect(findLeaf(MOCK_TREE, "technique")).toBeNull();
  });
});

describe("getLeafCategory", () => {
  it("returns the top-level branch containing the leaf", () => {
    expect(getLeafCategory(MOCK_TREE, "footwork")?.id).toBe("technique");
    expect(getLeafCategory(MOCK_TREE, "hip-mobility")?.id).toBe("mobility");
  });

  it("returns null when the leaf id is not found", () => {
    expect(getLeafCategory(MOCK_TREE, "nope")).toBeNull();
  });
});

describe("getLeavesByKind", () => {
  it("returns leaves with 'climb' in allowedKinds", () => {
    const ids = getLeavesByKind(MOCK_TREE, "climb").map((l) => l.id);
    expect(ids).toEqual(["footwork", "finger-strength"]);
  });

  it("returns leaves with 'train' in allowedKinds", () => {
    const ids = getLeavesByKind(MOCK_TREE, "train").map((l) => l.id);
    expect(ids).toEqual(["finger-strength", "hip-mobility"]);
  });

  it("returns [] when no leaves match", () => {
    expect(getLeavesByKind(MOCK_TREE, "warmup")).toEqual([]);
  });
});
