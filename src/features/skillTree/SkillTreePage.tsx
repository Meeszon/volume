import { createElement, Fragment, useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Goal, User } from "lucide-react";
import { SKILL_TREE, CATEGORY_COLORS } from "../../data/skillTree";
import { getIconFor } from "../../data/iconMap";
import { isLeaf } from "../../utils/tree";
import { useGoals } from "../../contexts/useGoals";
import type { TreeBranch, TreeLeaf, TreeNode } from "../../types";
import {
  findLeaf,
  getAllLeaves,
  getLeafAncestors,
  getLeafCategory,
} from "../../lib/skillTreeLookup";
import { SkillDetailPanel } from "./SkillDetailPanel";
import styles from "./SkillTreePage.module.css";

const FALLBACK_CAT_COLOR = "#888";
function getCatColor(id: string | null | undefined): string {
  return (id && CATEGORY_COLORS[id]) || FALLBACK_CAT_COLOR;
}

const CX = 800;
const CY = 540;

const RING_CAT = 220;
const RING_LEAF_BASE = 220;

const R_CENTER = 46;
const R_CAT = 50;
// 40 fits the longest leaf word at SKILL_LABEL_STYLE while keeping ≥7px gap
// between adjacent tier-2 hexes at the tightest layout (count=4, orbit=180).
const R_LEAF = 40;

const TINT_RADIUS_MUL = 1.18;
const RING_RADIUS_MUL = 1.34;

const FONT_DISPLAY = "'Bricolage Grotesque', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

const MAX_GOALS = 5;

type View = { x: number; y: number; k: number };

type Focus =
  | { kind: "all" }
  | { kind: "cat"; idx: number }
  | { kind: "point"; x: number; y: number };

function catPos(i: number, total = 5): [number, number] {
  const a = (i * (360 / total) - 90) * (Math.PI / 180);
  return [
    Math.round(CX + RING_CAT * Math.cos(a)),
    Math.round(CY + RING_CAT * Math.sin(a)),
  ];
}

// Orbit radius + arc spread by child count. Tier 1 fans wider from cat hexes;
// tier 2 stays tighter so the fanout fits inside the camera frame.
interface FanRow { orbit: number; arcDeg: number }
const TIER1_LAYOUT: readonly FanRow[] = [
  { orbit: 185, arcDeg: 0 },
  { orbit: 185, arcDeg: 0 },
  { orbit: 185, arcDeg: 50 },
  { orbit: 205, arcDeg: 92 },
  { orbit: 220, arcDeg: 124 },
];
const TIER2_LAYOUT: readonly FanRow[] = [
  { orbit: 150, arcDeg: 0 },
  { orbit: 150, arcDeg: 0 },
  { orbit: 150, arcDeg: 44 },
  { orbit: 165, arcDeg: 72 },
  { orbit: 180, arcDeg: 98 },
];

function fanPositions(
  centerX: number,
  centerY: number,
  baseTheta: number,
  count: number,
  table: readonly FanRow[],
): Array<[number, number]> {
  const { orbit, arcDeg } = table[Math.min(count, table.length - 1)];
  const arcRad = (arcDeg * Math.PI) / 180;
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0 : (i - (count - 1) / 2) / (count - 1);
    const theta = baseTheta + t * arcRad;
    return [
      Math.round(centerX + orbit * Math.cos(theta)),
      Math.round(centerY + orbit * Math.sin(theta)),
    ] as [number, number];
  });
}

function leafPositions(catIdx: number, count: number, total = 5): Array<[number, number]> {
  const a = (catIdx * (360 / total) - 90) * (Math.PI / 180);
  const [px, py] = catPos(catIdx, total);
  return fanPositions(px, py, a, count, TIER1_LAYOUT);
}

function subLeafPositions(
  catIdx: number,
  subcatPos: [number, number],
  count: number,
  total = 5,
): Array<[number, number]> {
  const [cxCat, cyCat] = catPos(catIdx, total);
  const [sx, sy] = subcatPos;
  const baseTheta = Math.atan2(sy - cyCat, sx - cxCat);
  return fanPositions(sx, sy, baseTheta, count, TIER2_LAYOUT);
}

// Flat-top hex: vertices at k·60°.
function hexPts(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = i * 60 * (Math.PI / 180);
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
}

// Distance from a flat-top hex center along `theta` to the polygon edge at
// radius `r`. Trims connector lines to the full-colour hex boundary so they
// don't show through under the surrounding translucent tint ring.
function hexEdgeDistance(r: number, theta: number): number {
  const PI_3 = Math.PI / 3;
  const PI_6 = Math.PI / 6;
  // Signed angular offset from the nearest edge midpoint, in [-π/6, π/6].
  // Using `x - p·round(x/p)` instead of `((x % p) + p) % p - p/2` because the
  // latter collapses x ≡ 0 (mod p) to -p/2 instead of 0 — over-trimming any
  // line aimed at an edge midpoint (notably θ=-π/2).
  const shifted = theta - PI_6;
  const phi = shifted - PI_3 * Math.round(shifted / PI_3);
  return (r * Math.cos(PI_6)) / Math.cos(phi);
}

