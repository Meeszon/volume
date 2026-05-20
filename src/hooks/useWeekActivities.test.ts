import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { DbActivity } from "../types";

const {
  mockFetchActivities,
  mockInsertActivity,
  mockDeleteActivity,
  mockUpdateActivityOrders,
  mockMoveActivity,
} = vi.hoisted(() => ({
  mockFetchActivities: vi.fn(),
  mockInsertActivity: vi.fn(),
  mockDeleteActivity: vi.fn(),
  mockUpdateActivityOrders: vi.fn(),
  mockMoveActivity: vi.fn(),
}));

vi.mock("../data/activitiesApi", () => ({
  fetchActivities: mockFetchActivities,
  insertActivity: mockInsertActivity,
  deleteActivity: mockDeleteActivity,
  updateActivityOrders: mockUpdateActivityOrders,
  moveActivity: mockMoveActivity,
}));

vi.mock("../contexts/useAuth", () => ({
  useAuth: () => ({
    session: { user: { id: "test-user" } },
    loading: false,
    signOut: vi.fn(),
  }),
}));

import { useWeekActivities } from "./useWeekActivities";

const monday = new Date("2026-04-27T00:00:00");

function makeDbActivity(overrides: Partial<DbActivity> = {}): DbActivity {
  return {
    id: "a1",
    user_id: "test-user",
    scheduled_date: "2026-04-27",
    kind: "climb",
    intent_leaf_id: "footwork",
    block: null,
    duration_minutes: null,
    order: 0,
    created_at: "2026-04-27T00:00:00Z",
    ...overrides,
  };
}

