import { useState, useCallback } from "react";

const STORAGE_KEY = "volume:recentIntents";
const MAX_RECENTS = 5;

function loadRecents(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_RECENTS);
  } catch {
    return [];
  }
}

function persist(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage errors
  }
}

export function useRecentIntents() {
  const [recents, setRecents] = useState<string[]>(loadRecents);

  const recordPick = useCallback((leafId: string) => {
    setRecents((prev) => {
      const deduped = prev.filter((id) => id !== leafId);
      const next = [leafId, ...deduped].slice(0, MAX_RECENTS);
      persist(next);
      return next;
    });
  }, []);

  return { recents, recordPick };
}
