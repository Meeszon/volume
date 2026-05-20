import { useState } from "react";
import { KIND_CONFIG } from "../../data/kindConfig";
import { warmupLibrary } from "../../data/warmupLibrary";
import { getIntentLeaf } from "../../lib/intentResolver";
import { useRecentIntents } from "../../hooks/useRecentIntents";
import { IntentPickerModal } from "./IntentPickerModal";
import { BlockListPicker } from "./BlockListPicker";
import { BlockEditor } from "./BlockEditor";
import { hexPoints } from "../../utils/hex";
import type { Block, Kind, TreeLeaf } from "../../types";
import type { AddActivityInput } from "../../hooks/useWeekActivities";
import styles from "./AddActivityModal.module.css";

interface AddActivityModalProps {
  dayLabel: string;
  onClose: () => void;
  onAdd: (input: AddActivityInput) => void;
}

const KIND_ORDER: Kind[] = ["climb", "warmup", "train"];

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

export function AddActivityModal({
  dayLabel,
  onClose,
  onAdd,
}: AddActivityModalProps) {
  const [pickedKind, setPickedKind] = useState<Kind | null>(null);
  const [trainLeaf, setTrainLeaf] = useState<TreeLeaf | null>(null);
  const [pickedBlock, setPickedBlock] = useState<Block | null>(null);
  const { recents, recordPick } = useRecentIntents();

  const handleClimbIntentSelected = (leafId: string) => {
    recordPick(leafId);
    onAdd({ kind: "climb", intentLeafId: leafId, block: null });
    onClose();
  };

  const handleTrainIntentSelected = (leafId: string) => {
    const leaf = getIntentLeaf(leafId);
    if (!leaf) return;
    recordPick(leafId);
    setTrainLeaf(leaf);
  };

  const handleWarmupSubmit = (block: Block) => {
    onAdd({ kind: "warmup", intentLeafId: null, block });
    onClose();
  };

  const handleTrainSubmit = (block: Block) => {
    if (!trainLeaf) return;
    onAdd({ kind: "train", intentLeafId: trainLeaf.id, block });
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

  if (pickedKind === "warmup") {
    if (pickedBlock) {
      return (
        <BlockEditor
          dayLabel={dayLabel}
          kindLabel={KIND_CONFIG.warmup.label}
          block={pickedBlock}
          onBack={() => setPickedBlock(null)}
          onClose={onClose}
          onSubmit={handleWarmupSubmit}
        />
      );
    }
    return (
      <BlockListPicker
        title={`Add Warmup — ${dayLabel}`}
        blocks={warmupLibrary}
        onSelect={setPickedBlock}
        onClose={onClose}
      />
    );
  }

  if (pickedKind === "train") {
    if (trainLeaf && pickedBlock) {
      return (
        <BlockEditor
          dayLabel={dayLabel}
          kindLabel={KIND_CONFIG.train.label}
          block={pickedBlock}
          onBack={() => setPickedBlock(null)}
          onClose={onClose}
          onSubmit={handleTrainSubmit}
        />
      );
    }
    if (trainLeaf) {
      return (
        <BlockListPicker
          title={`Add Train · Block — ${dayLabel}`}
          subTitle={trainLeaf.label}
          blocks={trainLeaf.blocks ?? []}
          onSelect={setPickedBlock}
          onBack={() => setTrainLeaf(null)}
          backLabel="Back to intent"
          onClose={onClose}
          emptyMessage={`No blocks defined for ${trainLeaf.label}.`}
        />
      );
    }
    return (
      <IntentPickerModal
        dayLabel={dayLabel}
        kind="train"
        recentIds={recents}
        onClose={onClose}
        onSelect={handleTrainIntentSelected}
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
            return (
              <button
                type="button"
                key={kind}
                className={styles.categoryBtn}
                onClick={() => setPickedKind(kind)}
                aria-label={cfg.label}
              >
                <CoordHex color={cfg.color} />
                <span className={styles.categoryLabel}>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
