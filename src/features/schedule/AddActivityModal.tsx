import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { KIND_CONFIG } from "../../data/kindConfig";
import { warmupLibrary } from "../../data/warmupLibrary";
import { getIntentLeaf, intentLabel } from "../../lib/intentResolver";
import { useRecentIntents } from "../../hooks/useRecentIntents";
import { IntentPickerModal } from "./IntentPickerModal";
import { BlockListPicker } from "./BlockListPicker";
import { BlockEditor } from "./BlockEditor";
import {
  DurationPickerModal,
  type DurationMinutes,
} from "./DurationPickerModal";
import type { Block, Kind, TreeLeaf } from "../../types";
import type { AddActivityInput } from "../../hooks/useWeekActivities";
import styles from "./AddActivityModal.module.css";

interface AddActivityModalProps {
  dayLabel: string;
  onClose: () => void;
  onAdd: (input: AddActivityInput) => void;
}

const KIND_ORDER: Kind[] = ["warmup", "climb", "train"];

const KIND_TRAIL: Record<Kind, string[]> = {
  climb: ["Intent", "Duration"],
  warmup: ["Routine"],
  train: ["Intent", "Block"],
};

type StepName = "kind" | "intent" | "duration" | "block-list" | "block-editor";

export function AddActivityModal({
  dayLabel,
  onClose,
  onAdd,
}: AddActivityModalProps) {
  const [pickedKind, setPickedKind] = useState<Kind | null>(null);
  const [climbLeafId, setClimbLeafId] = useState<string | null>(null);
  const [trainLeaf, setTrainLeaf] = useState<TreeLeaf | null>(null);
  const [pickedBlock, setPickedBlock] = useState<Block | null>(null);
  const { recents, recordPick } = useRecentIntents();

  const handleClimbIntentSelected = (leafId: string) => {
    recordPick(leafId);
    setClimbLeafId(leafId);
  };

  const handleClimbDurationSelected = (minutes: DurationMinutes) => {
    if (!climbLeafId) return;
    onAdd({
      kind: "climb",
      intentLeafId: climbLeafId,
      block: null,
      durationMinutes: minutes,
    });
    onClose();
  };

  const handleTrainIntentSelected = (leafId: string) => {
    const leaf = getIntentLeaf(leafId);
    if (!leaf) return;
    recordPick(leafId);
    setTrainLeaf(leaf);
  };

  const handleWarmupSubmit = (block: Block) => {
    onAdd({
      kind: "warmup",
      intentLeafId: null,
      block,
      durationMinutes: null,
    });
    onClose();
  };

  const handleTrainSubmit = (block: Block) => {
    if (!trainLeaf) return;
    onAdd({
      kind: "train",
      intentLeafId: trainLeaf.id,
      block,
      durationMinutes: null,
    });
    onClose();
  };

  let stepName: StepName;
  let stepKey: string;
  let stepContent: ReactNode;

  if (pickedKind === "climb") {
    if (climbLeafId) {
      stepName = "duration";
      stepKey = `climb-duration:${climbLeafId}`;
      stepContent = (
        <DurationPickerModal
          embedded
          dayLabel={dayLabel}
          intentLabel={intentLabel(climbLeafId)}
          onClose={onClose}
          onBack={() => setClimbLeafId(null)}
          onSelect={handleClimbDurationSelected}
        />
      );
    } else {
      stepName = "intent";
      stepKey = "climb-intent";
      stepContent = (
        <IntentPickerModal
          embedded
          dayLabel={dayLabel}
          kind="climb"
          recentIds={recents}
          onClose={onClose}
          onSelect={handleClimbIntentSelected}
        />
      );
    }
  } else if (pickedKind === "warmup") {
    if (pickedBlock) {
      stepName = "block-editor";
      stepKey = `warmup-editor:${pickedBlock.name}`;
      stepContent = (
        <BlockEditor
          embedded
          dayLabel={dayLabel}
          kind="warmup"
          block={pickedBlock}
          onBack={() => setPickedBlock(null)}
          onClose={onClose}
          onSubmit={handleWarmupSubmit}
        />
      );
    } else {
      stepName = "block-list";
      stepKey = "warmup-list";
      stepContent = (
        <BlockListPicker
          embedded
          dayLabel={dayLabel}
          kind="warmup"
          title="Add Warmup"
          blocks={warmupLibrary}
          onSelect={setPickedBlock}
          onClose={onClose}
        />
      );
    }
  } else if (pickedKind === "train") {
    if (trainLeaf && pickedBlock) {
      stepName = "block-editor";
      stepKey = `train-editor:${trainLeaf.id}:${pickedBlock.name}`;
      stepContent = (
        <BlockEditor
          embedded
          dayLabel={dayLabel}
          kind="train"
          block={pickedBlock}
          onBack={() => setPickedBlock(null)}
          onClose={onClose}
          onSubmit={handleTrainSubmit}
        />
      );
    } else if (trainLeaf) {
      stepName = "block-list";
      stepKey = `train-list:${trainLeaf.id}`;
      stepContent = (
        <BlockListPicker
          embedded
          dayLabel={dayLabel}
          kind="train"
          title="Add Training Block · Block"
          subTitle={trainLeaf.label}
          blocks={trainLeaf.blocks ?? []}
          onSelect={setPickedBlock}
          onBack={() => setTrainLeaf(null)}
          backLabel="Back to intent"
          onClose={onClose}
          emptyMessage={`No blocks defined for ${trainLeaf.label}.`}
        />
      );
    } else {
      stepName = "intent";
      stepKey = "train-intent";
      stepContent = (
        <IntentPickerModal
          embedded
          dayLabel={dayLabel}
          kind="train"
          recentIds={recents}
          onClose={onClose}
          onSelect={handleTrainIntentSelected}
        />
      );
    }
  } else {
    stepName = "kind";
    stepKey = "kind";
    stepContent = (
      <>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <span className={styles.eyebrow}>{dayLabel}</span>
            <h1 className={styles.modalTitle}>Add Activity</h1>
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

        <div className={styles.kindList}>
          {KIND_ORDER.map((kind) => {
            const cfg = KIND_CONFIG[kind];
            const trail = KIND_TRAIL[kind];
            const cardStyle = {
              ["--kind-color" as string]: cfg.color,
            } as CSSProperties;
            return (
              <button
                type="button"
                key={kind}
                className={styles.kindCard}
                onClick={() => setPickedKind(kind)}
                aria-label={cfg.label}
                style={cardStyle}
              >
                <div className={styles.kindStrip} aria-hidden="true" />
                <div className={styles.kindBody}>
                  <span className={styles.kindLabel}>{cfg.label}</span>
                  <span className={styles.kindTrail}>
                    {trail.map((step, i) => (
                      <span key={step}>
                        {i > 0 && (
                          <span className={styles.kindTrailDot}> · </span>
                        )}
                        {step}
                      </span>
                    ))}
                  </span>
                </div>
                <span className={styles.kindArrow} aria-hidden="true">
                  →
                </span>
              </button>
            );
          })}
        </div>

        <div className={styles.footnote}>Choose a kind</div>
      </>
    );
  }

  const modalStyle: CSSProperties | undefined = pickedKind
    ? ({
        ["--kind-color" as string]: KIND_CONFIG[pickedKind].color,
      } as CSSProperties)
    : undefined;

  return (
    <div
      className={styles.overlay}
      data-testid="modal-overlay"
      onClick={onClose}
    >
      <div
        className={styles.modal}
        data-step={stepName}
        onClick={(e) => e.stopPropagation()}
        style={modalStyle}
      >
        <div key={stepKey} className={styles.stepLayer}>
          {stepContent}
        </div>
      </div>
    </div>
  );
}
