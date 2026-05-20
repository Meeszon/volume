import { useState } from "react";
import { motion } from "framer-motion";
import type { Activity } from "../../types";
import type { LogData } from "../../hooks/useActivityLog";
import { KIND_CONFIG } from "../../data/kindConfig";
import { intentLabel } from "../../lib/intentResolver";
import { describeExercise } from "../../lib/block";
import { XIcon, TrashIcon } from "../../components/icons";
import styles from "./ActivityDetailPanel.module.css";

interface ActivityDetailPanelProps {
  activity: Activity;
  isLogged: boolean;
  logData: LogData | null;
  onClose: () => void;
  onDelete: (activityId: string) => void;
  onSaveLog: (activityId: string, data: LogData) => void;
}

type PanelMode = "editable" | "readonly";

function initForm(logData: LogData | null): Record<string, string> {
  if (!logData) return {};
  return Object.fromEntries(
    Object.entries(logData).map(([k, v]) => [k, String(v ?? "")]),
  );
}

export function ActivityDetailPanel({
  activity,
  isLogged,
  logData,
  onClose,
  onDelete,
  onSaveLog,
}: ActivityDetailPanelProps) {
  const [mode, setMode] = useState<PanelMode>(isLogged ? "readonly" : "editable");
  const [formData, setFormData] = useState<Record<string, string>>(() => initForm(logData));
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const setField = (key: string, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const isReadOnly = mode === "readonly";
  const kindCfg = KIND_CONFIG[activity.kind];
  const intent = intentLabel(activity.intentLeafId);
  const headerTitle =
    activity.kind === "warmup"
      ? (activity.block?.name ?? kindCfg.label)
      : (intent || kindCfg.label);

  function handleLog() {
    onSaveLog(activity.id, formData);
    setMode("readonly");
  }

  function handleDelete() {
    onDelete(activity.id);
    onClose();
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <motion.div
        className={styles.panel}
        initial={{ x: 380 }}
        animate={{ x: 0 }}
        exit={{ x: 380 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <div className={styles.panelHeader}>
          <div className={styles.panelHeaderLeft}>
            <div className={styles.panelAccent} style={{ backgroundColor: activity.accent }} />
            <div>
              <div className={styles.panelTitle}>{headerTitle}</div>
              <div className={styles.panelType}>
                {kindCfg.label}
                {activity.kind === "train" && intent ? ` · ${intent}` : ""}
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close panel">
            <XIcon />
          </button>
        </div>

        <div className={styles.panelBody}>
          <div className={styles.form}>
            {activity.kind === "climb" && (
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>Perceived Intensity</div>
                <div className={styles.intensityRow}>
                  {(["Easy", "Moderate", "Hard"] as const).map((opt) => (
                    <button
                      key={opt}
                      className={`${styles.intensityBtn}${
                        formData.intensity === opt.toLowerCase()
                          ? ` ${styles.intensityBtnActive}`
                          : ""
                      }`}
                      onClick={() => !isReadOnly && setField("intensity", opt.toLowerCase())}
                      disabled={isReadOnly}
                      type="button"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activity.kind !== "climb" && activity.block && (
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>{activity.block.name}</div>
                <ul className={styles.blockList}>
                  {activity.block.exercises.map((ex, i) => (
                    <li key={`${ex.name}-${i}`} className={styles.blockListItem}>
                      <span className={styles.blockExerciseName}>{ex.name}</span>
                      <span className={styles.blockExerciseDetail}>
                        {describeExercise(ex)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabel}>Notes</div>
              <textarea
                className={styles.textarea}
                value={formData.notes ?? ""}
                onChange={(e) => setField("notes", e.target.value)}
                readOnly={isReadOnly}
                placeholder={isReadOnly ? "" : "How did it go?"}
                rows={4}
              />
            </div>
          </div>
        </div>

        <div className={styles.panelFooter}>
          <div className={styles.primaryAction}>
            {isReadOnly ? (
              <button className={styles.editBtn} onClick={() => setMode("editable")}>
                Edit
              </button>
            ) : (
              <button className={styles.logBtn} onClick={handleLog}>
                Log Session
              </button>
            )}
          </div>

          <div className={styles.deleteAction}>
            {confirmingDelete ? (
              <>
                <button className={styles.deleteConfirmBtn} onClick={handleDelete}>
                  Delete
                </button>
                <button
                  className={styles.deleteCancelBtn}
                  onClick={() => setConfirmingDelete(false)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                className={styles.deleteBtn}
                onClick={() => setConfirmingDelete(true)}
              >
                <TrashIcon />
                Delete activity
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
