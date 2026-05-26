import {
  SportShoe, Dumbbell, Wrench, Puzzle, Spline,
  Eye, Target, Heart, User, Zap,
  RotateCcw, RotateCw, Hand, RefreshCw, GripHorizontal,
  type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  // Top-level categories
  "technique": SportShoe,
  "mobility": Spline,
  "mental": Puzzle,
  "strength": Dumbbell,
  "longevity": Wrench,
  // Subcategories
  "footwork": SportShoe,
  "body-positioning": User,
  "lower-body": RotateCcw,
  "tactics": Eye,
  "psychological": Heart,
  "fingers": GripHorizontal,
  "upper-body": Dumbbell,
  "injury-prevention": Heart,
  // Leaves
  "foot-placement": SportShoe,
  "hooking": Hand,
  "balance-weight-shifting": User,
  "dynamic-movement": Zap,
  "hold-application": Hand,
  "hip-mobility": RotateCcw,
  "ankle-calf-mobility": RotateCw,
  "shoulder-mobility": RotateCcw,
  "route-reading": Eye,
  "pacing-efficiency": RefreshCw,
  "fear-fall-management": Heart,
  "focus-try-hard": Target,
  "max-finger-strength": GripHorizontal,
  "power-endurance": RefreshCw,
  "pulling-power": Dumbbell,
  "compression-strength": Hand,
  "core-tension": Zap,
  "antagonist-training": Dumbbell,
  "load-volume-management": Target,
  "active-recovery-prep": RefreshCw,
  // Synthetic intent
  "just-climbing": Zap,
};

export function getIconFor(id: string): LucideIcon {
  return ICON_MAP[id] ?? Zap;
}
