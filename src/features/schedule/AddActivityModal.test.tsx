import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddActivityModal } from "./AddActivityModal";
import type { AddActivityInput } from "../../hooks/useWeekActivities";
import { JUST_CLIMBING_LEAF_ID } from "../../data/syntheticIntents";

describe("AddActivityModal", () => {
  let onClose: () => void;
  let onAdd: (input: AddActivityInput) => void;

  beforeEach(() => {
    onClose = vi.fn();
    onAdd = vi.fn();
  });

  function renderModal() {
    return render(
      <AddActivityModal
        dayLabel="Monday 28 Apr"
        onClose={onClose}
        onAdd={onAdd}
      />,
    );
  }

  describe("Step 1: Kind Picker", () => {
    it("shows Climb, Warmup, Train", () => {
      renderModal();
      expect(screen.getByRole("button", { name: /climb/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /warmup/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /train/i })).toBeTruthy();
    });

    it("Warmup and Train are disabled with a 'Coming soon' hint", () => {
      renderModal();
      const warmup = screen.getByRole("button", { name: /warmup/i });
      const train = screen.getByRole("button", { name: /train/i });
      expect(warmup.getAttribute("aria-disabled")).toBe("true");
      expect(train.getAttribute("aria-disabled")).toBe("true");
      expect(screen.getAllByText(/coming soon/i).length).toBeGreaterThanOrEqual(2);
    });

    it("Climb is enabled and not coming-soon", () => {
      renderModal();
      const climb = screen.getByRole("button", { name: /^climb$/i });
      expect(climb.getAttribute("aria-disabled")).toBe("false");
    });

    it("does not show a back button on Kind picker", () => {
      renderModal();
      expect(screen.queryByRole("button", { name: /back/i })).toBeNull();
    });

    it("clicking Warmup does not advance", async () => {
      const user = userEvent.setup();
      renderModal();
      await user.click(screen.getByRole("button", { name: /warmup/i }));
      expect(screen.queryByRole("button", { name: /back/i })).toBeNull();
    });

    it("clicking Train does not advance", async () => {
      const user = userEvent.setup();
      renderModal();
      await user.click(screen.getByRole("button", { name: /train/i }));
      expect(screen.queryByRole("button", { name: /back/i })).toBeNull();
    });
  });

  describe("Step 2: Climb Intent Picker", () => {
    async function gotoClimbIntent() {
      const user = userEvent.setup();
      renderModal();
      await user.click(screen.getByRole("button", { name: /^climb$/i }));
      return user;
    }

    it("opens the intent picker when Climb is selected", async () => {
      await gotoClimbIntent();
      expect(screen.getByText(/pick intent/i)).toBeTruthy();
    });

    it("pins Just Climbing at the top of the list", async () => {
      await gotoClimbIntent();
      const items = screen.getAllByRole("button");
      const labels = items.map((b) => b.textContent ?? "");
      const justClimbingIdx = labels.findIndex((t) => t.includes("Just Climbing"));
      const footworkIdx = labels.findIndex((t) => t === "Footwork");
      expect(justClimbingIdx).toBeGreaterThan(-1);
      expect(footworkIdx).toBeGreaterThan(-1);
      expect(justClimbingIdx).toBeLessThan(footworkIdx);
    });

    it("shows Climb-allowed tree leaves", async () => {
      await gotoClimbIntent();
      expect(screen.getByText("Footwork")).toBeTruthy();
      expect(screen.getByText("Finger Strength")).toBeTruthy();
      expect(screen.getByText("Route Reading")).toBeTruthy();
    });

    it("excludes Train-only leaves", async () => {
      await gotoClimbIntent();
      expect(screen.queryByText("Hip Mobility")).toBeNull();
      expect(screen.queryByText("Antagonist Training")).toBeNull();
    });

    it("selecting Just Climbing calls onAdd with the synthetic leaf id", async () => {
      const user = await gotoClimbIntent();
      await user.click(screen.getByText("Just Climbing"));
      expect(onAdd).toHaveBeenCalledWith({
        kind: "climb",
        intentLeafId: JUST_CLIMBING_LEAF_ID,
        block: null,
      });
      expect(onClose).toHaveBeenCalled();
    });

    it("selecting a leaf calls onAdd with that leaf's id", async () => {
      const user = await gotoClimbIntent();
      await user.click(screen.getByText("Footwork"));
      expect(onAdd).toHaveBeenCalledWith({
        kind: "climb",
        intentLeafId: "footwork",
        block: null,
      });
      expect(onClose).toHaveBeenCalled();
    });

    it("back returns to the Kind picker", async () => {
      const user = await gotoClimbIntent();
      await user.click(screen.getByRole("button", { name: /back/i }));
      expect(screen.getByRole("button", { name: /^climb$/i })).toBeTruthy();
    });
  });

  describe("overlay close", () => {
    it("clicking overlay calls onClose", async () => {
      const user = userEvent.setup();
      renderModal();
      await user.click(screen.getByTestId("modal-overlay"));
      expect(onClose).toHaveBeenCalled();
    });
  });
});
