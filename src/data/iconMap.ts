import {
  SportShoe, Dumbbell, ShieldPlus, Target, PersonStanding,
  BicepsFlexed, HandFist, Footprints, Scale, Eye, Brain,
  Zap, Mountain,
  type LucideIcon,
} from "lucide-react";
import { SKILL_TREE } from "./skillTree";
import { getAllLeaves, getLeafAncestors } from "../lib/skillTreeLookup";

export const ICON_MAP: Record<string, LucideIcon> = {
  // Top-level categories
  "technique": SportShoe,
  "mobility": PersonStanding,
  "mental": Target,
  "strength": Dumbbell,
  "longevity": ShieldPlus,
  // Subcategories
  "footwork": Footprints,
  "body-positioning": Scale,
  "tactics": Eye,
  "psychological": Brain,
  "fingers": HandFist,
  "upper-body": BicepsFlexed,
  // Synthetic intent
  "just-climbing": Mountain,
};

export function getIconFor(id: string): LucideIcon {
  return ICON_MAP[id] ?? Zap;
}

// Resolve each leaf's inherited icon once at module load — `getIconForLeaf` is
// called inside picker map-loops, so per-call tree walks would be O(leaves²).
const LEAF_ICON_MAP: Record<string, LucideIcon> = (() => {
  const out: Record<string, LucideIcon> = {};
  for (const leaf of getAllLeaves(SKILL_TREE)) {
    const ancestors = getLeafAncestors(SKILL_TREE, leaf.id);
    const parent = ancestors[ancestors.length - 1];
    out[leaf.id] = getIconFor(parent ? parent.id : leaf.id);
  }
  return out;
})();

export function getIconForLeaf(leafId: string): LucideIcon {
  return LEAF_ICON_MAP[leafId] ?? getIconFor(leafId);
}
