import { createContext, useContext, useState, useCallback } from "react";
import type { Goal } from "../types";

const STORAGE_KEY = "volume:goals";
const MAX_GOALS = 5;

interface GoalsContextValue {
  goals: Goal[];
  addGoal: (leafId: string) => void;
  removeGoal: (leafId: string) => void;
  isGoal: (leafId: string) => boolean;
}

const GoalsContext = createContext<GoalsContextValue | null>(null);

function loadGoals(): Goal[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (g): g is Goal => g && typeof g === "object" && typeof g.leafId === "string",
    );
  } catch {
    return [];
  }
}

function persist(goals: Goal[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  } catch {
    // ignore storage errors
  }
}

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>(loadGoals);

  const addGoal = useCallback((leafId: string) => {
    setGoals((prev) => {
      if (prev.length >= MAX_GOALS) return prev;
      if (prev.some((g) => g.leafId === leafId)) return prev;
      const next = [...prev, { leafId }];
      persist(next);
      return next;
    });
  }, []);

  const removeGoal = useCallback((leafId: string) => {
    setGoals((prev) => {
      const next = prev.filter((g) => g.leafId !== leafId);
      persist(next);
      return next;
    });
  }, []);

  const isGoal = useCallback(
    (leafId: string) => goals.some((g) => g.leafId === leafId),
    [goals],
  );

  return (
    <GoalsContext.Provider value={{ goals, addGoal, removeGoal, isGoal }}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals(): GoalsContextValue {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error("useGoals must be used within GoalsProvider");
  return ctx;
}
