import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockChain, mockFrom } = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of [
    "select",
    "insert",
    "delete",
    "update",
    "eq",
    "gte",
    "lte",
    "order",
    "single",
  ]) {
    chain[m] = vi.fn(() => chain);
  }
  return { mockChain: chain, mockFrom: vi.fn(() => chain) };
});

vi.mock("../lib/supabase", () => ({
  supabase: { from: mockFrom },
}));

import {
  fetchActivities,
  insertActivity,
  deleteActivity,
  updateActivityOrders,
  moveActivity,
} from "./activitiesApi";

describe("activitiesApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const fn of Object.values(mockChain)) {
      (fn as ReturnType<typeof vi.fn>).mockImplementation(() => mockChain);
    }
  });

  describe("fetchActivities", () => {
    it("queries activities within the date range ordered by order", async () => {
      const rows = [
        {
          id: "a1",
          user_id: "u1",
          scheduled_date: "2026-04-27",
          kind: "climb",
          intent_leaf_id: "footwork",
          block: null,
          order: 0,
          created_at: "2026-04-27T00:00:00Z",
        },
      ];
      mockChain.order.mockResolvedValueOnce({ data: rows, error: null });

      const result = await fetchActivities("2026-04-27", "2026-05-03");

      expect(mockFrom).toHaveBeenCalledWith("activities");
      expect(mockChain.select).toHaveBeenCalledWith("*");
      expect(mockChain.gte).toHaveBeenCalledWith(
        "scheduled_date",
        "2026-04-27",
      );
      expect(mockChain.lte).toHaveBeenCalledWith(
        "scheduled_date",
        "2026-05-03",
      );
      expect(mockChain.order).toHaveBeenCalledWith("order");
      expect(result).toEqual(rows);
    });

    it("throws on Supabase error", async () => {
      mockChain.order.mockResolvedValueOnce({
        data: null,
        error: { message: "RLS denied" },
      });

      await expect(fetchActivities("2026-04-27", "2026-05-03")).rejects.toEqual(
        { message: "RLS denied" },
      );
    });
  });

  describe("insertActivity", () => {
    it("inserts and returns the new activity", async () => {
      const input = {
        user_id: "u1",
        scheduled_date: "2026-04-28",
        kind: "train" as const,
        intent_leaf_id: "hip-mobility",
        block: null,
        order: 0,
      };
      const returned = { ...input, id: "new-id", created_at: "2026-04-28T00:00:00Z" };
      mockChain.single.mockResolvedValueOnce({
        data: returned,
        error: null,
      });

      const result = await insertActivity(input);

      expect(mockFrom).toHaveBeenCalledWith("activities");
      expect(mockChain.insert).toHaveBeenCalledWith(input);
      expect(mockChain.select).toHaveBeenCalled();
      expect(mockChain.single).toHaveBeenCalled();
      expect(result).toEqual(returned);
    });

    it("throws on Supabase error", async () => {
      mockChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: "insert failed" },
      });

      await expect(
        insertActivity({
          user_id: "u1",
          scheduled_date: "2026-04-28",
          kind: "train",
          intent_leaf_id: "hip-mobility",
          block: null,
          order: 0,
        }),
      ).rejects.toEqual({ message: "insert failed" });
    });
  });

  describe("deleteActivity", () => {
    it("deletes an activity by id", async () => {
      mockChain.eq.mockResolvedValueOnce({ error: null });

      await deleteActivity("a1");

      expect(mockFrom).toHaveBeenCalledWith("activities");
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith("id", "a1");
    });

    it("throws on Supabase error", async () => {
      mockChain.eq.mockResolvedValueOnce({
        error: { message: "delete failed" },
      });

      await expect(deleteActivity("a1")).rejects.toEqual({
        message: "delete failed",
      });
    });
  });

  describe("updateActivityOrders", () => {
    it("updates order for each activity", async () => {
      mockChain.eq.mockResolvedValue({ error: null });

      await updateActivityOrders([
        { id: "a1", order: 0 },
        { id: "a2", order: 1 },
      ]);

      expect(mockFrom).toHaveBeenCalledTimes(2);
      expect(mockChain.update).toHaveBeenCalledWith({ order: 0 });
      expect(mockChain.update).toHaveBeenCalledWith({ order: 1 });
      expect(mockChain.eq).toHaveBeenCalledWith("id", "a1");
      expect(mockChain.eq).toHaveBeenCalledWith("id", "a2");
    });

    it("throws if any update fails", async () => {
      mockChain.eq
        .mockResolvedValueOnce({ error: null })
        .mockResolvedValueOnce({ error: { message: "order update failed" } });

      await expect(
        updateActivityOrders([
          { id: "a1", order: 0 },
          { id: "a2", order: 1 },
        ]),
      ).rejects.toEqual({ message: "order update failed" });
    });
  });

  describe("moveActivity", () => {
    it("updates scheduled_date and order for an activity", async () => {
      mockChain.eq.mockResolvedValueOnce({ error: null });

      await moveActivity("a1", "2026-04-29", 2);

      expect(mockFrom).toHaveBeenCalledWith("activities");
      expect(mockChain.update).toHaveBeenCalledWith({
        scheduled_date: "2026-04-29",
        order: 2,
      });
      expect(mockChain.eq).toHaveBeenCalledWith("id", "a1");
    });

    it("throws on Supabase error", async () => {
      mockChain.eq.mockResolvedValueOnce({
        error: { message: "move failed" },
      });

      await expect(moveActivity("a1", "2026-04-29", 2)).rejects.toEqual({
        message: "move failed",
      });
    });
  });
});
