import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecentIntents } from "./useRecentIntents";

beforeEach(() => {
  localStorage.clear();
});

describe("useRecentIntents", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useRecentIntents());
    expect(result.current.recents).toEqual([]);
  });

  it("recordPick puts the new pick at the top", () => {
    const { result } = renderHook(() => useRecentIntents());
    act(() => result.current.recordPick("footwork"));
    act(() => result.current.recordPick("finger-strength"));
    expect(result.current.recents).toEqual(["finger-strength", "footwork"]);
  });

  it("dedupes when the same id is recorded again — moves it back to the top", () => {
    const { result } = renderHook(() => useRecentIntents());
    act(() => result.current.recordPick("footwork"));
    act(() => result.current.recordPick("finger-strength"));
    act(() => result.current.recordPick("footwork"));
    expect(result.current.recents).toEqual(["footwork", "finger-strength"]);
  });

  it("caps the list at 5 entries", () => {
    const { result } = renderHook(() => useRecentIntents());
    act(() => {
      ["a", "b", "c", "d", "e", "f"].forEach((id) =>
        result.current.recordPick(id),
      );
    });
    expect(result.current.recents).toEqual(["f", "e", "d", "c", "b"]);
    expect(result.current.recents.length).toBe(5);
  });

  it("persists to localStorage at volume:recentIntents", () => {
    const { result } = renderHook(() => useRecentIntents());
    act(() => result.current.recordPick("footwork"));
    const raw = localStorage.getItem("volume:recentIntents");
    expect(raw).toBe(JSON.stringify(["footwork"]));
  });

  it("reads from localStorage on mount", () => {
    localStorage.setItem(
      "volume:recentIntents",
      JSON.stringify(["finger-strength", "footwork"]),
    );
    const { result } = renderHook(() => useRecentIntents());
    expect(result.current.recents).toEqual(["finger-strength", "footwork"]);
  });

  it("survives corrupt JSON in storage", () => {
    localStorage.setItem("volume:recentIntents", "{not json");
    const { result } = renderHook(() => useRecentIntents());
    expect(result.current.recents).toEqual([]);
  });
});
