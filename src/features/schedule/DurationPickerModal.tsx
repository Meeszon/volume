import type { CSSProperties } from "react";
import { KIND_CONFIG } from "../../data/kindConfig";
import frameStyles from "./BlockEditor.module.css";
import styles from "./DurationPickerModal.module.css";

const DURATION_OPTIONS = [60, 90, 120, 150] as const;

export type DurationMinutes = (typeof DURATION_OPTIONS)[number];

interface DurationPickerModalProps {
  dayLabel: string;
  intentLabel: string;
  onClose: () => void;
  onBack: () => void;
  onSelect: (minutes: DurationMinutes) => void;
  /** When true, render only the inner content (no overlay/modal wrapper). */
  embedded?: boolean;
}

function formatHours(minutes: number): string {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours}h`;
}

export function DurationPickerModal({
  dayLabel,
  intentLabel,
  onClose,
  onBack,
  onSelect,
  embedded = false,
}: DurationPickerModalProps) {
  const modalStyle = {
    ["--kind-color" as string]: KIND_CONFIG.climb.color,
  } as CSSProperties;

  const content = (
    <>
      <div className={frameStyles.modalHeader}>
        <div className={frameStyles.modalHeaderLeft}>
          <span className={frameStyles.eyebrow}>{dayLabel}</span>
          <h1 className={frameStyles.modalTitle}>
            Add Climb · Duration
          </h1>
        </div>
        <button
          type="button"
          className={frameStyles.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className={frameStyles.subHeader}>
        <button
          type="button"
          className={frameStyles.backBtn}
          onClick={onBack}
          aria-label="Back to intent"
        >
          <span aria-hidden="true">←</span> Back
        </button>
        <span className={frameStyles.subTitle}>{intentLabel}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.bodyLabel}>Session length</div>
        <div className={styles.grid}>
          {DURATION_OPTIONS.map((minutes) => (
            <button
              type="button"
              key={minutes}
              className={styles.tile}
              onClick={() => onSelect(minutes)}
              aria-label={`${minutes} minutes`}
              data-testid={`duration-option-${minutes}`}
            >
              <span className={styles.time}>{formatHours(minutes)}</span>
              <span className={styles.label}>{minutes} min</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <div
      className={frameStyles.overlay}
      data-testid="modal-overlay"
      onClick={onClose}
    >
      <div
        className={frameStyles.modal}
        onClick={(e) => e.stopPropagation()}
        style={modalStyle}
      >
        {content}
      </div>
    </div>
  );
}
