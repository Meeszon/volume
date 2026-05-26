import { useState, useMemo } from "react";
import type { CSSProperties } from "react";
import { CATEGORY_COLORS, SKILL_TREE } from "../../data/skillTree";
import { getIconFor } from "../../data/iconMap";
import { isLeaf } from "../../utils/tree";
import {
  getGoalIntentsForKind,
  getRecentIntentsForKind,
  getSyntheticJustClimbing,
} from "../../lib/intentResolver";
import { getAllLeaves, getLeafCategory } from "../../lib/skillTreeLookup";
import { useGoals } from "../../contexts/useGoals";
import { HexGlyph } from "../../components/HexGlyph/HexGlyph";
import { KIND_CONFIG } from "../../data/kindConfig";
import type { Kind, TreeBranch, TreeLeaf } from "../../types";
import styles from "./IntentPickerModal.module.css";

interface IntentPickerModalProps {
  dayLabel: string;
  kind: Kind;
  recentIds: string[];
  onClose: () => void;
  onSelect: (leafId: string) => void;
  /** When true, render only the inner content (no overlay/modal wrapper).
   * Used by AddActivityModal so the persistent shell handles the frame. */
  embedded?: boolean;
}

type Tab = "all" | "goals" | "recents";

const TAB_ORDER: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "goals", label: "Goals" },
  { id: "recents", label: "Recents" },
];

const HEX_SIZE = 26;
const CATEGORY_HEX_SIZE = 30;

function colorForLeaf(leafId: string): string {
  const cat = getLeafCategory(SKILL_TREE, leafId);
  if (cat) return CATEGORY_COLORS[cat.id] ?? "#888";
  return KIND_CONFIG.climb.color;
}

