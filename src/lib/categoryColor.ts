import type { Activity } from "../types";
import { SKILL_TREE, CATEGORY_COLORS } from "../data/skillTree";
import { JUST_CLIMBING_LEAF_ID } from "../data/syntheticIntents";
import { getLeafCategory } from "./skillTreeLookup";

const NEUTRAL = "#6a6359";

export function getActivityCategoryColor(activity: Activity): string {
  if (activity.kind === "warmup") return NEUTRAL;
  if (activity.intentLeafId === JUST_CLIMBING_LEAF_ID) return NEUTRAL;
  if (!activity.intentLeafId) return NEUTRAL;
  const category = getLeafCategory(SKILL_TREE, activity.intentLeafId);
  if (!category) return NEUTRAL;
  return CATEGORY_COLORS[category.id] ?? NEUTRAL;
}
