import { useState } from "react";
import { motion } from "framer-motion";
import type { Activity } from "../../types";
import type { LogData } from "../../hooks/useActivityLog";
import { KIND_CONFIG } from "../../data/kindConfig";
import { SKILL_TREE } from "../../data/skillTree";
import { findLeaf } from "../../lib/skillTreeLookup";
import { JUST_CLIMBING_LEAF, JUST_CLIMBING_LEAF_ID } from "../../data/syntheticIntents";
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

function intentLabel(intentLeafId: string | null): string {
  if (!intentLeafId) return "";
  if (intentLeafId === JUST_CLIMBING_LEAF_ID) return JUST_CLIMBING_LEAF.label;
  return findLeaf(SKILL_TREE, intentLeafId)?.label ?? intentLeafId;
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
              <div className={styles.panelTitle}>{intent || kindCfg.label}</div>
              <div className={styles.panelType}>{kindCfg.label}</div>
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
