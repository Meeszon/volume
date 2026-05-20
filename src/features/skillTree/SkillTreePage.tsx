import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  SportShoe, Dumbbell, Wrench, Puzzle, Spline,
  Eye, Target, Heart, User, Zap,
  RotateCcw, RotateCw, Hand, RefreshCw, GripHorizontal,
  type LucideIcon,
} from "lucide-react";
import { SKILL_TREE, CATEGORY_COLORS } from "../../data/skillTree";
import { isLeaf } from "../../utils/tree";
import { useGoals } from "../../contexts/useGoals";
import type { TreeBranch, TreeLeaf, TreeNode } from "../../types";
import { GoalsDashboard } from "./GoalsDashboard";
import { SkillDetailPanel } from "./SkillDetailPanel";
import styles from "./SkillTreePage.module.css";

// ── Layout constants ──────────────────────────────────────────────────────────
const W = 1400;
const H = 1100;
const PENT_CX = 700;
const PENT_CY = 550;
const PENT_R = 200;
const CAT_R = 46;
const CAT_GLOW_R = 58;
const CAT_ICON = 26;
const CENTER_R = 24;
const L1_R = 32;
const L1_GLOW_R = 44;
const L1_ICON = 18;
const L1_FORWARD = 165;
const L1_LATERAL = 100;
const FONT = "'Space Grotesk', system-ui, sans-serif";

type View = { x: number; y: number; k: number };

// ── Icon map ──────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  "technique": SportShoe,
  "flexibility-mobility": Spline,
  "mental": Puzzle,
  "grips": Wrench,
  "physical-strength": Dumbbell,
  "footwork": SportShoe,
  "body-positioning": User,
  "dynamic-movement": Zap,
  "hip-mobility": RotateCcw,
  "ankle-calf-flexibility": RotateCw,
  "shoulder-mobility": RotateCcw,
  "route-reading": Eye,
  "commitment": Target,
  "fear-management": Heart,
  "slopers": Hand,
  "crimp-styles": GripHorizontal,
  "pinches": Hand,
  "core-tension": Zap,
  "finger-strength": GripHorizontal,
  "power-endurance": RefreshCw,
  "antagonist-training": Dumbbell,
};

// ── Geometry helpers ──────────────────────────────────────────────────────────
function catPos(i: number): [number, number] {
  const a = (i * 72 - 90) * (Math.PI / 180);
  return [
    Math.round(PENT_CX + PENT_R * Math.cos(a)),
    Math.round(PENT_CY + PENT_R * Math.sin(a)),
  ];
}

function hexPts(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = i * 60 * (Math.PI / 180);
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
}

function calcL1Positions(catIdx: number, count: number): Array<[number, number]> {
  const θ = (catIdx * 72 - 90) * (Math.PI / 180);
  const perpθ = θ + Math.PI / 2;
  const [cx, cy] = catPos(catIdx);
  return Array.from({ length: count }, (_, i) => {
    const lateral = (i - (count - 1) / 2) * L1_LATERAL;
    return [
      cx + L1_FORWARD * Math.cos(θ) + lateral * Math.cos(perpθ),
      cy + L1_FORWARD * Math.sin(θ) + lateral * Math.sin(perpθ),
    ] as [number, number];
  });
}

function l1LabelProps(cx: number, cy: number, lineIdx: number, lineCount: number) {
  const θ = Math.atan2(cy - PENT_CY, cx - PENT_CX) * (180 / Math.PI);
  const gap = L1_GLOW_R + 7;
  if (θ < -45 && θ > -135) {
    return { x: cx, y: cy - gap - (lineCount - 1 - lineIdx) * 12, anchor: "middle" as const };
  } else if (θ > 45 && θ < 135) {
    return { x: cx, y: cy + gap + lineIdx * 12, anchor: "middle" as const };
  } else if (cx >= PENT_CX) {
    return { x: cx + gap, y: cy + (lineIdx - (lineCount - 1) / 2) * 12, anchor: "start" as const };
  } else {
    return { x: cx - gap, y: cy + (lineIdx - (lineCount - 1) / 2) * 12, anchor: "end" as const };
  }
}

