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
  intentLeafId: "footwork",
  block: null,
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
  it("renders the KIND eyebrow in uppercase", () => {
    renderCard();
    expect(screen.getByTestId("kind-chip").textContent).toBe("CLIMB");
  });

  it("renders the intent leaf label", () => {
    renderCard();
    expect(screen.getByText("Footwork")).toBeTruthy();
  });

  it("renders 'Just Climbing' for the synthetic intent", () => {
    renderCard({ intentLeafId: JUST_CLIMBING_LEAF_ID });
    expect(screen.getByText("Just Climbing")).toBeTruthy();
  });

  it("does not render an intent label when intentLeafId is null", () => {
    renderCard({ kind: "warmup", intentLeafId: null });
    expect(screen.queryByText("Footwork")).toBeNull();
  });

  it("renders the block name as the main label for Warmup", () => {
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
    expect(screen.getByTestId("kind-chip").textContent).toBe("WARMUP");
    expect(screen.getByText("General Warmup")).toBeTruthy();
  });

  it("renders the intent label (not block name) for Train", () => {
    renderCard({
      kind: "train",
      intentLeafId: "finger-strength",
      block: {
        name: "Max Hangs",
        exercises: [
          { name: "Max Recruitment Hang", sets: 3, value: 8, unit: "seconds", rest: 300 },
        ],
      },
    });
    expect(screen.getByTestId("kind-chip").textContent).toBe("TRAIN");
    expect(screen.getByText("Finger Strength")).toBeTruthy();
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
