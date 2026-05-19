import type { Kind } from "../types";

export interface KindConfig {
  color: string;
  label: string;
}

export const KIND_CONFIG: Record<Kind, KindConfig> = {
  climb:  { color: "#F5A623", label: "Climb" },
  warmup: { color: "#7C4DFF", label: "Warmup" },
  train:  { color: "#4DACF7", label: "Train" },
};

export const KINDS: Kind[] = ["climb", "warmup", "train"];
