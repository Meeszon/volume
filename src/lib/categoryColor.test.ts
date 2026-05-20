import { describe, it, expect } from "vitest";
import { getActivityCategoryColor } from "./categoryColor";
import { CATEGORY_COLORS } from "../data/skillTree";
import { JUST_CLIMBING_LEAF_ID } from "../data/syntheticIntents";
import type { Activity } from "../types";

const base = { id: "a", block: null } as const;

describe("getActivityCategoryColor", () => {
  it("returns the category color for a Train activity with a real leaf", () => {
    const activity: Activity = {
      ...base,
      kind: "train",
      intentLeafId: "finger-strength",
    };
    expect(getActivityCategoryColor(activity)).toBe(
      CATEGORY_COLORS["physical-strength"],
    );
  });

  it("returns the category color for a Climb activity with a real leaf", () => {
    const activity: Activity = {
      ...base,
      kind: "climb",
      intentLeafId: "footwork",
    };
    expect(getActivityCategoryColor(activity)).toBe(
      CATEGORY_COLORS["technique"],
    );
  });

  it("returns the neutral for a Climb activity with the Just Climbing intent", () => {
    const activity: Activity = {
      ...base,
      kind: "climb",
      intentLeafId: JUST_CLIMBING_LEAF_ID,
    };
    expect(getActivityCategoryColor(activity)).toBe("#7E7B73");
  });

  it("returns the neutral for a Warmup activity", () => {
    const activity: Activity = {
      ...base,
      kind: "warmup",
      intentLeafId: null,
    };
    expect(getActivityCategoryColor(activity)).toBe("#7E7B73");
  });

  it("returns the neutral for a Warmup activity even when an intentLeafId is set", () => {
    const activity: Activity = {
      ...base,
      kind: "warmup",
      intentLeafId: "footwork",
    };
    expect(getActivityCategoryColor(activity)).toBe("#7E7B73");
  });

  it("returns the neutral for a Climb/Train activity with an unknown intentLeafId", () => {
    const activity: Activity = {
      ...base,
      kind: "climb",
      intentLeafId: "unknown-leaf",
    };
    expect(getActivityCategoryColor(activity)).toBe("#7E7B73");
  });

  it("returns the neutral for a Climb/Train activity with a null intentLeafId", () => {
    const activity: Activity = {
      ...base,
      kind: "train",
      intentLeafId: null,
    };
    expect(getActivityCategoryColor(activity)).toBe("#7E7B73");
  });
});
