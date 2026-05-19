import { createContext, useContext } from "react";
import type { Goal } from "../types";

export interface GoalsContextValue {
  goals: Goal[];
  addGoal: (leafId: string) => void;
  removeGoal: (leafId: string) => void;
  isGoal: (leafId: string) => boolean;
}

export const GoalsContext = createContext<GoalsContextValue | null>(null);

export function useGoals(): GoalsContextValue {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error("useGoals must be used within GoalsProvider");
  return ctx;
}
