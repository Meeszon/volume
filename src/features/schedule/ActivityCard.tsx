import { useState } from "react";
import type { DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import type { Activity } from "../../types";
import { TrashIcon, CheckIcon } from "../../components/icons";
import { KIND_CONFIG } from "../../data/kindConfig";
import { SKILL_TREE } from "../../data/skillTree";
import { findLeaf } from "../../lib/skillTreeLookup";
import { JUST_CLIMBING_LEAF, JUST_CLIMBING_LEAF_ID } from "../../data/syntheticIntents";
import styles from "./schedule.module.css";

interface ActivityCardProps {
  task: Activity;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  onDelete: (activityId: string) => void;
  onOpenPanel: (activity: Activity) => void;
  isLogged: boolean;
}

function intentLabel(intentLeafId: string | null): string {
  if (!intentLeafId) return "";
  if (intentLeafId === JUST_CLIMBING_LEAF_ID) return JUST_CLIMBING_LEAF.label;
  return findLeaf(SKILL_TREE, intentLeafId)?.label ?? intentLeafId;
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
  const label = intentLabel(task.intentLeafId);

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={[
        styles.activityCard,
        "activity-card",
        snapshot.isDragging ? styles.dragging : "",
        isLogged ? styles.loggedCard : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={provided.draggableProps.style}
      onClick={() => {
        if (!confirming && !snapshot.isDragging) onOpenPanel(task);
      }}
    >
      <div className={styles.cardSeparator} style={{ backgroundColor: task.accent }} />
      <div className={styles.cardText}>
        <span
          className={styles.cardTitle}
          data-testid="kind-chip"
          style={{ color: kindCfg.color }}
        >
          {kindCfg.label}
        </span>
        {label && <span className={styles.cardSubtitle}>{label}</span>}
      </div>

      {isLogged && !confirming && (
        <div className={styles.loggedBadge}>
          <CheckIcon />
        </div>
      )}

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
