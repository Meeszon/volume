import type { Block } from "../../types";
import { summarizeBlock } from "../../lib/block";
import styles from "./BlockEditor.module.css";

interface BlockListPickerProps {
  title: string;
  blocks: Block[];
  onSelect: (block: Block) => void;
  onClose: () => void;
  onBack?: () => void;
  subTitle?: string;
  emptyMessage?: string;
  backLabel?: string;
}

export function BlockListPicker({
  title,
  blocks,
  onSelect,
  onClose,
  onBack,
  subTitle,
  emptyMessage,
  backLabel = "Back",
}: BlockListPickerProps) {
  return (
    <div
      className={styles.overlay}
      data-testid="modal-overlay"
      onClick={onClose}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{title}</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {(onBack || subTitle) && (
          <div className={styles.subHeader}>
            {onBack && (
              <button
                type="button"
                className={styles.backBtn}
                onClick={onBack}
                aria-label={backLabel}
              >
                ← Back
              </button>
            )}
            {subTitle && <span className={styles.subTitle}>{subTitle}</span>}
          </div>
        )}

        <div className={styles.body}>
          {blocks.length === 0 ? (
            <div className={styles.emptyState}>
              {emptyMessage ?? "No blocks available."}
            </div>
          ) : (
            <div className={styles.list}>
              {blocks.map((block) => (
                <button
                  type="button"
                  key={block.name}
                  className={styles.listItem}
                  onClick={() => onSelect(block)}
                >
                  <span className={styles.listItemTitle}>{block.name}</span>
                  <span className={styles.listItemSub}>
                    {summarizeBlock(block)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
