import type { LucideIcon } from "lucide-react";
import { hexPoints } from "../../utils/hex";
import styles from "./HexGlyph.module.css";

interface HexGlyphProps {
  size: number;
  color: string;
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  ariaLabel?: string;
  layout?: "stacked" | "inline";
}

export function HexGlyph({
  size,
  color,
  icon: Icon,
  label,
  sublabel,
  onClick,
  ariaLabel,
  layout = "stacked",
}: HexGlyphProps) {
  const glowR = Math.round(size * 1.25);
  const svgSize = glowR * 2 + 4;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const iconSize = Math.round(size * 0.56);
  const iconHalf = iconSize / 2;

  return (
    <button
      type="button"
      className={`${styles.hexBtn} ${layout === "inline" ? styles.inline : styles.stacked}`}
      onClick={onClick}
      aria-label={ariaLabel ?? label}
    >
      <svg
        width={svgSize}
        height={svgSize}
        className={styles.hexSvg}
        aria-hidden="true"
        focusable="false"
      >
        <polygon
          points={hexPoints(cx, cy, glowR)}
          fill={color}
          opacity={0.12}
        />
        <polygon
          points={hexPoints(cx, cy, size)}
          fill={color}
          className={styles.hexFill}
        />
        <Icon
          x={cx - iconHalf}
          y={cy - iconHalf}
          width={iconSize}
          height={iconSize}
          color="white"
          strokeWidth={2.2}
        />
      </svg>
      <div className={styles.labelWrap}>
        <span className={styles.label}>{label}</span>
        {sublabel && <span className={styles.sublabel}>{sublabel}</span>}
      </div>
    </button>
  );
}
