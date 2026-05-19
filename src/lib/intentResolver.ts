import type { Kind, TreeLeaf, TreeNode } from "../types";
import { JUST_CLIMBING_LEAF } from "../data/syntheticIntents";
import { getLeavesByKind } from "./skillTreeLookup";

export function getAllIntentsForKind(
  kind: Kind,
  tree: TreeNode[],
): TreeLeaf[] {
  return getLeavesByKind(tree, kind);
}

export function getSyntheticJustClimbing(): TreeLeaf {
  return JUST_CLIMBING_LEAF;
}
