import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { User } from "lucide-react";
import { SKILL_TREE, CATEGORY_COLORS } from "../../data/skillTree";
import { isLeaf } from "../../utils/tree";
import { useGoals } from "../../contexts/useGoals";
import type { TreeBranch, TreeLeaf, TreeNode } from "../../types";
import { findLeaf, getLeafCategory } from "../../lib/skillTreeLookup";
import { SkillDetailPanel } from "./SkillDetailPanel";
import styles from "./SkillTreePage.module.css";

// ── Layout constants ──────────────────────────────────────────────────────────
const CX = 800;
const CY = 540;

const RING_CAT = 220;
const RING_LEAF_BASE = 175;

const R_CENTER = 46;
const R_CAT = 50;
const R_LEAF = 36;

const FONT_DISPLAY = "'Bricolage Grotesque', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

const MAX_GOALS = 5;

type View = { x: number; y: number; k: number };

// ── Category icon glyphs ──────────────────────────────────────────────────────
function CatIcon({ id, size = 28 }: { id: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "white",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (id) {
    case "technique":
      return (
        <svg {...common}>
          <path d="M5 14.5c0-3.5 4-7.5 9-7.5 3.5 0 5 1.5 5 3.5 0 .8-.4 1.4-1 1.7l-2.4 1.1c-.7.3-1.1.9-1.1 1.7v.5c0 1.4-1.2 2.5-2.5 2.5H7.5C6.1 18 5 16.9 5 15.5Z" />
          <path d="M9 14.5 9 12" />
          <path d="M12.5 14.5 12.5 11.5" />
        </svg>
      );
    case "flexibility-mobility":
      return (
        <svg {...common}>
          <path d="M4 18c0-8 6-12 12-12" />
          <path d="M13 4l3 2-2 3" />
          <circle cx="4" cy="18" r="1.3" fill="white" />
        </svg>
      );
    case "mental":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4.5" />
          <circle cx="12" cy="12" r="1.5" fill="white" stroke="none" />
        </svg>
      );
    case "grips":
      return (
        <svg {...common}>
          <path d="M12 3.5 5 6v6c0 4.5 3 7.5 7 8.5 4-1 7-4 7-8.5V6l-7-2.5Z" />
          <path d="M9 12l2.2 2.2L15 10.4" />
        </svg>
      );
    case "physical-strength":
      return (
        <svg {...common}>
          <rect x="3.5" y="9.5" width="2.5" height="5" rx=".4" />
          <rect x="18" y="9.5" width="2.5" height="5" rx=".4" />
          <rect x="6.5" y="7.5" width="3" height="9" rx=".6" />
          <rect x="14.5" y="7.5" width="3" height="9" rx=".6" />
          <path d="M9.5 12h5" />
        </svg>
      );
    default:
      return null;
  }
}

// ── Geometry helpers ──────────────────────────────────────────────────────────
function catPos(i: number, total = 5): [number, number] {
  const a = (i * (360 / total) - 90) * (Math.PI / 180);
  return [
    Math.round(CX + RING_CAT * Math.cos(a)),
    Math.round(CY + RING_CAT * Math.sin(a)),
  ];
}

function leafPositions(catIdx: number, count: number, total = 5): Array<[number, number]> {
  const a = (catIdx * (360 / total) - 90) * (Math.PI / 180);
  const [px, py] = catPos(catIdx, total);
  const orbit = count <= 2 ? 145 : count <= 3 ? 160 : 175;
  const arcDeg = count <= 1 ? 0 : count === 2 ? 56 : count === 3 ? 104 : 138;
  const arcRad = (arcDeg * Math.PI) / 180;
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0 : (i - (count - 1) / 2) / (count - 1);
    const theta = a + t * arcRad;
    return [
      Math.round(px + orbit * Math.cos(theta)),
      Math.round(py + orbit * Math.sin(theta)),
    ] as [number, number];
  });
}

// Flat-top hex — keep current rotation (vertices at i*60°, not pointy-top).
function hexPts(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = i * 60 * (Math.PI / 180);
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
}