describe("useWeekActivities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchActivities.mockResolvedValue([]);
    mockInsertActivity.mockResolvedValue(makeDbActivity());
    mockDeleteActivity.mockResolvedValue(undefined);
    mockUpdateActivityOrders.mockResolvedValue(undefined);
    mockMoveActivity.mockResolvedValue(undefined);
  });

  it("starts in loading state", () => {
    const { result } = renderHook(() => useWeekActivities(monday));
    expect(result.current.loading).toBe(true);
  });

  it("fetches activities for the correct date range", async () => {
    mockFetchActivities.mockResolvedValue([]);

    const { result } = renderHook(() => useWeekActivities(monday));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetchActivities).toHaveBeenCalledWith("2026-04-27", "2026-05-03");
  });

  it("groups fetched activities by day name", async () => {
    const activities: DbActivity[] = [
      makeDbActivity({ id: "a1", scheduled_date: "2026-04-27", intent_leaf_id: "footwork", order: 0 }),
      makeDbActivity({ id: "a2", scheduled_date: "2026-04-27", intent_leaf_id: "route-reading", order: 1 }),
      makeDbActivity({ id: "a3", scheduled_date: "2026-04-29", intent_leaf_id: "commitment", order: 0 }),
    ];
    mockFetchActivities.mockResolvedValue(activities);

    const { result } = renderHook(() => useWeekActivities(monday));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.columns.Monday).toHaveLength(2);
    expect(result.current.columns.Monday[0].intentLeafId).toBe("footwork");
    expect(result.current.columns.Monday[1].intentLeafId).toBe("route-reading");
    expect(result.current.columns.Wednesday).toHaveLength(1);
    expect(result.current.columns.Wednesday[0].intentLeafId).toBe("commitment");
    expect(result.current.columns.Tuesday).toHaveLength(0);
  });

  it("returns empty columns for all 7 days when no activities", async () => {
    mockFetchActivities.mockResolvedValue([]);

    const { result } = renderHook(() => useWeekActivities(monday));

    await waitFor(() => expect(result.current.loading).toBe(false));

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    for (const day of days) {
      expect(result.current.columns[day]).toEqual([]);
    }
  });

  it("sets error state on fetch failure", async () => {
    mockFetchActivities.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useWeekActivities(monday));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("network error");
  });

  it("sorts activities by order field, not fetch order", async () => {
    const activities = [
      makeDbActivity({ id: "a2", scheduled_date: "2026-04-27", intent_leaf_id: "route-reading", order: 1 }),
      makeDbActivity({ id: "a1", scheduled_date: "2026-04-27", intent_leaf_id: "footwork", order: 0 }),
    ];
    mockFetchActivities.mockResolvedValue(activities);

    const { result } = renderHook(() => useWeekActivities(monday));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.columns.Monday[0].intentLeafId).toBe("footwork");
    expect(result.current.columns.Monday[1].intentLeafId).toBe("route-reading");
  });

  describe("addActivity", () => {
    it("optimistically adds activity to the correct day", async () => {
      mockFetchActivities.mockResolvedValue([]);
      mockInsertActivity.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useWeekActivities(monday));
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.addActivity("Tuesday", {
          kind: "climb",
          intentLeafId: "footwork",
          block: null,
          durationMinutes: 90,
        });
      });

      expect(result.current.columns.Tuesday).toHaveLength(1);
      expect(result.current.columns.Tuesday[0].intentLeafId).toBe("footwork");
    });

    it("persists to Supabase with the new fields", async () => {
      mockFetchActivities.mockResolvedValue([]);
      const persisted = makeDbActivity({
        id: "server-id",
        scheduled_date: "2026-04-28",
        intent_leaf_id: "footwork",
      });
      mockInsertActivity.mockResolvedValue(persisted);

      const { result } = renderHook(() => useWeekActivities(monday));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.addActivity("Tuesday", {
          kind: "climb",
          intentLeafId: "footwork",
          block: null,
          durationMinutes: 90,
        });
      });

      expect(mockInsertActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "test-user",
          scheduled_date: "2026-04-28",
          kind: "climb",
          intent_leaf_id: "footwork",
          block: null,
          duration_minutes: 90,
          order: 0,
        }),
      );
    });

    it("rolls back optimistic add on Supabase error", async () => {
      mockFetchActivities.mockResolvedValue([]);
      mockInsertActivity.mockRejectedValue(new Error("insert failed"));

      const { result } = renderHook(() => useWeekActivities(monday));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.addActivity("Tuesday", {
          kind: "climb",
          intentLeafId: "footwork",
          block: null,
          durationMinutes: 90,
        });
      });

      expect(result.current.columns.Tuesday).toHaveLength(0);
      expect(result.current.error).toBe("insert failed");
    });
  });

  describe("deleteActivity", () => {
    it("optimistically removes activity from the day", async () => {
      const activities = [makeDbActivity({ id: "a1", scheduled_date: "2026-04-27" })];
      mockFetchActivities.mockResolvedValue(activities);
      mockDeleteActivity.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useWeekActivities(monday));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.columns.Monday).toHaveLength(1);

      act(() => {
        result.current.deleteActivity("a1");
      });

      expect(result.current.columns.Monday).toHaveLength(0);
    });

    it("rolls back optimistic delete on Supabase error", async () => {
      const activities = [makeDbActivity({ id: "a1", scheduled_date: "2026-04-27" })];
      mockFetchActivities.mockResolvedValue(activities);
      mockDeleteActivity.mockRejectedValue(new Error("delete failed"));

      const { result } = renderHook(() => useWeekActivities(monday));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteActivity("a1");
      });

      expect(result.current.columns.Monday).toHaveLength(1);
      expect(result.current.error).toBe("delete failed");
    });
  });

  describe("handleDragEnd", () => {
    it("reorders within the same day", async () => {
      const activities = [
        makeDbActivity({ id: "a1", scheduled_date: "2026-04-27", intent_leaf_id: "footwork", order: 0 }),
        makeDbActivity({ id: "a2", scheduled_date: "2026-04-27", intent_leaf_id: "route-reading", order: 1 }),
      ];
      mockFetchActivities.mockResolvedValue(activities);

      const { result } = renderHook(() => useWeekActivities(monday));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.handleDragEnd({
          source: { droppableId: "Monday", index: 0 },
          destination: { droppableId: "Monday", index: 1 },
        } as never);
      });

      expect(result.current.columns.Monday[0].intentLeafId).toBe("route-reading");
      expect(result.current.columns.Monday[1].intentLeafId).toBe("footwork");
      expect(mockUpdateActivityOrders).toHaveBeenCalled();
    });

    it("moves activity between days", async () => {
      const activities = [
        makeDbActivity({ id: "a1", scheduled_date: "2026-04-27", intent_leaf_id: "footwork", order: 0 }),
      ];
      mockFetchActivities.mockResolvedValue(activities);

      const { result } = renderHook(() => useWeekActivities(monday));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.handleDragEnd({
          source: { droppableId: "Monday", index: 0 },
          destination: { droppableId: "Wednesday", index: 0 },
        } as never);
      });

      expect(result.current.columns.Monday).toHaveLength(0);
      expect(result.current.columns.Wednesday).toHaveLength(1);
      expect(result.current.columns.Wednesday[0].intentLeafId).toBe("footwork");
      expect(mockMoveActivity).toHaveBeenCalledWith("a1", "2026-04-29", 0);
    });

    it("no-ops when destination is null", async () => {
      mockFetchActivities.mockResolvedValue([]);
      const { result } = renderHook(() => useWeekActivities(monday));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.handleDragEnd({
          source: { droppableId: "Monday", index: 0 },
          destination: null,
        } as never);
      });

      expect(mockUpdateActivityOrders).not.toHaveBeenCalled();
      expect(mockMoveActivity).not.toHaveBeenCalled();
    });
  });
});
