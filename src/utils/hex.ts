// Returns SVG polygon points for a regular flat-rotated hexagon centered at
// (cx, cy) with circumradius r. Same geometry used by SkillTreePage's
// pentagon canvas and by the IntentPickerModal hex glyphs.
export function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = i * 60 * (Math.PI / 180);
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
}
