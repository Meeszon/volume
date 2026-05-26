import { useGoals } from "../../contexts/useGoals";
import type { TreeLeaf } from "../../types";
import styles from "./SkillDetailPanel.module.css";

interface SkillDetailPanelProps {
  leaf: TreeLeaf | null;
  categoryColor: string;
  onClose: () => void;
}

const MAX_GOALS = 5;

export function SkillDetailPanel({ leaf, categoryColor, onClose }: SkillDetailPanelProps) {
  const { goals, addGoal, removeGoal, isGoal } = useGoals();
  const goalActive = leaf ? isGoal(leaf.id) : false;
  const isFull = goals.length >= MAX_GOALS;

  const goalButtonLabel = goalActive
    ? "★ Remove Goal"
    : isFull
      ? `Goals Full (${MAX_GOALS})`
      : "☆ Set as Goal";

  const handleGoalToggle = () => {
    if (!leaf) return;
    if (goalActive) removeGoal(leaf.id);
    else addGoal(leaf.id);
  };

  return (
    <div
      className={`${styles.rail} ${leaf ? styles.railOpen : ""}`}
      style={{ "--cat": categoryColor || "var(--ink-3)" } as React.CSSProperties}
    >
      <div className={styles.stripe} />
      <button className={styles.closeBtn} onClick={onClose} aria-label="Close detail">
        ×
      </button>
      {leaf && (
        <div className={styles.body}>
          <div>
            <div className={styles.eyebrow}>Mastering</div>
            <h2 className={styles.title}>{leaf.label}</h2>
          </div>

          {leaf.description && <p className={styles.desc}>{leaf.description}</p>}

          <div className={styles.kindTags}>
            {(leaf.allowedKinds ?? []).map((k) => (
              <span key={k} className={styles.kindTag}>
                {k}
              </span>
            ))}
          </div>

          <div className={styles.divider} />

          <div className={styles.video}>
            <span className={styles.videoPlay}>▶</span>
            <span className={styles.videoTitle}>Tutorial Video</span>
            <span className={styles.videoSub}>YouTube embed · coming soon</span>
          </div>

          <div>
            <h3 className={styles.sectionTitle}>Training Drills</h3>
            <ul className={styles.drillList}>
              {leaf.exercises.map((ex) => (
                <li key={ex.name} className={styles.drill}>
                  <span className={styles.drillName}>{ex.name}</span>
                  <span className={styles.drillDetail}>{ex.detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.footer}>
            <span className={styles.footerMeta}>
              {goalActive ? "Tracked weekly" : `Up to ${MAX_GOALS} goals`}
            </span>
            <button
              className={`${styles.goalBtn} ${goalActive ? styles.goalBtnActive : ""}`}
              disabled={!goalActive && isFull}
              onClick={handleGoalToggle}
            >
              {goalButtonLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
