import { useState } from "react";
import type { CSSProperties } from "react";
import type { DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import type { Activity } from "../../types";
import { TrashIcon, CheckIcon } from "../../components/icons";
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

function formatTag(task: Activity): string | null {
  if (task.kind !== "climb") return null;
  if (task.durationMinutes == null) return null;
  const hours = task.durationMinutes / 60;
  return `${hours}h`;
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
  const intent = intentLabel(task.intentLeafId);
  const eyebrow = task.kind === "warmup" ? "Warmup" : intent;
  const main =
    task.kind === "climb" ? "Climbing Session" : (task.block?.name ?? "");
  const tag = formatTag(task);
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
          <span className={styles.cardKind} data-testid="eyebrow-chip">
            {eyebrow}
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
            {tag && (
              <span className={styles.cardTag} data-testid="card-tag">
                {tag}
              </span>
            )}
          </span>
        </div>
        {main && <div className={styles.cardIntent}>{main}</div>}
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
