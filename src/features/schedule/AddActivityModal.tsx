import { useState } from "react";
import { KIND_CONFIG } from "../../data/kindConfig";
import { SKILL_TREE } from "../../data/skillTree";
import {
  getAllIntentsForKind,
  getSyntheticJustClimbing,
} from "../../lib/intentResolver";
import type { Kind, TreeLeaf } from "../../types";
import type { AddActivityInput } from "../../hooks/useWeekActivities";
import styles from "./AddActivityModal.module.css";

interface AddActivityModalProps {
  dayLabel: string;
  onClose: () => void;
  onAdd: (input: AddActivityInput) => void;
}

type Screen = "kind" | "climb-intent";

const KIND_ORDER: Kind[] = ["climb", "warmup", "train"];
const ENABLED_KINDS: Kind[] = ["climb"];

export function AddActivityModal({ dayLabel, onClose, onAdd }: AddActivityModalProps) {
  const [screen, setScreen] = useState<Screen>("kind");

  const handleSelectKind = (kind: Kind) => {
    if (!ENABLED_KINDS.includes(kind)) return;
    if (kind === "climb") setScreen("climb-intent");
  };

  const handleSelectClimbIntent = (leaf: TreeLeaf) => {
    onAdd({ kind: "climb", intentLeafId: leaf.id, block: null });
    onClose();
  };

  const handleBack = () => {
    setScreen("kind");
  };

  const renderKindPicker = () => (
    <div className={styles.categoryGrid}>
      {KIND_ORDER.map((kind) => {
        const cfg = KIND_CONFIG[kind];
        const enabled = ENABLED_KINDS.includes(kind);
        return (
          <button
            key={kind}
            className={styles.categoryBtn}
            style={{
              borderColor: cfg.color,
              opacity: enabled ? 1 : 0.5,
              cursor: enabled ? "pointer" : "not-allowed",
            }}
            onClick={() => handleSelectKind(kind)}
            disabled={!enabled}
            aria-disabled={!enabled}
          >
            <span
              className={styles.categoryDot}
              style={{ backgroundColor: cfg.color }}
            />
            <span>{cfg.label}</span>
            {!enabled && (
              <span className={styles.exerciseList}>Coming soon</span>
            )}
          </button>
        );
      })}
    </div>
  );

  const renderClimbIntent = () => {
    const justClimbing = getSyntheticJustClimbing();
    const leaves = getAllIntentsForKind("climb", SKILL_TREE);
    const accent = KIND_CONFIG.climb.color;
    return (
      <div className={styles.activityList}>
        <button
          key={justClimbing.id}
          className={styles.templateItem}
          onClick={() => handleSelectClimbIntent(justClimbing)}
        >
          <span
            className={styles.activityAccent}
            style={{ backgroundColor: accent }}
          />
          <div className={styles.templateText}>
            <span className={styles.activityTitle}>{justClimbing.label}</span>
            <span className={styles.exerciseList}>
              No specific training intent
            </span>
          </div>
        </button>
        {leaves.map((leaf) => (
          <button
            key={leaf.id}
            className={styles.templateItem}
            onClick={() => handleSelectClimbIntent(leaf)}
          >
            <span
              className={styles.activityAccent}
              style={{ backgroundColor: accent }}
            />
            <div className={styles.templateText}>
              <span className={styles.activityTitle}>{leaf.label}</span>
            </div>
          </button>
        ))}
      </div>
    );
  };

  const headerLabel =
    screen === "kind" ? `Add Activity — ${dayLabel}` : `Pick Intent — ${dayLabel}`;

  return (
    <div className={styles.overlay} data-testid="modal-overlay" onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          {screen !== "kind" && (
            <button className={styles.backBtn} onClick={handleBack}>
              ← Back
            </button>
          )}
          <span className={styles.modalTitle}>{headerLabel}</span>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        {screen === "kind" && renderKindPicker()}
        {screen === "climb-intent" && renderClimbIntent()}
      </div>
    </div>
  );
}
