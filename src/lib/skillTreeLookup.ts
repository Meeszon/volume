import type { Kind, TreeBranch, TreeLeaf, TreeNode } from "../types";
import { isLeaf } from "../utils/tree";

export function getAllLeaves(tree: TreeNode[]): TreeLeaf[] {
  const out: TreeLeaf[] = [];
  function walk(nodes: TreeNode[]): void {
    for (const n of nodes) {
      if (isLeaf(n)) out.push(n);
      else walk(n.children);
    }
  }
  walk(tree);
  return out;
}

export function findLeaf(tree: TreeNode[], leafId: string): TreeLeaf | null {
  function walk(nodes: TreeNode[]): TreeLeaf | null {
    for (const n of nodes) {
      if (isLeaf(n)) {
        if (n.id === leafId) return n;
      } else {
        const found = walk(n.children);
        if (found) return found;
      }
    }
    return null;
  }
  return walk(tree);
}

export function getLeafCategory(
  tree: TreeNode[],
  leafId: string,
): TreeBranch | null {
  for (const top of tree) {
    if (isLeaf(top)) continue;
    if (containsLeaf(top, leafId)) return top;
  }
  return null;
}

// Walks the tree and returns the chain of TreeBranch ancestors of a leaf,
// closest-first. Empty array if the leaf isn't found.
export function getLeafAncestors(
  tree: TreeNode[],
  leafId: string,
): TreeBranch[] {
  function walk(nodes: TreeNode[], chain: TreeBranch[]): TreeBranch[] | null {
    for (const n of nodes) {
      if (isLeaf(n)) {
        if (n.id === leafId) return chain;
      } else {
        const next = walk(n.children, [...chain, n]);
        if (next) return next;
      }
    }
    return null;
  }
  return walk(tree, []) ?? [];
}

function containsLeaf(branch: TreeBranch, leafId: string): boolean {
  for (const child of branch.children) {
    if (isLeaf(child)) {
      if (child.id === leafId) return true;
    } else if (containsLeaf(child, leafId)) {
      return true;
    }
  }
  return false;
}

export function getLeavesByKind(tree: TreeNode[], kind: Kind): TreeLeaf[] {
  return getAllLeaves(tree).filter((l) => l.allowedKinds.includes(kind));
}
