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
  accent: "#F5A623",
};

const provided = {
  innerRef: vi.fn(),
  draggableProps: { style: {} },
  dragHandleProps: null,
} as unknown as DraggableProvided;

const snapshot = { isDragging: false } as DraggableStateSnapshot;

function renderCard(overrides: Partial<Activity> = {}, onDelete = vi.fn()) {
  return render(
    <ActivityCard
      task={{ ...task, ...overrides }}
      provided={provided}
      snapshot={snapshot}
      onDelete={onDelete}
      onOpenPanel={vi.fn()}
      isLogged={false}
    />,
  );
}

describe("ActivityCard", () => {
  it("renders the Kind chip", () => {
    renderCard();
    expect(screen.getByTestId("kind-chip").textContent).toBe("Climb");
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
    renderCard({}, onDelete);
    await user.click(screen.getByRole("button", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onDelete).toHaveBeenCalledWith("a1");
  });

  it("does not call onDelete when cancel is clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderCard({}, onDelete);
    await user.click(screen.getByRole("button", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onDelete).not.toHaveBeenCalled();
  });
});
