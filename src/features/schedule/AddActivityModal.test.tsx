import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddActivityModal } from "./AddActivityModal";
import type { AddActivityInput } from "../../hooks/useWeekActivities";
import { JUST_CLIMBING_LEAF_ID } from "../../data/syntheticIntents";
import { GoalsProvider } from "../../contexts/GoalsContext";

describe("AddActivityModal", () => {
  let onClose: () => void;
  let onAdd: (input: AddActivityInput) => void;

  beforeEach(() => {
    localStorage.clear();
    onClose = vi.fn();
    onAdd = vi.fn();
  });

  function renderModal() {
    return render(
      <GoalsProvider>
        <AddActivityModal
          dayLabel="Monday 28 Apr"
          onClose={onClose}
          onAdd={onAdd}
        />
      </GoalsProvider>,
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

    it("clicking Warmup does not advance", async () => {
      const user = userEvent.setup();
      renderModal();
      await user.click(screen.getByRole("button", { name: /warmup/i }));
      expect(screen.queryByRole("tab", { name: /all/i })).toBeNull();
    });

    it("clicking Train does not advance", async () => {
      const user = userEvent.setup();
      renderModal();
      await user.click(screen.getByRole("button", { name: /train/i }));
      expect(screen.queryByRole("tab", { name: /all/i })).toBeNull();
    });
  });

  describe("Step 2: Climb Intent Picker handoff", () => {
    async function gotoClimbIntent() {
      const user = userEvent.setup();
      renderModal();
      await user.click(screen.getByRole("button", { name: /^climb$/i }));
      return user;
    }

    it("opens the IntentPickerModal when Climb is selected", async () => {
      await gotoClimbIntent();
      expect(screen.getByRole("tab", { name: /all/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /goals/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /recents/i })).toBeTruthy();
      expect(screen.getByText(/add climb · intent/i)).toBeTruthy();
    });

    it("Just Climbing is reachable and submits the synthetic leaf id", async () => {
      const user = await gotoClimbIntent();
      await user.click(screen.getByRole("button", { name: /just climbing/i }));
      expect(onAdd).toHaveBeenCalledWith({
        kind: "climb",
        intentLeafId: JUST_CLIMBING_LEAF_ID,
        block: null,
      });
      expect(onClose).toHaveBeenCalled();
    });

    it("drilling into a category and picking a leaf submits that leaf id", async () => {
      const user = await gotoClimbIntent();
      await user.click(screen.getByRole("button", { name: /^technique$/i }));
      await user.click(screen.getByRole("button", { name: /^footwork$/i }));
      expect(onAdd).toHaveBeenCalledWith({
        kind: "climb",
        intentLeafId: "footwork",
        block: null,
      });
      expect(onClose).toHaveBeenCalled();
    });

    it("recording the pick updates the volume:recentIntents localStorage entry", async () => {
      const user = await gotoClimbIntent();
      await user.click(screen.getByRole("button", { name: /^technique$/i }));
      await user.click(screen.getByRole("button", { name: /^footwork$/i }));
      const stored = localStorage.getItem("volume:recentIntents");
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored as string)).toContain("footwork");
    });
  });

  describe("overlay close", () => {
    it("clicking overlay on kind picker calls onClose", async () => {
      const user = userEvent.setup();
      renderModal();
      await user.click(screen.getByTestId("modal-overlay"));
      expect(onClose).toHaveBeenCalled();
    });
  });
});
