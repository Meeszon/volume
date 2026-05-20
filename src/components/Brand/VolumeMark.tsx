interface VolumeMarkProps {
  size?: number;
}

const V = {
  t:  [16,    2] as const,
  ur: [28.12, 9] as const,
  lr: [28.12, 23] as const,
  b:  [16,    30] as const,
  ll: [3.88,  23] as const,
  ul: [3.88,  9] as const,
  c:  [16,    16] as const,
};

function points(...pts: ReadonlyArray<readonly [number, number]>): string {
  return pts.map((pt) => pt.join(",")).join(" ");
}

export function VolumeMark({ size = 22 }: VolumeMarkProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <polygon points={points(V.c, V.ul, V.t)}  fill="#4A453D" />
      <polygon points={points(V.c, V.t,  V.ur)} fill="#3A352D" />
      <polygon points={points(V.c, V.ur, V.lr)} fill="#1A1814" />
      <polygon points={points(V.c, V.lr, V.b)}  fill="#0F0D0A" />
      <polygon points={points(V.c, V.b,  V.ll)} fill="#1A1814" />
      <polygon points={points(V.c, V.ll, V.ul)} fill="#2A2620" />
    </svg>
  );
}
