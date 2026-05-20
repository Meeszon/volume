import type { Goal, Kind, TreeLeaf, TreeNode } from "../types";
import {
  JUST_CLIMBING_LEAF,
  JUST_CLIMBING_LEAF_ID,
} from "../data/syntheticIntents";
import { findLeaf, getLeavesByKind } from "./skillTreeLookup";

export function getAllIntentsForKind(
  kind: Kind,
  tree: TreeNode[],
): TreeLeaf[] {
  return getLeavesByKind(tree, kind);
}

export function getSyntheticJustClimbing(): TreeLeaf {
  return JUST_CLIMBING_LEAF;
}

function resolveLeaf(
  leafId: string,
  kind: Kind,
  tree: TreeNode[],
): TreeLeaf | null {
  if (leafId === JUST_CLIMBING_LEAF_ID) {
    return kind === "climb" ? JUST_CLIMBING_LEAF : null;
  }
  const leaf = findLeaf(tree, leafId);
  if (!leaf) return null;
  return leaf.allowedKinds.includes(kind) ? leaf : null;
}

export function getGoalIntentsForKind(
  kind: Kind,
  goals: Goal[],
  tree: TreeNode[],
): TreeLeaf[] {
  const out: TreeLeaf[] = [];
  for (const g of goals) {
    if (g.leafId === JUST_CLIMBING_LEAF_ID) continue;
    const leaf = resolveLeaf(g.leafId, kind, tree);
    if (leaf) out.push(leaf);
  }
  return out;
}

export function getRecentIntentsForKind(
  kind: Kind,
  recentIds: string[],
  tree: TreeNode[],
): TreeLeaf[] {
  const out: TreeLeaf[] = [];
  for (const id of recentIds) {
    const leaf = resolveLeaf(id, kind, tree);
    if (leaf) out.push(leaf);
  }
  return out;
}
