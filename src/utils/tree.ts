import type { TreeNode, TreeLeaf } from "../types";

export function isLeaf(node: TreeNode): node is TreeLeaf {
  return !("children" in node);
}
