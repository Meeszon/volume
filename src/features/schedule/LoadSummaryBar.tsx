import { useMemo } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { useGoals } from "../../contexts/useGoals";
import { SKILL_TREE, CATEGORY_COLORS } from "../../data/skillTree";
import { findLeaf, getLeafCategory } from "../../lib/skillTreeLookup";
import { getGoalCoverage } from "../../lib/goalCoverage";
import type { DbActivity } from "../../types";
import styles from "./LoadSummaryBar.module.css";

const NEUTRAL = "#6a6359";

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

  const hasGoals = goals.length > 0;

  const uncovered = coverage.filter((r) => r.count === 0);
  const covered = coverage.filter((r) => r.count > 0);
  const ordered = [...uncovered, ...covered];

  return (
    <div className={styles.bar} data-testid="load-summary-bar">
      <div className={styles.title}>
        <span>Goal coverage</span>
        {hasGoals && (
          <span
            className={styles.titleTally}
            data-all-covered={uncovered.length === 0 ? "true" : "false"}
            aria-label={`${covered.length} of ${coverage.length} goals covered`}
          >
            <span className={styles.titleTallyNum}>{covered.length}</span>
            <span className={styles.titleTallySlash}>/</span>
            <span className={styles.titleTallyDenom}>{coverage.length}</span>
          </span>
        )}
      </div>

      <div className={styles.chips}>
        {!hasGoals ? (
          <span className={styles.emptyHint}>
            No goals set yet,{" "}
            <Link to="/goals" className={styles.inlineLink}>
              select goals from the skill tree
            </Link>
          </span>
        ) : (
          ordered.map((row) => {
            const leaf = findLeaf(SKILL_TREE, row.leafId);
            const category = getLeafCategory(SKILL_TREE, row.leafId);
            const color = category ? CATEGORY_COLORS[category.id] : NEUTRAL;
            const label = leaf?.label ?? row.leafId;
            const isCovered = row.count > 0;
            const chipStyle: CSSProperties = { ["--cat" as string]: color };
            return (
              <div
                key={row.leafId}
                className={styles.chip}
                data-covered={isCovered ? "true" : "false"}
                style={chipStyle}
                data-testid={`goal-row-${row.leafId}`}
                title={
                  isCovered
                    ? `${label} — covered this week (${row.count} session${row.count === 1 ? "" : "s"})`
                    : `${label} — not covered this week`
                }
              >
                <span className={styles.chipDot} aria-hidden />
                <span className={styles.chipLeaf}>{label}</span>
              </div>
            );
          })
        )}

        {hasGoals && (
          <Link to="/goals" className={styles.editLink}>
            <Pencil size={11} strokeWidth={1.5} aria-hidden />
            <span>Edit goals</span>
          </Link>
        )}
      </div>
    </div>
  );
}
