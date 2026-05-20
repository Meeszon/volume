import type { DbActivity, Goal } from "../types";
import { JUST_CLIMBING_LEAF_ID } from "../data/syntheticIntents";

export interface GoalCoverage {
  leafId: string;
  count: number;
}

export interface IntentCount {
  leafId: string;
  count: number;
}

function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isCountable(activity: DbActivity): boolean {
  if (activity.kind === "warmup") return false;
  if (activity.intent_leaf_id === null) return false;
  if (activity.intent_leaf_id === JUST_CLIMBING_LEAF_ID) return false;
  return true;
}

function inWindow(
  activity: DbActivity,
  startISO: string,
  endISO: string,
): boolean {
  return (
    activity.scheduled_date >= startISO && activity.scheduled_date <= endISO
  );
}

export function getGoalCoverage(
  activities: DbActivity[],
  goals: Goal[],
  weekStart: Date,
  weekEnd: Date,
): GoalCoverage[] {
  const startISO = formatISODate(weekStart);
  const endISO = formatISODate(weekEnd);

  const counts = new Map<string, number>();
  for (const g of goals) counts.set(g.leafId, 0);

  for (const act of activities) {
    if (!isCountable(act)) continue;
    if (!inWindow(act, startISO, endISO)) continue;
    const leafId = act.intent_leaf_id as string;
    if (counts.has(leafId)) {
      counts.set(leafId, (counts.get(leafId) ?? 0) + 1);
    }
  }

  return goals.map((g) => ({
    leafId: g.leafId,
    count: counts.get(g.leafId) ?? 0,
  }));
}

export function getOtherIntentsThisWeek(
  activities: DbActivity[],
  goals: Goal[],
  weekStart: Date,
  weekEnd: Date,
): IntentCount[] {
  const startISO = formatISODate(weekStart);
  const endISO = formatISODate(weekEnd);
  const goalIds = new Set(goals.map((g) => g.leafId));

  const counts = new Map<string, number>();
  for (const act of activities) {
    if (!isCountable(act)) continue;
    if (!inWindow(act, startISO, endISO)) continue;
    const leafId = act.intent_leaf_id as string;
    if (goalIds.has(leafId)) continue;
    counts.set(leafId, (counts.get(leafId) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([leafId, count]) => ({ leafId, count }))
    .sort((a, b) => b.count - a.count || a.leafId.localeCompare(b.leafId));
}
