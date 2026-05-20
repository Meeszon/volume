import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useGoals } from "../../contexts/useGoals";
import { SKILL_TREE, CATEGORY_COLORS } from "../../data/skillTree";
import { findLeaf, getLeafCategory } from "../../lib/skillTreeLookup";
import { getGoalCoverage } from "../../lib/goalCoverage";
import type { DbActivity } from "../../types";
import styles from "./LoadSummaryBar.module.css";

interface LoadSummaryBarProps {
  activities: DbActivity[];
  weekStart: Date;
  weekEnd: Date;
}

export function LoadSummaryBar({
  activities,
  weekStart,
  weekEnd,
}: LoadSummaryBarProps) {
  const { goals } = useGoals();

  const coverage = useMemo(
    () => getGoalCoverage(activities, goals, weekStart, weekEnd),
    [activities, goals, weekStart, weekEnd],
  );

  if (goals.length === 0) {
    return (
      <div className={styles.bar} data-testid="load-summary-bar">
        <div className={styles.entries}>
          <span className={styles.emptyHint}>
            No goals set —{" "}
            <Link to="/goals" className={styles.emptyCta}>
              pick goals on the Skill Tree
            </Link>{" "}
            to see weekly coverage.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.bar} data-testid="load-summary-bar">
      <div className={styles.entries}>
        {coverage.map((row) => {
          const leaf = findLeaf(SKILL_TREE, row.leafId);
          const category = getLeafCategory(SKILL_TREE, row.leafId);
          const color = category ? CATEGORY_COLORS[category.id] : "#b0afab";
          const label = leaf?.label ?? row.leafId;
          return (
            <div
              key={row.leafId}
              className={styles.entry}
              data-testid={`goal-row-${row.leafId}`}
            >
              <span
                className={styles.entryDot}
                style={{ background: color }}
                aria-hidden
              />
              <span className={styles.entryLabel}>{label}</span>
              <span className={styles.entryCount} data-testid={`goal-count-${row.leafId}`}>
                {row.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
