import { useState } from "react";
import type { CSSProperties } from "react";
import type { DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import type { Activity } from "../../types";
import { TrashIcon, CheckIcon } from "../../components/icons";
import { KIND_CONFIG } from "../../data/kindConfig";
import { intentLabel } from "../../lib/intentResolver";
import { getActivityCategoryColor } from "../../lib/categoryColor";
import styles from "./schedule.module.css";

interface ActivityCardProps {
  task: Activity;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  onDelete: (activityId: string) => void;
  onOpenPanel: (activity: Activity) => void;
  isLogged: boolean;
}

export function ActivityCard({
  task,
  provided,
  snapshot,
  onDelete,
  onOpenPanel,
  isLogged,
}: ActivityCardProps) {
  const [confirming, setConfirming] = useState(false);
  const kindCfg = KIND_CONFIG[task.kind];
  const intent =
    task.kind === "warmup"
      ? (task.block?.name ?? "")
      : intentLabel(task.intentLeafId);
  const cat = getActivityCategoryColor(task);

  const cardStyle: CSSProperties = {
    ...provided.draggableProps.style,
    ["--cat" as string]: cat,
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={[
        styles.activityCard,
        "activity-card",
        snapshot.isDragging ? styles.dragging : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={cardStyle}
      onClick={() => {
        if (!confirming && !snapshot.isDragging) onOpenPanel(task);
      }}
    >
      <div className={styles.cardStrip} />
      <div className={styles.cardBody}>
        <div className={styles.cardEyebrow}>
          <span className={styles.cardKind} data-testid="kind-chip">
            {kindCfg.label.toUpperCase()}
          </span>
          <span className={styles.cardEyebrowRight}>
            {isLogged && (
              <span
                className={styles.cardLogged}
                aria-label="Logged"
                data-testid="logged-check"
              >
                <CheckIcon />
              </span>
            )}
          </span>
        </div>
        {intent && <div className={styles.cardIntent}>{intent}</div>}
      </div>

      <div className={styles.cardMenu}>
        {confirming ? (
          <div
            className={styles.confirmDelete}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.confirmBtn}
              aria-label="Confirm delete"
              onClick={() => onDelete(task.id)}
            >
              Delete
            </button>
            <button
              className={styles.cancelBtn}
              aria-label="Cancel delete"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className={styles.deleteBtn}
            aria-label="Delete activity"
            onClick={(e) => {
              e.stopPropagation();
              setConfirming(true);
            }}
          >
            <TrashIcon />
          </button>
        )}
      </div>
    </div>
  );
}
