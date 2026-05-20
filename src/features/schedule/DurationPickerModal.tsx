import frameStyles from "./BlockEditor.module.css";
import styles from "./DurationPickerModal.module.css";

export const DURATION_OPTIONS = [60, 90, 120, 150] as const;

export type DurationMinutes = (typeof DURATION_OPTIONS)[number];

interface DurationPickerModalProps {
  dayLabel: string;
  intentLabel: string;
  onClose: () => void;
  onBack: () => void;
  onSelect: (minutes: DurationMinutes) => void;
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
}: DurationPickerModalProps) {
  return (
    <div
      className={frameStyles.overlay}
      data-testid="modal-overlay"
      onClick={onClose}
    >
      <div className={frameStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={frameStyles.modalHeader}>
          <span className={frameStyles.modalTitle}>
            Add Climb · Duration — {dayLabel}
          </span>
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
            ← Back
          </button>
          <span className={frameStyles.subTitle}>{intentLabel}</span>
        </div>

        <div className={frameStyles.body}>
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
      </div>
    </div>
  );
}
