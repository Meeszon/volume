import type { TreeLeaf } from "../types";

// Reserved leaf-id for the synthetic "Just Climbing" intent. Lives outside
// SKILL_TREE but shares the leaf-id identifier space.
export const JUST_CLIMBING_LEAF_ID = "just-climbing";

export const JUST_CLIMBING_LEAF: TreeLeaf = {
  id: JUST_CLIMBING_LEAF_ID,
  label: "Just Climbing",
  description: "Going to the wall to climb — no training intent.",
  allowedKinds: ["climb"],
};