function labelLines(label: string): string[] {
  const words = label.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (w === "&") { cur += (cur ? " " : "") + w; }
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ── Center person icon ────────────────────────────────────────────────────────
function PersonCenter() {
  const cx = PENT_CX;
  const cy = PENT_CY;
  return (
    <g style={{ pointerEvents: "none" }}>
      <polygon points={hexPts(cx, cy, CENTER_R)} fill="#1a1a1a" />
      {/* Head */}
      <circle cx={cx} cy={cy - 8} r={5.5} fill="white" />
      {/* Beanie — dark fill so it reads against the white head, white stroke outlines it */}
      <path
        d={`M ${cx - 6.5},${cy - 11} L ${cx - 6.5},${cy - 13.5} L ${cx - 5},${cy - 13.5} L ${cx - 4.5},${cy - 19} Q ${cx},${cy - 22} ${cx + 4.5},${cy - 19} L ${cx + 5},${cy - 13.5} L ${cx + 6.5},${cy - 13.5} L ${cx + 6.5},${cy - 11} Z`}
        fill="#1a1a1a"
        stroke="white"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* Body */}
      <path
        d={`M ${cx - 9},${cy + 14} Q ${cx - 9},${cy + 3} ${cx},${cy + 2} Q ${cx + 9},${cy + 3} ${cx + 9},${cy + 14}`}
        fill="white"
      />
    </g>
  );
}

// ── Goal marker — five-pointed star, perched on the upper-right of the hex ──
const GOAL_STAR_COLOR = "#f5b800";
const GOAL_STAR_STROKE = "#7a5a00";

function goalStarPts(cx: number, cy: number, r: number): string {
  // Five-pointed star: alternating outer (r) and inner (r * 0.42) vertices.
  const inner = r * 0.42;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : inner;
    const a = (i * 36 - 90) * (Math.PI / 180);
    pts.push(`${cx + radius * Math.cos(a)},${cy + radius * Math.sin(a)}`);
  }
  return pts.join(" ");
}

