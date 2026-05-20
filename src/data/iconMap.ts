import {
  SportShoe, Dumbbell, Wrench, Puzzle, Spline,
  Eye, Target, Heart, User, Zap,
  RotateCcw, RotateCw, Hand, RefreshCw, GripHorizontal,
  type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
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
  // Synthetic intent
  "just-climbing": Zap,
};

export function getIconFor(id: string): LucideIcon {
  return ICON_MAP[id] ?? Zap;
}
