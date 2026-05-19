import { AnimatePresence, motion } from "framer-motion";
import { useGoals } from "../../contexts/useGoals";
import { SKILL_TREE } from "../../data/skillTree";
import { findLeaf } from "../../lib/skillTreeLookup";
import styles from "./SkillTreePage.module.css";

export function GoalsDashboard() {
  const { goals, removeGoal } = useGoals();

  return (
    <div className={styles.dashboard}>
      <span className={styles.dashboardLabel}>Active Goals</span>
      <div className={styles.badgeList}>
        <AnimatePresence>
          {goals.map((g) => {
            const label = findLeaf(SKILL_TREE, g.leafId)?.label ?? g.leafId;
            return (
              <motion.div
                key={g.leafId}
                className={styles.badge}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.18 }}
                layout
              >
                <span className={styles.badgeLabel}>{label}</span>
                <button
                  className={styles.badgeRemove}
                  onClick={() => removeGoal(g.leafId)}
                  aria-label={`Remove ${label} goal`}
                >
                  ×
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {goals.length === 0 && (
          <span className={styles.noGoals}>No active goals — explore the tree below</span>
        )}
      </div>
    </div>
  );
}
