import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActivityCard } from "./ActivityCard";
import type { Activity } from "../../types";
import { JUST_CLIMBING_LEAF_ID } from "../../data/syntheticIntents";
import type {
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";

const task: Activity = {
  id: "a1",
  kind: "climb",
  intentLeafId: "foot-placement",
  block: null,
  durationMinutes: 90,
};

const provided = {
  innerRef: vi.fn(),
  draggableProps: { style: {} },
  dragHandleProps: null,
} as unknown as DraggableProvided;

const snapshot = { isDragging: false } as DraggableStateSnapshot;

function renderCard(
  overrides: Partial<Activity> = {},
  {
    onDelete = vi.fn(),
    isLogged = false,
  }: { onDelete?: (id: string) => void; isLogged?: boolean } = {},
) {
  return render(
    <ActivityCard
      task={{ ...task, ...overrides }}
      provided={provided}
      snapshot={snapshot}
      onDelete={onDelete}
      onOpenPanel={vi.fn()}
      isLogged={isLogged}
    />,
  );
}

describe("ActivityCard", () => {
  it("renders the intent in the eyebrow and 'Climbing Session' as the main label for Climb", () => {
    renderCard();
    expect(screen.getByTestId("eyebrow-chip").textContent).toBe("Foot Placement");
    expect(screen.getByText("Climbing Session")).toBeTruthy();
  });

  it("renders 'Just Climbing' in the eyebrow for the synthetic intent", () => {
    renderCard({ intentLeafId: JUST_CLIMBING_LEAF_ID });
    expect(screen.getByTestId("eyebrow-chip").textContent).toBe("Just Climbing");
    expect(screen.getByText("Climbing Session")).toBeTruthy();
  });

  it("renders 'Warmup' in the eyebrow and the block name as the main label for Warmup", () => {
    renderCard({
      kind: "warmup",
      intentLeafId: null,
      block: {
        name: "General Warmup",
        exercises: [
          { name: "Easy Cardio", sets: 1, value: 300, unit: "seconds", rest: 30 },
        ],
      },
    });
    expect(screen.getByTestId("eyebrow-chip").textContent).toBe("Warmup");
    expect(screen.getByText("General Warmup")).toBeTruthy();
  });

  it("renders the intent in the eyebrow and the block name as the main label for Train", () => {
    renderCard({
      kind: "train",
      intentLeafId: "max-finger-strength",
      block: {
        name: "Max Hangs",
        exercises: [
          { name: "Max Recruitment Hang", sets: 3, value: 8, unit: "seconds", rest: 300 },
        ],
      },
    });
    expect(screen.getByTestId("eyebrow-chip").textContent).toBe("Finger Strength");
    expect(screen.getByText("Max Hangs")).toBeTruthy();
  });

  it("renders the duration as the top-right tag for Climb (90 min → 1.5h)", () => {
    renderCard();
    expect(screen.getByTestId("card-tag").textContent).toBe("1.5h");
  });

  it("renders the duration as a whole-hour value for Climb (120 min → 2h)", () => {
    renderCard({ durationMinutes: 120 });
    expect(screen.getByTestId("card-tag").textContent).toBe("2h");
  });

  it("does not render a tag for a Climb with no duration", () => {
    renderCard({ durationMinutes: null });
    expect(screen.queryByTestId("card-tag")).toBeNull();
  });

  it("does not render a tag for Warmup", () => {
    renderCard({
      kind: "warmup",
      intentLeafId: null,
      durationMinutes: null,
      block: {
        name: "General Warmup",
        exercises: [
          { name: "Easy Cardio", sets: 1, value: 300, unit: "seconds", rest: 30 },
        ],
      },
    });
    expect(screen.queryByTestId("card-tag")).toBeNull();
  });

  it("does not render a tag for Train", () => {
    renderCard({
      kind: "train",
      intentLeafId: "finger-strength",
      durationMinutes: null,
      block: {
        name: "Max Hangs",
        exercises: [
          { name: "Max Recruitment Hang", sets: 3, value: 8, unit: "seconds", rest: 300 },
        ],
      },
    });
    expect(screen.queryByTestId("card-tag")).toBeNull();
  });

  it("renders the inline logged check when isLogged is true", () => {
    renderCard({}, { isLogged: true });
    expect(screen.getByTestId("logged-check")).toBeTruthy();
  });

  it("does not render the logged check when isLogged is false", () => {
    renderCard();
    expect(screen.queryByTestId("logged-check")).toBeNull();
  });

  it("shows a delete button", () => {
    renderCard();
    expect(screen.getByRole("button", { name: /delete/i })).toBeTruthy();
  });

  it("shows confirmation step when delete button is clicked", async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(screen.getByRole("button", { name: /confirm/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeTruthy();
  });

  it("calls onDelete with activity id when confirmed", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderCard({}, { onDelete });
    await user.click(screen.getByRole("button", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onDelete).toHaveBeenCalledWith("a1");
  });

  it("does not call onDelete when cancel is clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderCard({}, { onDelete });
    await user.click(screen.getByRole("button", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onDelete).not.toHaveBeenCalled();
  });
});