function labelAt(cx: number, cy: number, gap: number, theta: number) {
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

function radialLabel(cx: number, cy: number, refX: number, refY: number, gap: number) {
  return labelAt(cx, cy, gap, Math.atan2(cy - refY, cx - refX));
}

// Tightest wdth+tracking that still fits the longest stacked word inside the
// 69px inscribed hex width at this size.
const SKILL_LABEL_STYLE = {
  size: 10,
  weight: 560,
  wdth: 86,
  tracking: ".04em",
} as const;

// Hyphenate a single long word into two stacked lines so it doesn't read as a
// cramped horizontal strip inside the hex.
function splitLongLeafLabel(label: string): string[] {
  const words = label.split(/\s+/);
  if (words.length === 1 && words[0].length >= 10) {
    const w = words[0];
    const cut = Math.ceil(w.length / 2) + 1;
    return [w.slice(0, cut) + "-", w.slice(cut)];
  }
  return words;
}

function Boulderer({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const iconSize = r * 0.9;
  return (
    <g style={{ pointerEvents: "none" }}>
      <polygon points={hexPts(cx, cy, r * RING_RADIUS_MUL)} fill="rgba(26,24,20,.04)" />
      <polygon
        points={hexPts(cx, cy, r * RING_RADIUS_MUL)}
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
      <User
        x={cx - iconSize / 2}
        y={cy - iconSize / 2}
        width={iconSize}
        height={iconSize}
        color="#f6f7f8"
        strokeWidth={1.6}
      />
    </g>
  );
}

const GOAL_ICON_SIZE = 13;

interface HexIconProps {
  iconId: string;
  cx: number;
  cy: number;
  size: number;
}
function HexIcon({ iconId, cx, cy, size }: HexIconProps) {
  // `createElement` rather than `<Icon />` — keeps the icon-component lookup
  // as a runtime call, not a render-time component declaration (which would
  // trip react-hooks/static-components).
  return createElement(getIconFor(iconId), {
    x: cx - size / 2,
    y: cy - size / 2,
    width: size,
    height: size,
    color: "#fff",
    strokeWidth: 1.8,
    style: { pointerEvents: "none" },
  });
}

function GoalTag({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  return (
    <g className={styles.goalTag} style={{ pointerEvents: "none" }}>
      <Goal
        x={cx - size / 2}
        y={cy - size / 2}
        width={size}
        height={size}
        color="rgba(255,251,244,.96)"
        strokeWidth={1.8}
      />
    </g>
  );
}

// `cat` and `subcat` carry an icon glyph + external label; `skill` carries its
// wrapped name inside the hex with no external label.
interface HexNodeProps {
  kind: "cat" | "subcat" | "skill";
  cx: number;
  cy: number;
  r: number;
  color: string;
  iconId?: string;
  label: string;
  sublabel?: string;
  selected?: boolean;
  inactive?: boolean;
  isGoal?: boolean;
  onClick?: () => void;
  // Delay before the selected ring fades in, so the cat line draws first.
  ringAnimDelay?: number;
  isClosing?: boolean;
  // Override: keeps the ring rendered for the full close window while the
  // inner glyph deselects partway through. Defaults to `selected`.
  ringActive?: boolean;
  // Explicit label angle for subcats — used to push the label perpendicular
  // to the cat→subcat axis so it clears the outbound tier-2 connectors.
  labelAngle?: number;
}

function HexNode({
  kind,
  cx,
  cy,
  r,
  color,
  iconId,
  label,
  sublabel,
  selected,
  inactive,
  isGoal: isGoalProp,
  onClick,
  ringAnimDelay,
  isClosing,
  ringActive,
  labelAngle,
}: HexNodeProps) {
  const showRing = ringActive ?? selected;
  const dim = inactive ? 0.45 : 1;
  const scale = selected ? 1.05 : 1;
  const transform = `translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`;
  // 1.9·r keeps the centered subcat label + sublabel clear of the tint ring
  // at borderline angles where the text anchor extends back into the hex.
  const labelGap = r * 1.9;
  const lp =
    labelAngle !== undefined
      ? labelAt(cx, cy, labelGap, labelAngle)
      : radialLabel(cx, cy, CX, CY, labelGap);

  const skillWords = kind === "skill" ? splitLongLeafLabel(label) : [];

  const isSkillGoal = kind === "skill" && !!isGoalProp;
  const skillLineHeight = SKILL_LABEL_STYLE.size * 1.08;
  const skillTextHeight = (skillWords.length || 1) * skillLineHeight;
  const goalTextShift = isSkillGoal ? GOAL_ICON_SIZE / 2 : 0;
  const goalIconCy = cy - skillTextHeight / 2 - GOAL_ICON_SIZE / 2;

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
      {showRing && (
        <polygon
          className={`${styles.selectedRing} ${isClosing ? styles.closing : ""}`}
          points={hexPts(cx, cy, r * RING_RADIUS_MUL)}
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeDasharray="3 5"
          style={
            !isClosing && ringAnimDelay
              ? ({ animationDelay: `${ringAnimDelay}ms` } as React.CSSProperties)
              : undefined
          }
        />
      )}
      <polygon
        points={hexPts(cx, cy, r * TINT_RADIUS_MUL)}
        fill={color}
        opacity={selected ? 0.16 : 0.08}
        style={{ transition: "opacity .35s cubic-bezier(.2,.7,.2,1)" }}
      />
      <polygon points={hexPts(cx, cy, r)} fill={color} filter="url(#hexShadow)" />
      <polygon
        points={hexPts(cx, cy, r - 1.5)}
        fill="none"
        stroke="rgba(255,255,255,.18)"
        strokeWidth="1"
      />
      {isSkillGoal && (
        <GoalTag cx={cx} cy={goalIconCy} size={GOAL_ICON_SIZE} />
      )}

      {kind === "cat" && iconId && (
        <HexIcon iconId={iconId} cx={cx} cy={cy} size={28} />
      )}

      {kind === "subcat" && iconId && (
        <HexIcon iconId={iconId} cx={cx} cy={cy} size={22} />
      )}

      {kind === "skill" && (
        <g style={{ pointerEvents: "none" }}>
          {/* SVG text (not foreignObject HTML) so the letterpress composes
              cleanly with the camera transform instead of blurring on pan. */}
          {skillWords.map((word, i) => {
            const lineHeight = SKILL_LABEL_STYLE.size * 1.08;
            const yLine =
              cy +
              goalTextShift +
              (i - (skillWords.length - 1) / 2) * lineHeight;
            const upper = word.toUpperCase();
            const textProps = {
              x: cx,
              textAnchor: "middle" as const,
              dominantBaseline: "central" as const,
              fontFamily: FONT_DISPLAY,
              fontSize: SKILL_LABEL_STYLE.size,
              fontWeight: SKILL_LABEL_STYLE.weight,
              letterSpacing: SKILL_LABEL_STYLE.tracking,
              style: {
                fontVariationSettings: `"wght" ${SKILL_LABEL_STYLE.weight}, "wdth" ${SKILL_LABEL_STYLE.wdth}, "opsz" 12`,
                userSelect: "none" as const,
              } as React.CSSProperties,
            };
            return (
              <Fragment key={i}>
                <text {...textProps} y={yLine + 0.5} fill="rgba(0,0,0,.36)">
                  {upper}
                </text>
                <text {...textProps} y={yLine - 0.5} fill="rgba(255,255,255,.14)">
                  {upper}
                </text>
                <text {...textProps} y={yLine} fill="rgba(255,251,244,.96)">
                  {upper}
                </text>
              </Fragment>
            );
          })}
        </g>
      )}

      {kind === "cat" && (
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
      )}

      {kind === "subcat" && (
        <>
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
          {sublabel && (
            <text
              x={lp.x}
              y={lp.y + 13}
              textAnchor={lp.anchor}
              dominantBaseline="central"
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
      )}

    </g>
  );
}

// Total duration of the close sequence. Elements stay mounted this long after
// being moved to `closing*Id` so they animate out before unmounting.
const CLOSE_SEQ_MS = 800;

// When during a close the cat hex itself stops looking selected (scale/tint
// ease back). The ring keeps fading and the line keeps undrawing until the
// full CLOSE_SEQ_MS elapses.
const GLYPH_RELEASE_MS = 280;

// One-shot index over SKILL_TREE — branch lookups, leaf counts, parent ids.
// Avoids repeated tree walks in render and replaces the inline `findParent`.
interface BranchInfo {
  branch: TreeBranch;
  parentCatId: string | null;
  leafCount: number;
  totalLeafCount: number;
}
const BRANCH_INDEX: Record<string, BranchInfo> = (() => {
  const out: Record<string, BranchInfo> = {};
  function walk(node: TreeNode, parentCatId: string | null): number {
    if (isLeaf(node)) return 1;
    const branch = node as TreeBranch;
    const isCat = parentCatId === null;
    const total = branch.children.reduce(
      (sum, c) => sum + walk(c, isCat ? branch.id : parentCatId),
      0,
    );
    out[branch.id] = {
      branch,
      parentCatId,
      leafCount: total,
      totalLeafCount: total,
    };
    return total;
  }
  for (const top of SKILL_TREE) walk(top, null);
  return out;
})();

const TOTAL_SKILL_COUNT = getAllLeaves(SKILL_TREE).length;

export function SkillTreePage() {
  // `activeCatId` is the currently-open category. `closingCatId` is one that's
  // animating away but still mounted, so switching A → B can undraw A while B
  // opens.
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [closingCatId, setClosingCatId] = useState<string | null>(null);
  const [activeSubcatId, setActiveSubcatId] = useState<string | null>(null);
  const [closingSubcatId, setClosingSubcatId] = useState<string | null>(null);
  // Flips true GLYPH_RELEASE_MS into a close so the cat hex's scale and tint
  // ease back partway through, while the ring continues fading.
  const [glyphReleased, setGlyphReleased] = useState(false);
  const [selectedLeafId, setSelectedLeafId] = useState<string | null>(null);
  const { goals, isGoal } = useGoals();

  const wrapRef = useRef<HTMLDivElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const viewRef = useRef<View>({ x: 0, y: 0, k: 1 });
  const dragRef = useRef<{ sx: number; sy: number; vx: number; vy: number } | null>(null);
  const hasDragged = useRef(false);
  const animRef = useRef<number | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const lastFocusRef = useRef<Focus>({ kind: "all" });
  const closeTimerRef = useRef<number | null>(null);
  const subcatCloseTimerRef = useRef<number | null>(null);

  const activeCat = activeCatId ? BRANCH_INDEX[activeCatId]?.branch ?? null : null;
  const activeSubcat = activeSubcatId
    ? BRANCH_INDEX[activeSubcatId]?.branch ?? null
    : null;

  interface RenderGroup {
    catId: string;
    catIdx: number;
    branch: TreeBranch;
    isClosing: boolean;
  }
  const renderGroups = useMemo<RenderGroup[]>(() => {
    const groups: RenderGroup[] = [];
    const push = (id: string, isClosing: boolean) => {
      const info = BRANCH_INDEX[id];
      const idx = SKILL_TREE.findIndex((c) => c.id === id);
      if (info && idx >= 0) {
        groups.push({ catId: id, catIdx: idx, branch: info.branch, isClosing });
      }
    };
    if (activeCatId) push(activeCatId, false);
    if (closingCatId && closingCatId !== activeCatId) push(closingCatId, true);
    return groups;
  }, [activeCatId, closingCatId]);

  interface SubRenderGroup {
    catId: string;
    catIdx: number;
    catBranch: TreeBranch;
    subcatId: string;
    subIdx: number;
    subBranch: TreeBranch;
    isClosing: boolean;
  }
  const subRenderGroups = useMemo<SubRenderGroup[]>(() => {
    const groups: SubRenderGroup[] = [];
    const push = (catId: string, subcatId: string, isClosing: boolean) => {
      const catInfo = BRANCH_INDEX[catId];
      const subInfo = BRANCH_INDEX[subcatId];
      const idx = SKILL_TREE.findIndex((c) => c.id === catId);
      if (!catInfo || !subInfo || idx < 0) return;
      const subIdx = catInfo.branch.children.findIndex((c) => c.id === subcatId);
      if (subIdx < 0) return;
      groups.push({
        catId,
        catIdx: idx,
        catBranch: catInfo.branch,
        subcatId,
        subIdx,
        subBranch: subInfo.branch,
        isClosing,
      });
    };
    if (activeCatId && activeSubcatId) push(activeCatId, activeSubcatId, false);
    if (closingSubcatId && closingSubcatId !== activeSubcatId) {
      const parent = BRANCH_INDEX[closingSubcatId]?.parentCatId;
      if (parent) push(parent, closingSubcatId, true);
    }
    return groups;
  }, [activeCatId, activeSubcatId, closingSubcatId]);

  const selectedLeaf: TreeLeaf | null = selectedLeafId
    ? findLeaf(SKILL_TREE, selectedLeafId)
    : null;
  const selectedCategory: TreeBranch | null = selectedLeafId
    ? getLeafCategory(SKILL_TREE, selectedLeafId)
    : null;

  const catColor = getCatColor(selectedCategory?.id ?? activeCatId);

  // Resolve goal chip data once per goals change, instead of running findLeaf
  // + getLeafCategory inside the render map on every camera frame.
  const goalChips = useMemo(
    () =>
      goals
        .map((g) => {
          const leaf = findLeaf(SKILL_TREE, g.leafId);
          const cat = getLeafCategory(SKILL_TREE, g.leafId);
          if (!leaf || !cat) return null;
          return {
            leafId: g.leafId,
            label: leaf.label,
            catId: cat.id,
            color: getCatColor(cat.id),
            ancestors: getLeafAncestors(SKILL_TREE, g.leafId),
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    [goals],
  );

  // Pan/zoom is an SVG transform on an inner <g>, not a CSS transform on the
  // <svg> — the latter rasterizes then scales, blurring text.
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
    (target: View, duration = 620) => {
      cancelAnim();
      const start = { ...viewRef.current };
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        // Cubic ease-in-out — gentle start + gentle landing lets the opening
        // hex scale / line draw breathe alongside the camera move.
        const e =
          p < 0.5
            ? 4 * p * p * p
            : 1 - Math.pow(-2 * p + 2, 3) / 2;
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

  const computeTarget = useCallback((focus: Focus): View | null => {
    const { width, height } = sizeRef.current;
    if (width < 60 || height < 60) return null;
    if (focus.kind === "all") {
      const span = (RING_CAT + RING_LEAF_BASE - 30) * 2;
      const k = Math.max(0.2, Math.min(width / span, height / span, 1.15));
      return { k, x: width / 2 - CX * k, y: height / 2 - CY * k };
    }
    if (focus.kind === "cat") {
      const k = Math.max(0.2, Math.min(width / 780, height / 680, 1.6));
      const [px, py] = catPos(focus.idx);
      // Lean the focal point past midway so the branch + children own most
      // of the frame; the centered cat hex still anchors the inner edge.
      const fx = CX + (px - CX) * 0.9;
      const fy = CY + (py - CY) * 0.9;
      return { k, x: width / 2 - fx * k, y: height / 2 - fy * k };
    }
    const k = Math.max(0.2, Math.min(width / 680, height / 600, 1.7));
    const fx = focus.x + (focus.x - CX) * 0.05;
    const fy = focus.y + (focus.y - CY) * 0.05;
    return { k, x: width / 2 - fx * k, y: height / 2 - fy * k };
  }, []);

  const applyTarget = useCallback(
    (focus: Focus, animated: boolean) => {
      const target = computeTarget(focus);
      if (!target) return false;
      lastFocusRef.current = focus;
      if (animated) {
        animateTo(target);
      } else {
        cancelAnim();
        viewRef.current = target;
        applyTransform(target);
      }
      return true;
    },
    [animateTo, applyTransform, cancelAnim, computeTarget],
  );

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
      applyTarget({ kind: "all" }, false);
    }
    return () => ro.disconnect();
  }, [applyTarget]);

  useEffect(() => {
    if (sizeRef.current.width < 60) return;
    let focus: Focus = { kind: "all" };
    if (activeCatId !== null) {
      const catIdx = SKILL_TREE.findIndex((c) => c.id === activeCatId);
      if (catIdx >= 0) {
        focus = { kind: "cat", idx: catIdx };
        const branch = BRANCH_INDEX[activeCatId]?.branch;
        if (activeSubcatId !== null && branch) {
          const subIdx = branch.children.findIndex(
            (c) => c.id === activeSubcatId,
          );
          if (subIdx >= 0) {
            const [sx, sy] = leafPositions(catIdx, branch.children.length)[subIdx];
            focus = { kind: "point", x: sx, y: sy };
          }
        }
      }
    }
    applyTarget(focus, true);
  }, [activeCatId, activeSubcatId, applyTarget]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      if (subcatCloseTimerRef.current !== null) {
        clearTimeout(subcatCloseTimerRef.current);
        subcatCloseTimerRef.current = null;
      }
      cancelAnim();
    };
  }, [cancelAnim]);

  useEffect(() => {
    if (closingCatId === null) {
      setGlyphReleased(false);
      return;
    }
    setGlyphReleased(false);
    const t = window.setTimeout(() => setGlyphReleased(true), GLYPH_RELEASE_MS);
    return () => clearTimeout(t);
  }, [closingCatId]);

  const clampView = useCallback(
    (v: View): View => {
      const focus = lastFocusRef.current;
      const home = computeTarget(focus);
      if (!home) return v;
      const { width, height } = sizeRef.current;
      // Wider pan budget at cat focus so the user can peek at neighbours;
      // tighter at fit-all and subcat (the latter is already zoomed in far).
      const baseMul = focus.kind === "cat" ? 0.5 : 0.35;
      const panFactor = baseMul * home.k;
      const maxDX = width * panFactor;
      const maxDY = height * panFactor;
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

  // Clears closing*Id after CLOSE_SEQ_MS so unmount runs once the animation
  // has played. Rapid follow-up clicks clear and re-arm the timer.
  const armCloseTimer = useCallback(
    (ref: React.MutableRefObject<number | null>, clear: () => void) => {
      if (ref.current !== null) clearTimeout(ref.current);
      ref.current = window.setTimeout(() => {
        clear();
        ref.current = null;
      }, CLOSE_SEQ_MS);
    },
    [],
  );

  const handoffActiveSubcat = useCallback(() => {
    if (activeSubcatId === null) return;
    setClosingSubcatId(activeSubcatId);
    setActiveSubcatId(null);
    armCloseTimer(subcatCloseTimerRef, () => setClosingSubcatId(null));
  }, [activeSubcatId, armCloseTimer]);

  const onCatClick = (id: string | null) => {
    if (hasDragged.current) return;
    setSelectedLeafId(null);

    const deselecting = id === null || activeCatId === id;

    if (deselecting) {
      if (activeCatId === null) return;
      setClosingCatId(activeCatId);
      setActiveCatId(null);
      handoffActiveSubcat();
      armCloseTimer(closeTimerRef, () => setClosingCatId(null));
      return;
    }

    if (activeCatId !== null && activeCatId !== id) {
      // Hand the outgoing cat to the closing slot so its line/leaves
      // undraw in parallel with the new cat opening.
      setClosingCatId(activeCatId);
      handoffActiveSubcat();
      armCloseTimer(closeTimerRef, () => setClosingCatId(null));
    } else {
      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setClosingCatId(null);
    }
    setActiveCatId(id);
  };

  const onSubcatClick = (id: string) => {
    if (hasDragged.current) return;
    setSelectedLeafId(null);

    if (activeSubcatId === id) {
      handoffActiveSubcat();
      return;
    }

    if (activeSubcatId !== null) {
      setClosingSubcatId(activeSubcatId);
      armCloseTimer(subcatCloseTimerRef, () => setClosingSubcatId(null));
    } else {
      if (subcatCloseTimerRef.current !== null) {
        clearTimeout(subcatCloseTimerRef.current);
        subcatCloseTimerRef.current = null;
      }
      setClosingSubcatId(null);
    }
    setActiveSubcatId(id);
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
              {SKILL_TREE.length} areas · {TOTAL_SKILL_COUNT} skills · {goals.length}/{MAX_GOALS}{" "}
              goals set
            </div>
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
          {goalChips.map((g) => {
            const isSel = selectedLeafId === g.leafId;
            return (
              <button
                key={g.leafId}
                className={`${styles.gChip} ${isSel ? styles.gChipSelected : ""}`}
                style={{ "--cat": g.color } as React.CSSProperties}
                onClick={() => {
                  setActiveCatId(g.catId);
                  setActiveSubcatId(g.ancestors.length > 1 ? g.ancestors[1].id : null);
                  setSelectedLeafId(g.leafId);
                }}
              >
                <span className={styles.gChipDot} />
                <span className={styles.gChipLeaf}>{g.label}</span>
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

              {/* Solid overlay "draws" from center outward when a cat opens;
                  closing cat keeps its overlay mounted so the line can undraw. */}
              {SKILL_TREE.map((cat, i) => {
                const [px, py] = catPos(i);
                const isActive = cat.id === activeCatId;
                const isClosingThis = cat.id === closingCatId;
                const isInactive =
                  activeCatId !== null &&
                  !isActive &&
                  (!isClosingThis || glyphReleased);
                const color = getCatColor(cat.id);
                // Trim line ends to the hex boundary so neither end sits under
                // a glyph's translucent tint ring.
                const theta = Math.atan2(py - CY, px - CX);
                const ux = Math.cos(theta);
                const uy = Math.sin(theta);
                const startTrim = hexEdgeDistance(R_CENTER, theta);
                const endTrim = hexEdgeDistance(R_CAT, theta);
                const x1 = CX + ux * startTrim;
                const y1 = CY + uy * startTrim;
                const x2 = px - ux * endTrim;
                const y2 = py - uy * endTrim;
                const lineLen = Math.hypot(x2 - x1, y2 - y1);
                return (
                  <Fragment key={`l-${cat.id}`}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={color}
                      strokeWidth={1.5}
                      strokeDasharray="4 6"
                      opacity={isInactive ? 0.18 : 0.55}
                      style={{ transition: "opacity .25s" }}
                    />
                    {(isActive || isClosingThis) && (
                      <line
                        key={`active-${cat.id}`}
                        className={`${styles.catLineDraw} ${isClosingThis ? styles.closing : ""}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={color}
                        strokeWidth={2.25}
                        strokeLinecap="round"
                        style={{ "--line-len": lineLen } as React.CSSProperties}
                      />
                    )}
                  </Fragment>
                );
              })}

              {/* Category → leaves connector lines, mounted for opening and
                  closing cats so a switch can animate in both directions. */}
              {renderGroups.map((g) => {
                const [px, py] = catPos(g.catIdx);
                const positions = leafPositions(g.catIdx, g.branch.children.length);
                const color = getCatColor(g.catId);
                return positions.map(([lx, ly], i) => {
                  const theta = Math.atan2(ly - py, lx - px);
                  const ux = Math.cos(theta);
                  const uy = Math.sin(theta);
                  const startTrim = hexEdgeDistance(R_CAT, theta);
                  const endTrim = hexEdgeDistance(R_LEAF, theta);
                  const x1 = px + ux * startTrim;
                  const y1 = py + uy * startTrim;
                  const x2 = lx - ux * endTrim;
                  const y2 = ly - uy * endTrim;
                  const len = Math.hypot(x2 - x1, y2 - y1);
                  return (
                    <line
                      key={`ll-${g.catId}-${i}`}
                      className={`${styles.leafLineDraw} ${g.isClosing ? styles.closing : ""}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={color}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      style={{ "--line-len": len } as React.CSSProperties}
                    />
                  );
                });
              })}

              <Boulderer cx={CX} cy={CY} r={R_CENTER} />

              {SKILL_TREE.map((cat, i) => {
                if (isLeaf(cat)) return null;
                const branch = cat as TreeBranch;
                const [px, py] = catPos(i);
                const isActive = cat.id === activeCatId;
                const isClosingThis = cat.id === closingCatId;
                const isInactive =
                  activeCatId !== null &&
                  !isActive &&
                  (!isClosingThis || glyphReleased);
                const leafCount = BRANCH_INDEX[cat.id]?.leafCount ?? 0;
                const goalsInCat = getAllLeaves(branch.children).filter((l) =>
                  isGoal(l.id),
                ).length;
                const sub =
                  goalsInCat > 0
                    ? `${leafCount} skills · ${goalsInCat} goal${goalsInCat === 1 ? "" : "s"}`
                    : `${leafCount} skills`;
                // The ring stays mounted for the full close; the glyph itself
                // releases earlier so scale + tint ease back as the leaves
                // collapse, not when the line finishes undrawing.
                const glyphSelected =
                  isActive || (isClosingThis && !glyphReleased);
                return (
                  <HexNode
                    key={cat.id}
                    kind="cat"
                    cx={px}
                    cy={py}
                    r={R_CAT}
                    color={getCatColor(cat.id)}
                    iconId={cat.id}
                    label={cat.label}
                    sublabel={sub}
                    selected={glyphSelected}
                    ringActive={isActive || isClosingThis}
                    inactive={isInactive}
                    onClick={() => onCatClick(cat.id)}
                    ringAnimDelay={180}
                    isClosing={isClosingThis}
                  />
                );
              })}

              {/* Tier-1 hexes. The wrapping group's transform-origin is the
                  parent cat position so the bloom grows out of (and retracts
                  into) the cat glyph. Closing-cat children are non-interactive
                  while they animate away. */}
              {renderGroups.map((g) => {
                const [px, py] = catPos(g.catIdx);
                const count = g.branch.children.length;
                const positions = leafPositions(g.catIdx, count);
                const color = getCatColor(g.catId);
                return g.branch.children.map((child: TreeNode, i: number) => {
                  const [lx, ly] = positions[i];
                  const isSubBranch = !isLeaf(child);
                  // Push the subcat label perpendicular to the cat→hex axis on
                  // the OUTBOARD side of the fan so it clears outbound tier-2
                  // connectors. Middle subcat (t=0) defaults to +π/2.
                  const t = count === 1 ? 0 : (i - (count - 1) / 2) / (count - 1);
                  const sideMul = t < 0 ? -1 : 1;
                  const tierLabelAngle =
                    Math.atan2(ly - py, lx - px) + (sideMul * Math.PI) / 2;
                  if (isSubBranch) {
                    const sb = child as TreeBranch;
                    const isSubActive = !g.isClosing && sb.id === activeSubcatId;
                    const isSubClosing = sb.id === closingSubcatId;
                    const leafCount = BRANCH_INDEX[sb.id]?.leafCount ?? 0;
                    return (
                      <g
                        key={`tier1-${g.catId}-${sb.id}`}
                        className={`${styles.leafBloom} ${g.isClosing ? styles.closing : ""}`}
                        style={
                          {
                            "--ox": `${px}px`,
                            "--oy": `${py}px`,
                            pointerEvents: g.isClosing ? "none" : undefined,
                          } as React.CSSProperties
                        }
                      >
                        <HexNode
                          kind="subcat"
                          cx={lx}
                          cy={ly}
                          r={R_LEAF}
                          color={color}
                          iconId={sb.id}
                          label={sb.label}
                          sublabel={`${leafCount} skill${leafCount === 1 ? "" : "s"}`}
                          selected={isSubActive}
                          ringActive={isSubActive || isSubClosing}
                          isClosing={isSubClosing}
                          onClick={g.isClosing ? undefined : () => onSubcatClick(sb.id)}
                          labelAngle={tierLabelAngle}
                        />
                      </g>
                    );
                  }
                  const tl = child as TreeLeaf;
                  return (
                    <g
                      key={`tier1-${g.catId}-${tl.id}`}
                      className={`${styles.leafBloom} ${g.isClosing ? styles.closing : ""}`}
                      style={
                        {
                          "--ox": `${px}px`,
                          "--oy": `${py}px`,
                          pointerEvents: g.isClosing ? "none" : undefined,
                        } as React.CSSProperties
                      }
                    >
                      <HexNode
                        kind="skill"
                        cx={lx}
                        cy={ly}
                        r={R_LEAF}
                        color={color}
                        label={tl.label}
                        selected={!g.isClosing && tl.id === selectedLeafId}
                        isGoal={isGoal(tl.id)}
                        onClick={g.isClosing ? undefined : () => onLeafClick(tl.id)}
                      />
                    </g>
                  );
                });
              })}

              {/* Tier-2 connector lines from open/closing subcategory to leaves. */}
              {subRenderGroups.map((sg) => {
                const tier1Positions = leafPositions(
                  sg.catIdx,
                  sg.catBranch.children.length,
                );
                const [sx, sy] = tier1Positions[sg.subIdx];
                const tier2Positions = subLeafPositions(
                  sg.catIdx,
                  [sx, sy],
                  sg.subBranch.children.length,
                );
                const color = getCatColor(sg.catId);
                return sg.subBranch.children.map((leaf, i) => {
                  if (!isLeaf(leaf)) return null;
                  const [lx, ly] = tier2Positions[i];
                  const theta = Math.atan2(ly - sy, lx - sx);
                  const ux = Math.cos(theta);
                  const uy = Math.sin(theta);
                  const startTrim = hexEdgeDistance(R_LEAF, theta);
                  const endTrim = hexEdgeDistance(R_LEAF, theta);
                  const x1 = sx + ux * startTrim;
                  const y1 = sy + uy * startTrim;
                  const x2 = lx - ux * endTrim;
                  const y2 = ly - uy * endTrim;
                  const len = Math.hypot(x2 - x1, y2 - y1);
                  return (
                    <line
                      key={`sl-${sg.subcatId}-${i}`}
                      className={`${styles.leafLineDraw} ${styles.tier2} ${sg.isClosing ? styles.closing : ""}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={color}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      style={{ "--line-len": len } as React.CSSProperties}
                    />
                  );
                });
              })}

              {/* Tier-2 leaf hexes — bloom out of the subcat position. */}
              {subRenderGroups.map((sg) => {
                const tier1Positions = leafPositions(
                  sg.catIdx,
                  sg.catBranch.children.length,
                );
                const [sx, sy] = tier1Positions[sg.subIdx];
                const tier2Positions = subLeafPositions(
                  sg.catIdx,
                  [sx, sy],
                  sg.subBranch.children.length,
                );
                const color = getCatColor(sg.catId);
                return sg.subBranch.children.map((leaf, i) => {
                  if (!isLeaf(leaf)) return null;
                  const tl = leaf as TreeLeaf;
                  const [lx, ly] = tier2Positions[i];
                  return (
                    <g
                      key={`tier2-${sg.subcatId}-${tl.id}`}
                      className={`${styles.leafBloom} ${styles.tier2} ${sg.isClosing ? styles.closing : ""}`}
                      style={
                        {
                          "--ox": `${sx}px`,
                          "--oy": `${sy}px`,
                          pointerEvents: sg.isClosing ? "none" : undefined,
                        } as React.CSSProperties
                      }
                    >
                      <HexNode
                        kind="skill"
                        cx={lx}
                        cy={ly}
                        r={R_LEAF}
                        color={color}
                        label={tl.label}
                        selected={!sg.isClosing && tl.id === selectedLeafId}
                        isGoal={isGoal(tl.id)}
                        onClick={sg.isClosing ? undefined : () => onLeafClick(tl.id)}
                      />
                    </g>
                  );
                });
              })}
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
                  <button
                    className={`${styles.crumb} ${activeSubcat ? "" : styles.crumbActive}`}
                    onClick={() => {
                      if (activeSubcatId !== null) handoffActiveSubcat();
                    }}
                  >
                    {activeCat.label}
                  </button>
                </>
              )}
              {activeSubcat && (
                <>
                  <span className={styles.crumbSep}>/</span>
                  <span className={`${styles.crumb} ${styles.crumbActive}`}>
                    {activeSubcat.label}
                  </span>
                </>
              )}
            </div>

            {/* Legend */}
            <div className={styles.legend}>
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