function radialLabel(cx: number, cy: number, refX: number, refY: number, gap: number) {
  const theta = Math.atan2(cy - refY, cx - refX);
  return {
    x: cx + gap * Math.cos(theta),
    y: cy + gap * Math.sin(theta),
    anchor:
      Math.abs(Math.cos(theta)) > 0.5
        ? Math.cos(theta) > 0
          ? ("start" as const)
          : ("end" as const)
        : ("middle" as const),
  };
}

function leafInitials(label: string): string {
  return label
    .split(/\s+/)
    .filter((w) => w !== "&")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ── Boulderer center hex ──────────────────────────────────────────────────────
function Boulderer({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const iconSize = r * 0.9;
  return (
    <g style={{ pointerEvents: "none" }}>
      <polygon points={hexPts(cx, cy, r * 1.34)} fill="rgba(26,24,20,.04)" />
      <polygon
        points={hexPts(cx, cy, r * 1.34)}
        fill="none"
        stroke="rgba(26,24,20,.22)"
        strokeWidth="1"
        strokeDasharray="3 5"
      />
      <polygon points={hexPts(cx, cy, r)} fill="#1a1814" />
      <polygon
        points={hexPts(cx, cy, r)}
        fill="none"
        stroke="rgba(255,255,255,.08)"
        strokeWidth="1"
      />
      <foreignObject
        x={cx - iconSize / 2}
        y={cy - iconSize / 2}
        width={iconSize}
        height={iconSize}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <User color="#f6f7f8" strokeWidth={1.6} size={iconSize} />
        </div>
      </foreignObject>
    </g>
  );
}

// ── Goal marker (tag style, tucked at upper-right vertex) ─────────────────────
function GoalTag({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g className={styles.goalTag} transform={`translate(${cx} ${cy}) rotate(14)`}>
      <rect x="-13" y="-7" width="26" height="14" rx="2" />
      <line x1="-13" y1="0" x2="-9" y2="0" />
      <circle cx="-13" cy="0" r="1.2" fill="rgba(26,24,20,.6)" />
      <text x="0" y="3.2" textAnchor="middle">
        GOAL
      </text>
    </g>
  );
}

// ── HexNode (category or leaf) ────────────────────────────────────────────────
interface HexNodeProps {
  kind: "cat" | "leaf";
  cx: number;
  cy: number;
  r: number;
  color: string;
  iconId?: string;
  initials?: string;
  label: string;
  sublabel?: string;
  selected?: boolean;
  inactive?: boolean;
  isGoal?: boolean;
  onClick?: () => void;
}

function HexNode({
  kind,
  cx,
  cy,
  r,
  color,
  iconId,
  initials,
  label,
  sublabel,
  selected,
  inactive,
  isGoal: isGoalProp,
  onClick,
}: HexNodeProps) {
  const dim = inactive ? 0.45 : 1;
  const scale = selected ? 1.05 : 1;
  const transform = `translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`;
  const labelGap = kind === "cat" ? r * 1.25 : r * 1.45;
  const lp =
    kind === "cat"
      ? { x: cx, y: cy + r + 23, anchor: "middle" as const }
      : radialLabel(cx, cy, CX, CY, labelGap);
  // Upper-right vertex on flat-top hex: angle -60° (300°).
  const tagX = cx + (r + 6) * Math.cos(-Math.PI / 3);
  const tagY = cy + (r + 6) * Math.sin(-Math.PI / 3);
  return (
    <g
      transform={transform}
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        opacity: dim,
        transition: "transform .35s cubic-bezier(.2,.7,.2,1), opacity .25s",
      }}
    >
      {selected && (
        <polygon
          points={hexPts(cx, cy, r * 1.34)}
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeDasharray="3 5"
          opacity=".65"
        />
      )}
      <polygon points={hexPts(cx, cy, r * 1.18)} fill={color} opacity={selected ? 0.16 : 0.08} />
      <polygon points={hexPts(cx, cy, r)} fill={color} filter="url(#hexShadow)" />
      <polygon
        points={hexPts(cx, cy, r - 1.5)}
        fill="none"
        stroke="rgba(255,255,255,.18)"
        strokeWidth="1"
      />

      {kind === "cat" && iconId && (
        <g style={{ pointerEvents: "none" }} transform={`translate(${cx - 14} ${cy - 14})`}>
          <CatIcon id={iconId} size={28} />
        </g>
      )}

      {kind === "leaf" && initials && (
        <text
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily={FONT_MONO}
          fontSize={13}
          fontWeight={600}
          letterSpacing="0.08em"
          fill="white"
          style={{ pointerEvents: "none" }}
        >
          {initials}
        </text>
      )}

      {isGoalProp && (
        <g style={{ pointerEvents: "none" }}>
          <GoalTag cx={tagX} cy={tagY} />
        </g>
      )}

      {kind === "cat" ? (
        <>
          <text
            x={cx}
            y={cy + r + 23}
            textAnchor="middle"
            fontFamily={FONT_DISPLAY}
            fontSize={14}
            fontWeight={600}
            letterSpacing="-.005em"
            fill="#1a1814"
            stroke="#f5f6f6"
            strokeWidth={4}
            strokeLinejoin="round"
            paintOrder="stroke"
            style={{ pointerEvents: "none" }}
          >
            {label}
          </text>
          {sublabel && (
            <text
              x={cx}
              y={cy + r + 37}
              textAnchor="middle"
              fontFamily={FONT_MONO}
              fontSize={9}
              letterSpacing="0.14em"
              fill="#8d8f92"
              stroke="#f5f6f6"
              strokeWidth={3}
              strokeLinejoin="round"
              paintOrder="stroke"
              style={{ pointerEvents: "none", textTransform: "uppercase" }}
            >
              {sublabel}
            </text>
          )}
        </>
      ) : (
        <text
          x={lp.x}
          y={lp.y}
          textAnchor={lp.anchor}
          dominantBaseline="central"
          fontFamily={FONT_DISPLAY}
          fontSize={12.5}
          fontWeight={500}
          letterSpacing="-.005em"
          fill="#1a1814"
          stroke="#f5f6f6"
          strokeWidth={4}
          strokeLinejoin="round"
          paintOrder="stroke"
          style={{ pointerEvents: "none" }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function SkillTreePage() {
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [selectedLeafId, setSelectedLeafId] = useState<string | null>(null);
  const { goals, isGoal } = useGoals();

  const wrapRef = useRef<HTMLDivElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const viewRef = useRef<View>({ x: 0, y: 0, k: 1 });
  const dragRef = useRef<{ sx: number; sy: number; vx: number; vy: number } | null>(null);
  const hasDragged = useRef(false);
  const animRef = useRef<number | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const lastFocusRef = useRef<number | null>(null);

  const activeCat = useMemo(
    () =>
      SKILL_TREE.find((n) => n.id === activeCatId && !isLeaf(n)) as TreeBranch | undefined,
    [activeCatId],
  );

  const selectedLeaf = useMemo((): TreeLeaf | null => {
    if (!selectedLeafId) return null;
    return findLeaf(SKILL_TREE, selectedLeafId);
  }, [selectedLeafId]);

  const selectedCategory = useMemo((): TreeBranch | null => {
    if (!selectedLeafId) return null;
    return getLeafCategory(SKILL_TREE, selectedLeafId);
  }, [selectedLeafId]);

  const catColor = selectedCategory
    ? CATEGORY_COLORS[selectedCategory.id] ?? "#888"
    : activeCatId
      ? CATEGORY_COLORS[activeCatId] ?? "#888"
      : "#888";

  const skillCount = useMemo(
    () =>
      SKILL_TREE.reduce(
        (a, c) => a + (isLeaf(c) ? 1 : (c as TreeBranch).children.length),
        0,
      ),
    [],
  );

  // ── Transform helpers ──────────────────────────────────────────────────────
  // Apply pan/zoom as an SVG `transform` on an inner <g>, not a CSS transform
  // on the <svg> — the latter rasterizes then scales, blurring text.
  const applyTransform = useCallback((v: View) => {
    if (gRef.current) {
      gRef.current.setAttribute(
        "transform",
        `translate(${v.x},${v.y}) scale(${v.k})`,
      );
    }
  }, []);

  const cancelAnim = useCallback(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  const animateTo = useCallback(
    (target: View, duration = 480) => {
      cancelAnim();
      const start = { ...viewRef.current };
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        const e = 1 - Math.pow(1 - p, 3);
        const next: View = {
          x: start.x + (target.x - start.x) * e,
          y: start.y + (target.y - start.y) * e,
          k: start.k + (target.k - start.k) * e,
        };
        viewRef.current = next;
        applyTransform(next);
        if (p < 1) animRef.current = requestAnimationFrame(step);
        else animRef.current = null;
      };
      animRef.current = requestAnimationFrame(step);
    },
    [applyTransform, cancelAnim],
  );

  const computeTarget = useCallback((catIdx: number | null): View | null => {
    const { width, height } = sizeRef.current;
    if (width < 60 || height < 60) return null;
    if (catIdx == null) {
      const span = (RING_CAT + RING_LEAF_BASE + 70) * 2;
      const k = Math.max(0.2, Math.min(width / span, height / span, 1.15));
      return { k, x: width / 2 - CX * k, y: height / 2 - CY * k };
    }
    const [px, py] = catPos(catIdx);
    const fx = CX + (px - CX) * 0.6;
    const fy = CY + (py - CY) * 0.6;
    const k = Math.max(0.2, Math.min(width / 780, height / 660, 1.3));
    return { k, x: width / 2 - fx * k, y: height / 2 - fy * k };
  }, []);

  const applyTarget = useCallback(
    (catIdx: number | null, animated: boolean) => {
      const target = computeTarget(catIdx);
      if (!target) return false;
      lastFocusRef.current = catIdx;
      if (animated) {
        animateTo(target, 520);
      } else {
        cancelAnim();
        viewRef.current = target;
        applyTransform(target);
      }
      return true;
    },
    [animateTo, applyTransform, cancelAnim, computeTarget],
  );

  // ── ResizeObserver + initial fit ──────────────────────────────────────────
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      sizeRef.current = { width: cr.width, height: cr.height };
      if (cr.width >= 60 && cr.height >= 60) {
        applyTarget(lastFocusRef.current, false);
      }
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    sizeRef.current = { width: r.width, height: r.height };
    if (r.width >= 60 && r.height >= 60) {
      applyTarget(null, false);
    }
    return () => ro.disconnect();
  }, [applyTarget]);

  // ── Animate focus when active category changes ─────────────────────────────
  useEffect(() => {
    if (sizeRef.current.width < 60) return;
    const idx =
      activeCatId == null ? null : SKILL_TREE.findIndex((c) => c.id === activeCatId);
    applyTarget(activeCatId == null ? null : idx, true);
  }, [activeCatId, applyTarget]);

  // ── Drag pan (bounded) ─────────────────────────────────────────────────────
  const clampView = useCallback(
    (v: View): View => {
      const home = computeTarget(lastFocusRef.current);
      if (!home) return v;
      const { width, height } = sizeRef.current;
      const maxDX = width * 0.35;
      const maxDY = height * 0.35;
      return {
        k: v.k,
        x: Math.min(home.x + maxDX, Math.max(home.x - maxDX, v.x)),
        y: Math.min(home.y + maxDY, Math.max(home.y - maxDY, v.y)),
      };
    },
    [computeTarget],
  );

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    hasDragged.current = false;
    cancelAnim();
    dragRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      vx: viewRef.current.x,
      vy: viewRef.current.y,
    };
  };
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.sx;
    const dy = e.clientY - dragRef.current.sy;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasDragged.current = true;
    const next = clampView({
      ...viewRef.current,
      x: dragRef.current.vx + dx,
      y: dragRef.current.vy + dy,
    });
    viewRef.current = next;
    applyTransform(next);
  };
  const onMouseUp = () => {
    dragRef.current = null;
  };

  // ── Click handlers ─────────────────────────────────────────────────────────
  const onCatClick = (id: string | null) => {
    if (hasDragged.current) return;
    setActiveCatId((prev) => (id === null ? null : prev === id ? null : id));
    setSelectedLeafId(null);
  };
  const onLeafClick = (id: string) => {
    if (hasDragged.current) return;
    setSelectedLeafId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.topLeft}>
            <div className={styles.bigTitle}>Skill Tree</div>
            <div className={styles.subtitle}>
              {SKILL_TREE.length} areas · {skillCount} skills · {goals.length}/{MAX_GOALS}{" "}
              goals set
            </div>
          </div>
          <div className={styles.viewPicker} role="tablist">
            <button className={styles.viewPickerActive}>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12,3 19,7 19,17 12,21 5,17 5,7" />
              </svg>
              Map
            </button>
            <div className={styles.viewPickerDivider} />
            <button>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="7" x2="19" y2="7" />
                <line x1="5" y1="12" x2="19" y2="12" />
                <line x1="5" y1="17" x2="19" y2="17" />
              </svg>
              List
            </button>
          </div>
        </div>
      </header>

      {/* Goal coverage bar */}
      <div className={styles.gBar}>
        <div className={styles.gBarTitle}>
          <span>Goals</span>
          <span className={styles.gBarTally}>
            <strong>{goals.length}</strong>
            <span className={styles.gBarTallySlash}>/</span>
            <span>{MAX_GOALS}</span>
          </span>
        </div>
        <div className={styles.gBarChips}>
          {goals.map((g) => {
            const leaf = findLeaf(SKILL_TREE, g.leafId);
            const cat = getLeafCategory(SKILL_TREE, g.leafId);
            if (!leaf || !cat) return null;
            const color = CATEGORY_COLORS[cat.id] ?? "#888";
            const isSel = selectedLeafId === g.leafId;
            return (
              <button
                key={g.leafId}
                className={`${styles.gChip} ${isSel ? styles.gChipSelected : ""}`}
                style={{ "--cat": color } as React.CSSProperties}
                onClick={() => {
                  setActiveCatId(cat.id);
                  setSelectedLeafId(g.leafId);
                }}
              >
                <span className={styles.gChipDot} />
                <span className={styles.gChipLeaf}>{leaf.label}</span>
              </button>
            );
          })}
          {Array.from({ length: Math.max(0, MAX_GOALS - goals.length) }).map((_, i) => (
            <span
              key={`empty-${i}`}
              className={`${styles.gChip} ${styles.gChipEmpty}`}
              style={{ "--cat": "var(--ink-3)" } as React.CSSProperties}
            >
              <span className={styles.gChipDot} />
              <span className={styles.gChipLeaf}>Open slot</span>
            </span>
          ))}
          <span className={styles.gBarHint}>Tap any skill below to set a goal</span>
        </div>
      </div>

      {/* Tree canvas + rail */}
      <div className={styles.canvasOuter}>
        <div className={styles.canvasInner}>
          <div
            ref={wrapRef}
            className={styles.canvasWrap}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onClick={(e) => {
              if (e.target === e.currentTarget && !hasDragged.current) {
                setSelectedLeafId(null);
              }
            }}
          >
            <svg className={styles.treeSvg} width="100%" height="100%">
              <defs>
                <filter id="hexShadow" x="-40%" y="-40%" width="180%" height="180%">
                  <feDropShadow
                    dx="0"
                    dy="4"
                    stdDeviation="6"
                    floodColor="#000"
                    floodOpacity="0.16"
                  />
                </filter>
              </defs>

              <g ref={gRef}>

              {/* Dashed guide rings */}
              <g opacity={0.55}>
                <circle
                  cx={CX}
                  cy={CY}
                  r={RING_CAT}
                  fill="none"
                  stroke="rgba(26,24,20,.18)"
                  strokeWidth="1"
                  strokeDasharray="2 8"
                />
                {activeCatId && (
                  <circle
                    cx={CX}
                    cy={CY}
                    r={RING_CAT + RING_LEAF_BASE}
                    fill="none"
                    stroke="rgba(26,24,20,.18)"
                    strokeWidth="1"
                    strokeDasharray="2 8"
                  />
                )}
              </g>

              {/* Center → categories (drawn under hexes, full center-to-center) */}
              {SKILL_TREE.map((cat, i) => {
                const [px, py] = catPos(i);
                const isActive = cat.id === activeCatId;
                const isInactive = activeCatId !== null && !isActive;
                const color = CATEGORY_COLORS[cat.id] ?? "#888";
                return (
                  <line
                    key={`l-${cat.id}`}
                    x1={CX}
                    y1={CY}
                    x2={px}
                    y2={py}
                    stroke={color}
                    strokeWidth={isActive ? 2 : 1.5}
                    strokeDasharray={isActive ? "0" : "4 6"}
                    opacity={isInactive ? 0.18 : isActive ? 0.85 : 0.55}
                    style={{
                      transition:
                        "opacity .2s, stroke-width .2s, stroke-dasharray .2s",
                    }}
                  />
                );
              })}

              {/* Active category → leaves (drawn under hexes, full center-to-center) */}
              {activeCat &&
                (() => {
                  const idx = SKILL_TREE.findIndex((c) => c.id === activeCatId);
                  const [px, py] = catPos(idx);
                  const positions = leafPositions(idx, activeCat.children.length);
                  const color = CATEGORY_COLORS[activeCatId!] ?? "#888";
                  return positions.map(([lx, ly], i) => (
                    <line
                      key={`ll-${activeCatId}-${i}`}
                      x1={px}
                      y1={py}
                      x2={lx}
                      y2={ly}
                      stroke={color}
                      strokeWidth="1.5"
                      opacity="0.55"
                    />
                  ));
                })()}

              {/* Boulderer center */}
              <Boulderer cx={CX} cy={CY} r={R_CENTER} />

              {/* Category hexes */}
              {SKILL_TREE.map((cat, i) => {
                if (isLeaf(cat)) return null;
                const branch = cat as TreeBranch;
                const [px, py] = catPos(i);
                const isActive = cat.id === activeCatId;
                const isInactive = activeCatId !== null && !isActive;
                const goalsInCat = branch.children.filter(
                  (l) => isLeaf(l) && isGoal((l as TreeLeaf).id),
                ).length;
                const sub =
                  goalsInCat > 0
                    ? `${branch.children.length} skills · ${goalsInCat} goal${goalsInCat === 1 ? "" : "s"}`
                    : `${branch.children.length} skills`;
                return (
                  <HexNode
                    key={cat.id}
                    kind="cat"
                    cx={px}
                    cy={py}
                    r={R_CAT}
                    color={CATEGORY_COLORS[cat.id] ?? "#888"}
                    iconId={cat.id}
                    label={cat.label}
                    sublabel={sub}
                    selected={isActive}
                    inactive={isInactive}
                    onClick={() => onCatClick(cat.id)}
                  />
                );
              })}

              {/* Active category — leaves */}
              {activeCat &&
                (() => {
                  const idx = SKILL_TREE.findIndex((c) => c.id === activeCatId);
                  const positions = leafPositions(idx, activeCat.children.length);
                  return activeCat.children.map((leaf: TreeNode, i: number) => {
                    if (!isLeaf(leaf)) return null;
                    const tl = leaf as TreeLeaf;
                    const [lx, ly] = positions[i];
                    return (
                      <HexNode
                        key={tl.id}
                        kind="leaf"
                        cx={lx}
                        cy={ly}
                        r={R_LEAF}
                        color={CATEGORY_COLORS[activeCatId!] ?? "#888"}
                        initials={leafInitials(tl.label)}
                        label={tl.label}
                        selected={tl.id === selectedLeafId}
                        isGoal={isGoal(tl.id)}
                        onClick={() => onLeafClick(tl.id)}
                      />
                    );
                  });
                })()}
              </g>
            </svg>

            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
              <button
                className={`${styles.crumb} ${activeCatId ? "" : styles.crumbActive}`}
                onClick={() => onCatClick(null)}
              >
                All Skills
              </button>
              {activeCat && (
                <>
                  <span className={styles.crumbSep}>/</span>
                  <span className={`${styles.crumb} ${styles.crumbActive}`}>
                    {activeCat.label}
                  </span>
                </>
              )}
            </div>

            {/* Legend */}
            <div className={styles.legend}>
              <span
                className={styles.swatch}
                style={{ "--cat": "var(--ink-2)" } as React.CSSProperties}
              >
                <span className={styles.swatchDot} /> Goal
              </span>
              <span
                className={`${styles.swatch} ${styles.swatchGhost}`}
                style={{ "--cat": "var(--ink-2)" } as React.CSSProperties}
              >
                <span className={styles.swatchDot} /> Empty slot
              </span>
              <span className={styles.legendHint}>Drag to pan</span>
            </div>

          </div>

          {/* Detail rail */}
          <SkillDetailPanel
            leaf={selectedLeaf}
            categoryColor={catColor}
            onClose={() => setSelectedLeafId(null)}
          />
        </div>
      </div>
    </div>
  );
}
