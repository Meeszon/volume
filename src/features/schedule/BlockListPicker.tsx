import type { CSSProperties } from "react";
import { KIND_CONFIG } from "../../data/kindConfig";
import { summarizeBlock } from "../../lib/block";
import type { Block, Kind } from "../../types";
import styles from "./BlockEditor.module.css";

interface BlockListPickerProps {
  title: string;
  dayLabel: string;
  kind: Kind;
  blocks: Block[];
  onSelect: (block: Block) => void;
  onClose: () => void;
  onBack?: () => void;
  subTitle?: string;
  emptyMessage?: string;
  backLabel?: string;
  /** When true, render only the inner content (no overlay/modal wrapper). */
  embedded?: boolean;
}

export function BlockListPicker({
  title,
  dayLabel,
  kind,
  blocks,
  onSelect,
  onClose,
  onBack,
  subTitle,
  emptyMessage,
  backLabel = "Back",
  embedded = false,
}: BlockListPickerProps) {
  const modalStyle = {
    ["--kind-color" as string]: KIND_CONFIG[kind].color,
  } as CSSProperties;

  const content = (
    <>
      <div className={styles.modalHeader}>
        <div className={styles.modalHeaderLeft}>
          <span className={styles.eyebrow}>{dayLabel}</span>
          <h1 className={styles.modalTitle}>{title}</h1>
        </div>
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
              <span aria-hidden="true">←</span> Back
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
                <div className={styles.listItemStrip} aria-hidden="true" />
                <div className={styles.listItemBody}>
                  <span className={styles.listItemTitle}>{block.name}</span>
                  <span className={styles.listItemSub}>
                    {summarizeBlock(block)}
                  </span>
                </div>
                <span className={styles.listItemArrow} aria-hidden="true">
                  →
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <div
      className={styles.overlay}
      data-testid="modal-overlay"
      onClick={onClose}
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        style={modalStyle}
      >
        {content}
      </div>
    </div>
  );
}
