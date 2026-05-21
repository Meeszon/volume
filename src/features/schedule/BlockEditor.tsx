import { useState } from "react";
import type { CSSProperties } from "react";
import { KIND_CONFIG } from "../../data/kindConfig";
import type { Block, ExerciseDetail, Kind } from "../../types";
import styles from "./BlockEditor.module.css";

interface BlockEditorProps {
  dayLabel: string;
  kind: Kind;
  block: Block;
  onBack: () => void;
  onClose: () => void;
  onSubmit: (block: Block) => void;
  /** When true, render only the inner content (no overlay/modal wrapper). */
  embedded?: boolean;
}

type EditableExercise = {
  name: string;
  sets: string;
  value: string;
  unit: "reps" | "seconds";
  rest: string;
};

function toEditable(ex: ExerciseDetail): EditableExercise {
  return {
    name: ex.name,
    sets: String(ex.sets),
    value: String(ex.value),
    unit: ex.unit,
    rest: String(ex.rest),
  };
}

function toExerciseDetail(ex: EditableExercise): ExerciseDetail {
  const parseNum = (s: string) => {
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };
  return {
    name: ex.name,
    sets: parseNum(ex.sets),
    value: parseNum(ex.value),
    unit: ex.unit,
    rest: parseNum(ex.rest),
  };
}

export function BlockEditor({
  dayLabel,
  kind,
  block,
  onBack,
  onClose,
  onSubmit,
  embedded = false,
}: BlockEditorProps) {
  const kindLabel = KIND_CONFIG[kind].label;
  const kindColor = KIND_CONFIG[kind].color;
  const [exercises, setExercises] = useState<EditableExercise[]>(() =>
    block.exercises.map(toEditable),
  );

  const updateField = (
    index: number,
    field: keyof EditableExercise,
    value: string,
  ) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)),
    );
  };

  const handleSubmit = () => {
    onSubmit({
      name: block.name,
      exercises: exercises.map(toExerciseDetail),
    });
  };

  const modalStyle = {
    ["--kind-color" as string]: kindColor,
  } as CSSProperties;

  const content = (
    <>
      <div className={styles.modalHeader}>
        <div className={styles.modalHeaderLeft}>
          <span className={styles.eyebrow}>{dayLabel}</span>
          <h1 className={styles.modalTitle}>
            Add {kindLabel} · {block.name}
          </h1>
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

      <div className={styles.subHeader}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={onBack}
          aria-label="Back"
        >
          <span aria-hidden="true">←</span> Back
        </button>
        <span className={styles.subTitle}>Edit prescription</span>
      </div>

      <div className={styles.body}>
        <div className={styles.exerciseTable}>
          {exercises.map((ex, i) => (
            <div key={`${ex.name}-${i}`} className={styles.exerciseRow}>
              <div className={styles.exerciseName}>
                <span className={styles.exerciseIndex}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {ex.name}
              </div>
              <div className={styles.exerciseFields}>
                <div className={styles.fieldCol}>
                  <label
                    className={styles.fieldLabel}
                    htmlFor={`sets-${i}`}
                  >
                    Sets
                  </label>
                  <input
                    id={`sets-${i}`}
                    type="number"
                    min={0}
                    className={styles.numberInput}
                    value={ex.sets}
                    onChange={(e) =>
                      updateField(i, "sets", e.target.value)
                    }
                  />
                </div>
                <div className={styles.fieldCol}>
                  <label
                    className={styles.fieldLabel}
                    htmlFor={`value-${i}`}
                  >
                    {ex.unit === "reps" ? "Reps" : "Seconds"}
                  </label>
                  <input
                    id={`value-${i}`}
                    type="number"
                    min={0}
                    className={styles.numberInput}
                    value={ex.value}
                    onChange={(e) =>
                      updateField(i, "value", e.target.value)
                    }
                  />
                </div>
                <div className={styles.fieldCol}>
                  <label
                    className={styles.fieldLabel}
                    htmlFor={`unit-${i}`}
                  >
                    Unit
                  </label>
                  <select
                    id={`unit-${i}`}
                    className={styles.unitSelect}
                    value={ex.unit}
                    onChange={(e) =>
                      updateField(i, "unit", e.target.value)
                    }
                  >
                    <option value="reps">reps</option>
                    <option value="seconds">seconds</option>
                  </select>
                </div>
                <div className={styles.fieldCol}>
                  <label
                    className={styles.fieldLabel}
                    htmlFor={`rest-${i}`}
                  >
                    Rest (s)
                  </label>
                  <input
                    id={`rest-${i}`}
                    type="number"
                    min={0}
                    className={styles.numberInput}
                    value={ex.rest}
                    onChange={(e) =>
                      updateField(i, "rest", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.footerHint}>
          {exercises.length} {exercises.length === 1 ? "exercise" : "exercises"}
        </span>
        <button
          type="button"
          className={styles.submitBtn}
          onClick={handleSubmit}
        >
          Add Activity
          <span className={styles.submitArrow} aria-hidden="true">
            →
          </span>
        </button>
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
