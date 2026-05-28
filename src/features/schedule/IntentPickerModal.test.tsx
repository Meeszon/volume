import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IntentPickerModal } from "./IntentPickerModal";
import { JUST_CLIMBING_LEAF_ID } from "../../data/syntheticIntents";
import { GoalsProvider } from "../../contexts/GoalsContext";
import type { Goal, Kind } from "../../types";

interface RenderOpts {
  kind?: Kind;
  recentIds?: string[];
  initialGoals?: Goal[];
}

function renderPicker(opts: RenderOpts = {}) {
  const onClose = vi.fn();
  const onSelect = vi.fn();
  const { kind = "climb", recentIds = [], initialGoals = [] } = opts;

  if (initialGoals.length > 0) {
    localStorage.setItem("volume:goals", JSON.stringify(initialGoals));
  }

  render(
    <GoalsProvider>
      <IntentPickerModal
        dayLabel="Monday 28 Apr"
        kind={kind}
        recentIds={recentIds}
        onClose={onClose}
        onSelect={onSelect}
      />
    </GoalsProvider>,
  );

  return { onClose, onSelect, user: userEvent.setup() };
}

beforeEach(() => {
  localStorage.clear();
});

describe("IntentPickerModal", () => {
  describe("header", () => {
    it("shows the Kind-aware title and the day label", () => {
      renderPicker({ kind: "climb" });
      expect(screen.getByText(/add climbing session · intent/i)).toBeTruthy();
      expect(screen.getByText(/monday 28 apr/i)).toBeTruthy();
    });

    it("clicking overlay calls onClose", async () => {
      const { onClose, user } = renderPicker();
      await user.click(screen.getByTestId("modal-overlay"));
      expect(onClose).toHaveBeenCalled();
    });

    it("clicking × calls onClose", async () => {
      const { onClose, user } = renderPicker();
      await user.click(screen.getByRole("button", { name: /close/i }));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("tabs", () => {
    it("renders All / Goals / Recents tabs", () => {
      renderPicker();
      expect(screen.getByRole("tab", { name: /all/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /goals/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /recents/i })).toBeTruthy();
    });

    it("All tab is selected by default", () => {
      renderPicker();
      expect(
        screen.getByRole("tab", { name: /all/i }).getAttribute("aria-selected"),
      ).toBe("true");
    });
  });

  describe("Just-Climbing pin", () => {
    it("renders the synthetic Just Climbing hex when Kind = Climb", () => {
      renderPicker({ kind: "climb" });
      expect(screen.getByRole("button", { name: /just climbing/i })).toBeTruthy();
    });

    it("does NOT render the Just Climbing hex when Kind ≠ Climb", () => {
      renderPicker({ kind: "train" });
      expect(screen.queryByRole("button", { name: /just climbing/i })).toBeNull();
    });

    it("clicking Just Climbing fires onSelect with the synthetic id", async () => {
      const { onSelect, user } = renderPicker({ kind: "climb" });
      await user.click(screen.getByRole("button", { name: /just climbing/i }));
      expect(onSelect).toHaveBeenCalledWith(JUST_CLIMBING_LEAF_ID);
    });
  });

  describe("All tab — drill-down", () => {
    it("shows the climb-relevant categories on entry", () => {
      renderPicker({ kind: "climb" });
      // For climb kind: Mobility and Longevity have no climb-allowed leaves, so
      // they're filtered out. Only Technique, Mental, Strength remain.
      expect(screen.getByRole("button", { name: /^technique$/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /^mental$/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /^strength$/i })).toBeTruthy();
      expect(screen.queryByRole("button", { name: /^mobility$/i })).toBeNull();
      expect(screen.queryByRole("button", { name: /^longevity$/i })).toBeNull();
    });

    it("does NOT show leaves before drilling", () => {
      renderPicker({ kind: "climb" });
      expect(screen.queryByRole("button", { name: /^foot placement$/i })).toBeNull();
    });

    it("tapping a category drills in — replaces categories with that category's leaves (flattened across subcategories) and shows a back arrow", async () => {
      const { user } = renderPicker({ kind: "climb" });
      await user.click(screen.getByRole("button", { name: /^technique$/i }));

      // All descendant leaves under Technique are flattened into the row
      expect(screen.getByRole("button", { name: /^foot placement$/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /^hooking$/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /^dynamic movement$/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /^coordination$/i })).toBeTruthy();

      // Categories no longer visible (only the drilled-into label remains)
      expect(screen.queryByRole("button", { name: /^mobility$/i })).toBeNull();
      expect(screen.queryByRole("button", { name: /^strength$/i })).toBeNull();

      // Back button shown
      expect(screen.getByRole("button", { name: /back/i })).toBeTruthy();
    });

    it("back arrow returns to the category row", async () => {
      const { user } = renderPicker({ kind: "climb" });
      await user.click(screen.getByRole("button", { name: /^technique$/i }));
      await user.click(screen.getByRole("button", { name: /back/i }));
      expect(screen.getByRole("button", { name: /^technique$/i })).toBeTruthy();
      expect(screen.queryByRole("button", { name: /^foot placement$/i })).toBeNull();
    });

    it("only shows leaves whose allowedKinds includes the current Kind", async () => {
      const { user } = renderPicker({ kind: "train" });
      await user.click(screen.getByRole("button", { name: /^strength$/i }));
      // Train-allowed strength leaves
      expect(screen.getByRole("button", { name: /^finger strength$/i })).toBeTruthy();
    });

    it("excludes Climb-only leaves when Kind = Train", async () => {
      const { user } = renderPicker({ kind: "train" });
      await user.click(screen.getByRole("button", { name: /^strength$/i }));
      // Compression is climb-only — must NOT appear under Train
      expect(screen.queryByRole("button", { name: /^compression$/i })).toBeNull();
    });

    it("clicking a leaf invokes onSelect", async () => {
      const { user, onSelect } = renderPicker({ kind: "climb" });
      await user.click(screen.getByRole("button", { name: /^technique$/i }));
      await user.click(screen.getByRole("button", { name: /^foot placement$/i }));
      expect(onSelect).toHaveBeenCalledWith("foot-placement");
    });
  });

  describe("Goals tab", () => {
    it("renders goal hexes filtered by Kind", async () => {
      const { user } = renderPicker({
        kind: "climb",
        initialGoals: [
          { leafId: "foot-placement" },
          { leafId: "hip-mobility" }, // train-only — must be filtered out
        ],
      });
      await user.click(screen.getByRole("tab", { name: /goals/i }));
      expect(screen.getByRole("button", { name: /^foot placement$/i })).toBeTruthy();
      expect(screen.queryByRole("button", { name: /^hip mobility$/i })).toBeNull();
    });

    it("shows empty-state CTA when no goals are set", async () => {
      const { user } = renderPicker({ kind: "climb" });
      await user.click(screen.getByRole("tab", { name: /goals/i }));
      expect(screen.getByText(/skill tree/i)).toBeTruthy();
    });

    it("clicking a goal hex invokes onSelect", async () => {
      const { user, onSelect } = renderPicker({
        kind: "climb",
        initialGoals: [{ leafId: "foot-placement" }],
      });
      await user.click(screen.getByRole("tab", { name: /goals/i }));
      await user.click(screen.getByRole("button", { name: /^foot placement$/i }));
      expect(onSelect).toHaveBeenCalledWith("foot-placement");
    });
  });

  describe("Recents tab", () => {
    it("renders the most-recent intents filtered by Kind, in order", async () => {
      const { user } = renderPicker({
        kind: "climb",
        recentIds: ["max-finger-strength", "hip-mobility", "foot-placement"],
      });
      await user.click(screen.getByRole("tab", { name: /recents/i }));
      const buttons = screen.getAllByRole("button");
      const labels = buttons.map((b) => b.textContent ?? "");
      const fsIdx = labels.findIndex((l) => l.includes("Finger Strength"));
      const fwIdx = labels.findIndex((l) => l.includes("Foot Placement"));
      expect(fsIdx).toBeGreaterThan(-1);
      expect(fwIdx).toBeGreaterThan(-1);
      expect(fsIdx).toBeLessThan(fwIdx);
      // hip-mobility is train-only — filtered out
      expect(labels.some((l) => l.includes("Hip Mobility"))).toBe(false);
    });

    it("shows empty-state when no recents", async () => {
      const { user } = renderPicker({ kind: "climb", recentIds: [] });
      await user.click(screen.getByRole("tab", { name: /recents/i }));
      expect(screen.getByText(/no recent intents/i)).toBeTruthy();
    });

    it("clicking a recent hex invokes onSelect", async () => {
      const { user, onSelect } = renderPicker({
        kind: "climb",
        recentIds: ["foot-placement"],
      });
      await user.click(screen.getByRole("tab", { name: /recents/i }));
      await user.click(screen.getByRole("button", { name: /^foot placement$/i }));
      expect(onSelect).toHaveBeenCalledWith("foot-placement");
    });
  });

  describe("tab switching preserves All-tab drill state", () => {
    it("drilling, switching to Recents, then back to All keeps the drilled view", async () => {
      const { user } = renderPicker({ kind: "climb" });
      await user.click(screen.getByRole("button", { name: /^technique$/i }));
      // confirm drilled
      expect(screen.getByRole("button", { name: /^foot placement$/i })).toBeTruthy();

      await user.click(screen.getByRole("tab", { name: /recents/i }));
      // Foot Placement is no longer rendered while on Recents
      expect(screen.queryByRole("button", { name: /^foot placement$/i })).toBeNull();

      await user.click(screen.getByRole("tab", { name: /all/i }));
      // Drilled-in view restored — Foot Placement visible again, Mobility not
      expect(screen.getByRole("button", { name: /^foot placement$/i })).toBeTruthy();
      expect(screen.queryByRole("button", { name: /^mobility$/i })).toBeNull();
    });
  });
});