export function IntentPickerModal({
  dayLabel,
  kind,
  recentIds,
  onClose,
  onSelect,
  embedded = false,
}: IntentPickerModalProps) {
  const { goals } = useGoals();
  const [tab, setTab] = useState<Tab>("all");
  const [drillCategoryId, setDrillCategoryId] = useState<string | null>(null);

  const categories = useMemo(
    () => SKILL_TREE.filter((n): n is TreeBranch => !isLeaf(n)),
    [],
  );

  const goalLeaves = useMemo(
    () => getGoalIntentsForKind(kind, goals, SKILL_TREE),
    [kind, goals],
  );

  const recentLeaves = useMemo(
    () => getRecentIntentsForKind(kind, recentIds, SKILL_TREE),
    [kind, recentIds],
  );

  const drillCategory = useMemo(
    () =>
      drillCategoryId
        ? (categories.find((c) => c.id === drillCategoryId) ?? null)
        : null,
    [categories, drillCategoryId],
  );

  const drillLeaves = useMemo<TreeLeaf[]>(() => {
    if (!drillCategory) return [];
    return getAllLeaves(drillCategory.children).filter((l) =>
      l.allowedKinds.includes(kind),
    );
  }, [drillCategory, kind]);

  const handleSelect = (leafId: string) => {
    onSelect(leafId);
  };

  const renderAllTab = () => {
    if (drillCategory) {
      const useWrap = drillLeaves.length > 5;
      return (
        <>
          <div className={styles.drillHeader}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => setDrillCategoryId(null)}
              aria-label="Back to categories"
            >
              <span aria-hidden="true">←</span> Back
            </button>
            <span className={styles.drillTitle}>{drillCategory.label}</span>
          </div>
          {drillLeaves.length === 0 ? (
            <div className={styles.emptyState}>
              No intents in this category for {KIND_CONFIG[kind].label}.
            </div>
          ) : (
            <div className={styles.coordinateRow}>
              <div
                className={`${styles.row} ${useWrap ? styles.rowWrap : ""}`}
              >
                {drillLeaves.map((leaf) => (
                  <div className={styles.coordCell} key={leaf.id}>
                    <HexGlyph
                      size={HEX_SIZE}
                      color={CATEGORY_COLORS[drillCategory.id] ?? "#888"}
                      icon={getIconFor(leaf.id)}
                      label={leaf.label}
                      onClick={() => handleSelect(leaf.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      );
    }
    return (
      <div className={styles.coordinateRow}>
        <div className={styles.row}>
          {categories.map((cat) => (
            <div className={styles.coordCell} key={cat.id}>
              <HexGlyph
                size={CATEGORY_HEX_SIZE}
                color={CATEGORY_COLORS[cat.id] ?? "#888"}
                icon={getIconFor(cat.id)}
                label={cat.label}
                onClick={() => setDrillCategoryId(cat.id)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGoalsTab = () => {
    if (goalLeaves.length === 0) {
      return (
        <div className={styles.emptyState}>
          No goals yet for {KIND_CONFIG[kind].label}.
          <br />
          <span className={styles.emptyStateCta}>
            Set goals from the Skill Tree page.
          </span>
        </div>
      );
    }
    const useWrap = goalLeaves.length > 5;
    return (
      <div className={styles.coordinateRow}>
        <div className={`${styles.row} ${useWrap ? styles.rowWrap : ""}`}>
          {goalLeaves.map((leaf) => (
            <div className={styles.coordCell} key={leaf.id}>
              <HexGlyph
                size={HEX_SIZE}
                color={colorForLeaf(leaf.id)}
                icon={getIconFor(leaf.id)}
                label={leaf.label}
                onClick={() => handleSelect(leaf.id)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRecentsTab = () => {
    if (recentLeaves.length === 0) {
      return (
        <div className={styles.emptyState}>No recent intents yet.</div>
      );
    }
    const useWrap = recentLeaves.length > 5;
    return (
      <div className={styles.coordinateRow}>
        <div className={`${styles.row} ${useWrap ? styles.rowWrap : ""}`}>
          {recentLeaves.map((leaf) => {
            const color =
              leaf.id === getSyntheticJustClimbing().id
                ? KIND_CONFIG.climb.color
                : colorForLeaf(leaf.id);
            return (
              <div className={styles.coordCell} key={leaf.id}>
                <HexGlyph
                  size={HEX_SIZE}
                  color={color}
                  icon={getIconFor(leaf.id)}
                  label={leaf.label}
                  onClick={() => handleSelect(leaf.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderJustClimbingPin = () => {
    if (kind !== "climb") return null;
    const synth = getSyntheticJustClimbing();
    const Icon = getIconFor(synth.id);
    return (
      <div className={styles.justClimbingPin}>
        <button
          type="button"
          className={styles.justClimbingBtn}
          onClick={() => handleSelect(synth.id)}
          aria-label={synth.label}
        >
          <Icon size={16} color={KIND_CONFIG.climb.color} strokeWidth={2.2} />
          <span className={styles.justClimbingText}>
            <span className={styles.justClimbingTitle}>{synth.label}</span>
            <span className={styles.justClimbingSub}>
              No specific training intent
            </span>
          </span>
          <span className={styles.justClimbingArrow} aria-hidden="true">
            →
          </span>
        </button>
      </div>
    );
  };

  const modalStyle = {
    ["--kind-color" as string]: KIND_CONFIG[kind].color,
  } as CSSProperties;

  const content = (
    <>
      <div className={styles.modalHeader}>
        <div className={styles.modalHeaderLeft}>
          <span className={styles.eyebrow}>{dayLabel}</span>
          <h1 className={styles.modalTitle}>
            Add {KIND_CONFIG[kind].label} · Intent
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

      <div className={styles.tabBar} role="tablist">
        {TAB_ORDER.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.body}>
        {tab === "all" && renderAllTab()}
        {tab === "goals" && renderGoalsTab()}
        {tab === "recents" && renderRecentsTab()}
      </div>

      {renderJustClimbingPin()}
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
