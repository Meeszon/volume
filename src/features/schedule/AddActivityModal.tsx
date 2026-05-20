import { useState } from "react";
import { KIND_CONFIG } from "../../data/kindConfig";
import { useRecentIntents } from "../../hooks/useRecentIntents";
import { IntentPickerModal } from "./IntentPickerModal";
import { hexPoints } from "../../utils/hex";
import type { Kind } from "../../types";
import type { AddActivityInput } from "../../hooks/useWeekActivities";
import styles from "./AddActivityModal.module.css";

interface AddActivityModalProps {
  dayLabel: string;
  onClose: () => void;
  onAdd: (input: AddActivityInput) => void;
}

const KIND_ORDER: Kind[] = ["climb", "warmup", "train"];
const ENABLED_KINDS: Kind[] = ["climb"];

function CoordHex({ color }: { color: string }) {
  const size = 28;
  const glowR = Math.round(size * 1.25);
  const svgSize = glowR * 2 + 4;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  return (
    <svg
      className={styles.hexMarker}
      width={svgSize}
      height={svgSize}
      style={{ ["--kind-color" as string]: color }}
      aria-hidden="true"
    >
      <polygon className="glow" points={hexPoints(cx, cy, glowR)} />
      <polygon className="core" points={hexPoints(cx, cy, size)} />
    </svg>
  );
}

export function AddActivityModal({ dayLabel, onClose, onAdd }: AddActivityModalProps) {
  const [pickedKind, setPickedKind] = useState<Kind | null>(null);
  const { recents, recordPick } = useRecentIntents();

  const handleSelectKind = (kind: Kind) => {
    if (!ENABLED_KINDS.includes(kind)) return;
    setPickedKind(kind);
  };

  const handleClimbIntentSelected = (leafId: string) => {
    recordPick(leafId);
    onAdd({ kind: "climb", intentLeafId: leafId, block: null });
    onClose();
  };

  if (pickedKind === "climb") {
    return (
      <IntentPickerModal
        dayLabel={dayLabel}
        kind="climb"
        recentIds={recents}
        onClose={onClose}
        onSelect={handleClimbIntentSelected}
      />
    );
  }

  return (
    <div className={styles.overlay} data-testid="modal-overlay" onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Add Activity — {dayLabel}</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={styles.categoryGrid}>
          {KIND_ORDER.map((kind) => {
            const cfg = KIND_CONFIG[kind];
            const enabled = ENABLED_KINDS.includes(kind);
            return (
              <button
                type="button"
                key={kind}
                className={`${styles.categoryBtn} ${enabled ? styles.enabled : styles.disabled}`}
                onClick={() => handleSelectKind(kind)}
                disabled={!enabled}
                aria-disabled={!enabled}
                aria-label={cfg.label}
              >
                <CoordHex color={cfg.color} />
                <span className={styles.categoryLabel}>{cfg.label}</span>
                {!enabled && (
                  <span className={styles.exerciseList}>Coming soon</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
