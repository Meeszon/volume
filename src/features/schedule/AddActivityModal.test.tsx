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

    it("all three Kinds are enabled", () => {
      renderModal();
      const climb = screen.getByRole("button", { name: /^climbing session$/i });
      const warmup = screen.getByRole("button", { name: /^warmup$/i });
      const train = screen.getByRole("button", { name: /^training block$/i });
      expect(climb.getAttribute("aria-disabled")).not.toBe("true");
      expect(warmup.getAttribute("aria-disabled")).not.toBe("true");
      expect(train.getAttribute("aria-disabled")).not.toBe("true");
    });
  });

  describe("Climb flow", () => {
    async function gotoClimbIntent() {
      const user = userEvent.setup();
      renderModal();
      await user.click(screen.getByRole("button", { name: /^climbing session$/i }));
      return user;
    }

    it("opens the IntentPickerModal when Climb is selected", async () => {
      await gotoClimbIntent();
      expect(screen.getByRole("tab", { name: /all/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /goals/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /recents/i })).toBeTruthy();
      expect(screen.getByText(/add climbing session · intent/i)).toBeTruthy();
    });

    it("Just Climbing is reachable; after duration pick onAdd carries the synthetic leaf id and the chosen duration", async () => {
      const user = await gotoClimbIntent();
      await user.click(screen.getByRole("button", { name: /just climbing/i }));
      // Now on the duration picker
      expect(screen.getByText(/add climbing session · duration/i)).toBeTruthy();
      await user.click(screen.getByTestId("duration-option-60"));
      expect(onAdd).toHaveBeenCalledWith({
        kind: "climb",
        intentLeafId: JUST_CLIMBING_LEAF_ID,
        block: null,
        durationMinutes: 60,
      });
      expect(onClose).toHaveBeenCalled();
    });

    it("drilling into a category and picking a leaf advances to the duration picker, then submits with the leaf id + duration", async () => {
      const user = await gotoClimbIntent();
      await user.click(screen.getByRole("button", { name: /^technique$/i }));
      await user.click(screen.getByRole("button", { name: /^foot placement$/i }));
      expect(screen.getByText(/add climbing session · duration/i)).toBeTruthy();
      // Picked intent shows as the duration picker's subtitle
      expect(screen.getByText("Foot Placement")).toBeTruthy();
      await user.click(screen.getByTestId("duration-option-150"));
      expect(onAdd).toHaveBeenCalledWith({
        kind: "climb",
        intentLeafId: "foot-placement",
        block: null,
        durationMinutes: 150,
      });
      expect(onClose).toHaveBeenCalled();
    });

    it("the duration picker Back button returns to the IntentPickerModal", async () => {
      const user = await gotoClimbIntent();
      await user.click(screen.getByRole("button", { name: /^technique$/i }));
      await user.click(screen.getByRole("button", { name: /^foot placement$/i }));
      await user.click(screen.getByRole("button", { name: /back to intent/i }));
      expect(screen.getByText(/add climbing session · intent/i)).toBeTruthy();
      expect(onAdd).not.toHaveBeenCalled();
    });

    it("recording the pick updates the volume:recentIntents localStorage entry (at intent selection, before duration)", async () => {
      const user = await gotoClimbIntent();
      await user.click(screen.getByRole("button", { name: /^technique$/i }));
      await user.click(screen.getByRole("button", { name: /^foot placement$/i }));
      const stored = localStorage.getItem("volume:recentIntents");
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored as string)).toContain("foot-placement");
    });
  });

  describe("Warmup flow", () => {
    async function gotoWarmupPicker() {
      const user = userEvent.setup();
      renderModal();
      await user.click(screen.getByRole("button", { name: /^warmup$/i }));
      return user;
    }

    it("Warmup opens the WarmupPicker, not an Intent picker", async () => {
      await gotoWarmupPicker();
      expect(screen.getByText(/add warmup/i)).toBeTruthy();
      // No Intent tabs in Warmup flow
      expect(screen.queryByRole("tab", { name: /all/i })).toBeNull();
    });

    it("WarmupPicker lists warmup library entries", async () => {
      await gotoWarmupPicker();
      expect(screen.getByRole("button", { name: /general warmup/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /wall warmup/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /finger warmup/i })).toBeTruthy();
    });

    it("picking a warmup block advances to the BlockEditor", async () => {
      const user = await gotoWarmupPicker();
      await user.click(screen.getByRole("button", { name: /general warmup/i }));
      expect(screen.getByText(/add warmup · general warmup/i)).toBeTruthy();
      expect(screen.getByRole("button", { name: /add activity/i })).toBeTruthy();
    });

    it("submitting the BlockEditor calls onAdd with kind=warmup and the edited block", async () => {
      const user = await gotoWarmupPicker();
      await user.click(screen.getByRole("button", { name: /general warmup/i }));

      // Edit the first exercise's "Sets" field
      const setsInputs = screen.getAllByLabelText(/sets/i);
      await user.clear(setsInputs[0]);
      await user.type(setsInputs[0], "2");

      await user.click(screen.getByRole("button", { name: /add activity/i }));

      expect(onAdd).toHaveBeenCalledTimes(1);
      const call = (onAdd as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.kind).toBe("warmup");
      expect(call.intentLeafId).toBeNull();
      expect(call.block).not.toBeNull();
      expect(call.block.name).toBe("General Warmup");
      expect(call.block.exercises[0].sets).toBe(2);
      expect(onClose).toHaveBeenCalled();
    });

    it("Back button on the BlockEditor returns to the WarmupPicker", async () => {
      const user = await gotoWarmupPicker();
      await user.click(screen.getByRole("button", { name: /general warmup/i }));
      await user.click(screen.getByRole("button", { name: /^back$/i }));
      expect(screen.getByText(/add warmup/i)).toBeTruthy();
      expect(screen.getByRole("button", { name: /wall warmup/i })).toBeTruthy();
    });
  });

  describe("Train flow", () => {
    async function gotoTrainIntent() {
      const user = userEvent.setup();
      renderModal();
      await user.click(screen.getByRole("button", { name: /^training block$/i }));
      return user;
    }

    it("Train opens the IntentPickerModal with kind=train (no Just-Climbing pin)", async () => {
      await gotoTrainIntent();
      expect(screen.getByText(/add training block · intent/i)).toBeTruthy();
      expect(screen.queryByRole("button", { name: /just climbing/i })).toBeNull();
    });

    it("only Train-allowed leaves are reachable", async () => {
      const user = await gotoTrainIntent();
      await user.click(screen.getByRole("button", { name: /^strength$/i }));
      // Finger Strength (id: max-finger-strength) is climb+train — appears for Train kind
      expect(screen.getByRole("button", { name: /^finger strength$/i })).toBeTruthy();
      // Core Tension is climb+train — also appears
      expect(screen.getByRole("button", { name: /core tension/i })).toBeTruthy();
      // Compression Strength is climb-only — must NOT appear under Train
      expect(screen.queryByRole("button", { name: /compression strength/i })).toBeNull();
    });

    it("picking a Train leaf advances to the BlockPicker listing that leaf's blocks", async () => {
      const user = await gotoTrainIntent();
      await user.click(screen.getByRole("button", { name: /^strength$/i }));
      await user.click(screen.getByRole("button", { name: /^finger strength$/i }));
      expect(screen.getByText(/add training block · block/i)).toBeTruthy();
      expect(screen.getByRole("button", { name: /max hangs/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /minimum edge/i })).toBeTruthy();
    });

    it("picking a Block advances to the BlockEditor", async () => {
      const user = await gotoTrainIntent();
      await user.click(screen.getByRole("button", { name: /^strength$/i }));
      await user.click(screen.getByRole("button", { name: /^finger strength$/i }));
      await user.click(screen.getByRole("button", { name: /max hangs/i }));
      expect(screen.getByText(/add training block · max hangs/i)).toBeTruthy();
      expect(screen.getByRole("button", { name: /add activity/i })).toBeTruthy();
    });

    it("submitting calls onAdd with kind=train, the intent leaf, and the edited block", async () => {
      const user = await gotoTrainIntent();
      await user.click(screen.getByRole("button", { name: /^strength$/i }));
      await user.click(screen.getByRole("button", { name: /^finger strength$/i }));
      await user.click(screen.getByRole("button", { name: /max hangs/i }));

      const setsInputs = screen.getAllByLabelText(/sets/i);
      await user.clear(setsInputs[0]);
      await user.type(setsInputs[0], "6");

      await user.click(screen.getByRole("button", { name: /add activity/i }));

      expect(onAdd).toHaveBeenCalledTimes(1);
      const call = (onAdd as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.kind).toBe("train");
      expect(call.intentLeafId).toBe("max-finger-strength");
      expect(call.block).not.toBeNull();
      expect(call.block.name).toMatch(/max hangs/i);
      expect(call.block.exercises[0].sets).toBe(6);
      expect(onClose).toHaveBeenCalled();
    });

    it("BlockPicker Back returns to the IntentPickerModal", async () => {
      const user = await gotoTrainIntent();
      await user.click(screen.getByRole("button", { name: /^strength$/i }));
      await user.click(screen.getByRole("button", { name: /^finger strength$/i }));
      await user.click(screen.getByRole("button", { name: /back to intent/i }));
      expect(screen.getByText(/add training block · intent/i)).toBeTruthy();
    });

    it("BlockEditor Back returns to the BlockPicker", async () => {
      const user = await gotoTrainIntent();
      await user.click(screen.getByRole("button", { name: /^strength$/i }));
      await user.click(screen.getByRole("button", { name: /^finger strength$/i }));
      await user.click(screen.getByRole("button", { name: /max hangs/i }));
      await user.click(screen.getByRole("button", { name: /^back$/i }));
      expect(screen.getByText(/add training block · block/i)).toBeTruthy();
      expect(screen.getByRole("button", { name: /minimum edge/i })).toBeTruthy();
    });

    it("records the picked Train intent in volume:recentIntents", async () => {
      const user = await gotoTrainIntent();
      await user.click(screen.getByRole("button", { name: /^strength$/i }));
      await user.click(screen.getByRole("button", { name: /^finger strength$/i }));
      const stored = localStorage.getItem("volume:recentIntents");
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored as string)).toContain("max-finger-strength");
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