// ── Main component ────────────────────────────────────────────────────────────
export function SkillTreePage() {
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [selectedLeafId, setSelectedLeafId] = useState<string | null>(null);
  const { isGoal } = useGoals();

  const viewRef = useRef<View>({ x: 0, y: 0, k: 1 });
  const svgRef = useRef<SVGSVGElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ sx: number; sy: number; vx: number; vy: number } | null>(null);
  const hasDragged = useRef(false);
  const rafRef = useRef<number | null>(null);
  const momentumRef = useRef<number | null>(null);
  // Rolling position history for stable velocity measurement
  const posHistoryRef = useRef<Array<{ x: number; y: number; t: number }>>([]);
  const initialFitDone = useRef(false);

  const activeCat = useMemo(
    () => SKILL_TREE.find((n) => n.id === activeCatId && !isLeaf(n)) as TreeBranch | undefined,
    [activeCatId],
  );
  const catIdx = SKILL_TREE.findIndex((n) => n.id === activeCatId);
  const [catX, catY] = catIdx >= 0 ? catPos(catIdx) : [PENT_CX, PENT_CY];
  const catColor = activeCatId ? (CATEGORY_COLORS[activeCatId] ?? "#888") : "#888";
  const l1Nodes = activeCat?.children ?? [];

  const l1Positions = useMemo(
    () => (catIdx >= 0 ? calcL1Positions(catIdx, l1Nodes.length) : []),
    [catIdx, l1Nodes.length],
  );

  const selectedLeaf = useMemo((): TreeLeaf | null => {
    if (!selectedLeafId) return null;
    function find(nodes: TreeNode[]): TreeLeaf | null {
      for (const n of nodes) {
        if (n.id === selectedLeafId && isLeaf(n)) return n as TreeLeaf;
        if (!isLeaf(n)) {
          const found = find((n as TreeBranch).children);
          if (found) return found;
        }
      }
      return null;
    }
    return find(SKILL_TREE);
  }, [selectedLeafId]);

  const spring = { type: "spring" as const, stiffness: 280, damping: 22 };

  // ── Apply transform directly to DOM — bypasses React re-render ────────────
  const applyTransform = useCallback((v: View) => {
    if (svgRef.current) {
      svgRef.current.style.transform = `translate(${v.x}px,${v.y}px) scale(${v.k})`;
    }
  }, []);

  // ── Animated view transition (easeOutCubic via rAF) ───────────────────────
  const animateTo = useCallback((target: View, duration = 600) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (momentumRef.current !== null) { cancelAnimationFrame(momentumRef.current); momentumRef.current = null; }
    const start = { ...viewRef.current };
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      const next: View = {
        x: start.x + (target.x - start.x) * ease,
        y: start.y + (target.y - start.y) * ease,
        k: start.k + (target.k - start.k) * ease,
      };
      viewRef.current = next;
      applyTransform(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else rafRef.current = null;
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [applyTransform]);

  // ── Fit entire tree (5 categories) into viewport ──────────────────────────
  const fitToAll = useCallback((anim = true) => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    if (width < 50) return;
    const fitRadius = PENT_R * 2.6;
    const k = Math.min(width, height) / (fitRadius * 2);
    const target: View = { k, x: width / 2 - PENT_CX * k, y: height / 2 - PENT_CY * k };
    if (anim) {
      animateTo(target, 500);
    } else {
      viewRef.current = target;
      applyTransform(target);
    }
  }, [animateTo, applyTransform]);

  // ── Fit expanded category + its leaf nodes into viewport ──────────────────
  const focusOnCat = useCallback((catId: string) => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    if (width < 50) return;
    const idx = SKILL_TREE.findIndex((n) => n.id === catId);
    if (idx < 0) return;
    const cat = SKILL_TREE[idx];
    if (isLeaf(cat)) return;
    const children = (cat as TreeBranch).children;
    const positions = calcL1Positions(idx, children.length);
    const [cx, cy] = catPos(idx);
    const pts = [
      { x: PENT_CX, y: PENT_CY, pad: CENTER_R + 10 },
      { x: cx, y: cy, pad: CAT_GLOW_R + 50 },
      ...positions.map(([lx, ly]: [number, number]) => ({ x: lx, y: ly, pad: L1_GLOW_R + 35 })),
    ];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    pts.forEach(({ x, y, pad }) => {
      minX = Math.min(minX, x - pad); maxX = Math.max(maxX, x + pad);
      minY = Math.min(minY, y - pad); maxY = Math.max(maxY, y + pad);
    });
    const margin = 72;
    const rawK = Math.min(
      (width - margin * 2) / (maxX - minX),
      (height - margin * 2) / (maxY - minY),
    );
    const k = Math.max(0.3, Math.min(1.6, rawK * 0.85));
    animateTo({
      k,
      x: width / 2 - ((minX + maxX) / 2) * k,
      y: height / 2 - ((minY + maxY) / 2) * k,
    }, 600);
  }, [animateTo]);

  // ── Initial fit — poll until container has real dimensions ─────────────────
  useEffect(() => {
    let cancelled = false;
    const tryFit = () => {
      if (cancelled) return;
      const el = containerRef.current;
      const rect = el?.getBoundingClientRect();
      if (!rect || rect.width < 50 || rect.height < 50) {
        requestAnimationFrame(tryFit);
        return;
      }
      fitToAll(false);
      initialFitDone.current = true;
    };
    requestAnimationFrame(tryFit);
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-frame when category expands/collapses ──────────────────────────────
  useEffect(() => {
    if (!initialFitDone.current) return;
    const id = requestAnimationFrame(() => {
      if (activeCatId) focusOnCat(activeCatId);
      else fitToAll(true);
    });
    return () => cancelAnimationFrame(id);
  }, [activeCatId, focusOnCat, fitToAll]);

  // ── Wheel zoom — lerp-animated so rapid scrolling stays smooth ────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let wheelRafId: number | null = null;
    const wheelTarget = { x: 0, y: 0, k: 1, active: false };

    const wheelTick = () => {
      if (!wheelTarget.active) return;
      const curr = viewRef.current;
      const dx = wheelTarget.x - curr.x;
      const dy = wheelTarget.y - curr.y;
      const dk = wheelTarget.k - curr.k;
      if (Math.abs(dx) < 0.15 && Math.abs(dy) < 0.15 && Math.abs(dk) < 0.0004) {
        viewRef.current = { x: wheelTarget.x, y: wheelTarget.y, k: wheelTarget.k };
        applyTransform(viewRef.current);
        wheelTarget.active = false;
        wheelRafId = null;
        return;
      }
      const lf = 0.22;
      const next: View = { x: curr.x + dx * lf, y: curr.y + dy * lf, k: curr.k + dk * lf };
      viewRef.current = next;
      applyTransform(next);
      wheelRafId = requestAnimationFrame(wheelTick);
    };

    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (momentumRef.current !== null) { cancelAnimationFrame(momentumRef.current); momentumRef.current = null; }
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const delta = -e.deltaY * 0.0015;
      // Accumulate from pending target so rapid events compound correctly
      const base = wheelTarget.active ? wheelTarget : viewRef.current;
      const newK = Math.min(4, Math.max(0.15, base.k * (1 + delta)));
      const ratio = newK / base.k;
      wheelTarget.x = mx - (mx - base.x) * ratio;
      wheelTarget.y = my - (my - base.y) * ratio;
      wheelTarget.k = newK;
      wheelTarget.active = true;
      if (wheelRafId === null) wheelRafId = requestAnimationFrame(wheelTick);
    };

    el.addEventListener("wheel", handler, { passive: false });
    return () => {
      el.removeEventListener("wheel", handler);
      if (wheelRafId !== null) cancelAnimationFrame(wheelRafId);
    };
  }, [applyTransform]);

  // ── Drag to pan ───────────────────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    hasDragged.current = false;
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (momentumRef.current !== null) { cancelAnimationFrame(momentumRef.current); momentumRef.current = null; }
    posHistoryRef.current = [];
    dragRef.current = { sx: e.clientX, sy: e.clientY, vx: viewRef.current.x, vy: viewRef.current.y };
  }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const now = performance.now();
    const dx = e.clientX - dragRef.current.sx;
    const dy = e.clientY - dragRef.current.sy;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasDragged.current = true;

    // Rolling 80ms window — stable velocity, immune to single-frame spikes
    const history = posHistoryRef.current;
    history.push({ x: e.clientX, y: e.clientY, t: now });
    const cutoff = now - 80;
    while (history.length > 1 && history[0].t < cutoff) history.shift();

    const next: View = { ...viewRef.current, x: dragRef.current.vx + dx, y: dragRef.current.vy + dy };
    viewRef.current = next;
    applyTransform(next);
  }

  function onMouseUp() {
    if (!dragRef.current) return;
    dragRef.current = null;

    const history = posHistoryRef.current;
    posHistoryRef.current = [];
    if (history.length < 2) return;

    const oldest = history[0];
    const newest = history[history.length - 1];
    const dt = newest.t - oldest.t;
    if (dt < 16) return;

    const rawVx = (newest.x - oldest.x) / dt;
    const rawVy = (newest.y - oldest.y) / dt;
    const speed = Math.sqrt(rawVx * rawVx + rawVy * rawVy);
    if (speed < 0.05) return;

    // Cap at 2.5 px/ms to prevent runaway momentum
    const scale = Math.min(1, 2.5 / speed);
    let velX = rawVx * scale;
    let velY = rawVy * scale;
    let lastT = performance.now();

    const tick = (now: number) => {
      const dt2 = Math.min(now - lastT, 32);
      lastT = now;
      const friction = Math.pow(0.92, dt2 / 16);
      velX *= friction;
      velY *= friction;
      if (Math.sqrt(velX * velX + velY * velY) < 0.008) {
        momentumRef.current = null;
        return;
      }
      const next: View = { ...viewRef.current, x: viewRef.current.x + velX * dt2, y: viewRef.current.y + velY * dt2 };
      viewRef.current = next;
      applyTransform(next);
      momentumRef.current = requestAnimationFrame(tick);
    };
    momentumRef.current = requestAnimationFrame(tick);
  }

  // ── Zoom buttons ──────────────────────────────────────────────────────────
  function zoomBy(factor: number) {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const mx = width / 2;
    const my = height / 2;
    const { x, y, k } = viewRef.current;
    const newK = Math.min(4, Math.max(0.15, k * factor));
    const ratio = newK / k;
    animateTo({ x: mx - (mx - x) * ratio, y: my - (my - y) * ratio, k: newK }, 300);
  }

  // ── Click handlers ────────────────────────────────────────────────────────
  function onCatClick(id: string) {
    if (hasDragged.current) return;
    setActiveCatId((prev) => (prev === id ? null : id));
    setSelectedLeafId(null);
  }

  function onLeafClick(node: TreeNode) {
    if (hasDragged.current) return;
    if (isLeaf(node)) setSelectedLeafId((p) => (p === node.id ? null : node.id));
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.headerTitle}>Skill Tree</span>
      </header>

      <GoalsDashboard />

      <div
        ref={containerRef}
        className={styles.treeCanvas}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div className={styles.zoomControls}>
          <button className={styles.zoomBtn} onClick={() => zoomBy(1.2)}>+</button>
          <button className={styles.zoomBtn} onClick={() => zoomBy(1 / 1.2)}>−</button>
          <button className={styles.zoomBtn} style={{ fontSize: 14 }} onClick={() => fitToAll(true)}>⤢</button>
        </div>

        <svg
          ref={svgRef}
          width={W}
          height={H}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            userSelect: "none",
            transformOrigin: "0 0",
            willChange: "transform",
          }}
        >
          <defs>
            <filter id="hex-shadow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="4" stdDeviation="7" floodColor="#000000" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* ── Concentric guide rings ── */}
          <g opacity={0.4}>
            <circle
              cx={PENT_CX} cy={PENT_CY}
              r={PENT_R + CAT_R / 2}
              fill="none" stroke="#E6E6EA" strokeWidth={1} strokeDasharray="2 6"
            />
            {activeCatId && (
              <circle
                cx={PENT_CX} cy={PENT_CY}
                r={PENT_R + L1_FORWARD + L1_R / 2}
                fill="none" stroke="#E6E6EA" strokeWidth={1} strokeDasharray="2 6"
              />
            )}
          </g>

          {/* ── Center → category connecting lines ── */}
          {SKILL_TREE.map((cat, i) => {
            const [cx, cy] = catPos(i);
            const isActive = cat.id === activeCatId;
            const isInactive = activeCatId !== null && !isActive;
            const color = CATEGORY_COLORS[cat.id] ?? "#888";
            return (
              <line
                key={`c2c-${cat.id}`}
                x1={PENT_CX} y1={PENT_CY} x2={cx} y2={cy}
                stroke={color}
                strokeWidth={isActive ? 2 : 1.5}
                opacity={isInactive ? 0.12 : isActive ? 0.6 : 0.35}
                style={{ transition: "opacity 0.2s" }}
              />
            );
          })}

          {/* ── Category → L1 straight connector lines ── */}
          <AnimatePresence>
            {l1Nodes.length > 0 && l1Positions.map((pos, i) => {
              const [l1x, l1y] = pos;
              const angle = Math.atan2(l1y - catY, l1x - catX);
              const x1 = catX + CAT_R * Math.cos(angle);
              const y1 = catY + CAT_R * Math.sin(angle);
              const x2 = l1x - L1_R * Math.cos(angle);
              const y2 = l1y - L1_R * Math.sin(angle);
              return (
                <motion.path
                  key={`conn-${activeCatId}-${i}`}
                  d={`M ${x1},${y1} L ${x2},${y2}`}
                  stroke={catColor} fill="none" strokeWidth={1.5} opacity={0.45}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  exit={{ pathLength: 0 }}
                  transition={{ duration: 0.28, delay: i * 0.05 }}
                />
              );
            })}
          </AnimatePresence>

          {/* ── L1 leaf nodes ── */}
          <AnimatePresence>
            {l1Nodes.map((node, i) => {
              const [cx, cy] = l1Positions[i] ?? [PENT_CX, PENT_CY];
              const isSel = node.id === selectedLeafId;
              const goalActive = isLeaf(node) && isGoal(node.id);
              const Icon = ICON_MAP[node.id] ?? Zap;
              const half = L1_ICON / 2;
              const lines = labelLines(node.label);
              const starCx = cx + L1_R * Math.cos(-Math.PI / 6);
              const starCy = cy + L1_R * Math.sin(-Math.PI / 6);
              return (
                <motion.g
                  key={`l1-${activeCatId}-${node.id}`}
                  onClick={() => onLeafClick(node)}
                  style={{ cursor: "pointer", transformOrigin: `${cx}px ${cy}px` }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: isSel ? 1 : 0.75 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ ...spring, delay: i * 0.06 + 0.1 }}
                  data-testid={`leaf-${node.id}`}
                  data-goal={goalActive ? "true" : undefined}
                >
                  <polygon points={hexPts(cx, cy, L1_GLOW_R)} fill={catColor} opacity={0.1} />
                  <polygon
                    points={hexPts(cx, cy, L1_R)}
                    fill={catColor}
                    filter="url(#hex-shadow)"
                    stroke={goalActive ? GOAL_STAR_COLOR : "none"}
                    strokeWidth={goalActive ? 2.5 : 0}
                  />
                  <Icon
                    x={cx - half} y={cy - half}
                    width={L1_ICON} height={L1_ICON}
                    color="white" strokeWidth={2.5}
                    style={{ pointerEvents: "none" }}
                  />
                  {goalActive && (
                    <polygon
                      points={goalStarPts(starCx, starCy, 8)}
                      fill={GOAL_STAR_COLOR}
                      stroke={GOAL_STAR_STROKE}
                      strokeWidth={1}
                      strokeLinejoin="round"
                      style={{ pointerEvents: "none" }}
                      data-testid={`goal-marker-${node.id}`}
                    />
                  )}
                  {lines.map((line, li) => {
                    const lp = l1LabelProps(cx, cy, li, lines.length);
                    return (
                      <text
                        key={li}
                        x={lp.x} y={lp.y}
                        textAnchor={lp.anchor}
                        dominantBaseline="central"
                        fill="#6b6b68" fontSize={9.5}
                        fontFamily={FONT}
                        style={{ pointerEvents: "none" }}
                      >
                        {line}
                      </text>
                    );
                  })}
                </motion.g>
              );
            })}
          </AnimatePresence>

          {/* ── Center person icon ── */}
          <PersonCenter />

          {/* ── Category hexagons ── */}
          {SKILL_TREE.map((cat, i) => {
            const [cx, cy] = catPos(i);
            const isActive = cat.id === activeCatId;
            const isInactive = activeCatId !== null && !isActive;
            const color = CATEGORY_COLORS[cat.id] ?? "#888";
            const Icon = ICON_MAP[cat.id] ?? Zap;
            const half = CAT_ICON / 2;
            return (
              <g
                key={cat.id}
                onClick={() => onCatClick(cat.id)}
                style={{ cursor: "pointer", opacity: isInactive ? 0.3 : 1, transition: "opacity 0.2s" }}
              >
                <polygon points={hexPts(cx, cy, CAT_GLOW_R)} fill={color} opacity={isActive ? 0.18 : 0.1} />
                <polygon points={hexPts(cx, cy, CAT_R)} fill={color} filter="url(#hex-shadow)" />
                <Icon
                  x={cx - half} y={cy - half}
                  width={CAT_ICON} height={CAT_ICON}
                  color="white" strokeWidth={2}
                  style={{ pointerEvents: "none" }}
                />
                <text
                  x={cx} y={cy + CAT_GLOW_R + 14}
                  textAnchor="middle" dominantBaseline="hanging"
                  fill="#413f39" fontSize={12} fontWeight={700}
                  fontFamily={FONT}
                  style={{ pointerEvents: "none" }}
                >
                  {cat.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <AnimatePresence>
        {selectedLeaf && (
          <SkillDetailPanel
            leaf={selectedLeaf}
            categoryColor={catColor}
            onClose={() => setSelectedLeafId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
