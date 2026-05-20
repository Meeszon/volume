import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const mockUseWeekActivities = vi.hoisted(() => vi.fn());

vi.mock("../../hooks/useWeekActivities", () => ({
  useWeekActivities: mockUseWeekActivities,
}));

vi.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Droppable: ({ children }: { children: (p: unknown, s: unknown) => React.ReactNode }) =>
    children(
      { innerRef: vi.fn(), droppableProps: {}, placeholder: null },
      { isDraggingOver: false },
    ),
  Draggable: ({ children }: { children: (p: unknown, s: unknown) => React.ReactNode }) =>
    children(
      { innerRef: vi.fn(), draggableProps: { style: {} }, dragHandleProps: null },
      { isDragging: false },
    ),
}));

import { SchedulePage } from "./SchedulePage";
import { GoalsProvider } from "../../contexts/GoalsContext";
import type { Columns } from "../../types";

function renderSchedule() {
  return render(
    <MemoryRouter>
      <GoalsProvider>
        <SchedulePage />
      </GoalsProvider>
    </MemoryRouter>,
  );
}

const EMPTY_COLUMNS: Columns = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: [],
};

describe("SchedulePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 'Rest day' for every day when all columns are empty", () => {
    mockUseWeekActivities.mockReturnValue({
      columns: EMPTY_COLUMNS,
      activities: [],
      loading: false,
      error: null,
      addActivity: vi.fn(),
      deleteActivity: vi.fn(),
      handleDragEnd: vi.fn(),
    });

    renderSchedule();

    const restDays = screen.getAllByText("Rest day");
    expect(restDays).toHaveLength(7);
  });

  it("does not show 'Rest day' for a day that has activities", () => {
    const columns: Columns = {
      ...EMPTY_COLUMNS,
      Monday: [
        {
          id: "a1",
          kind: "climb",
          intentLeafId: "footwork",
          block: null,
          durationMinutes: 90,
        },
      ],
    };

    mockUseWeekActivities.mockReturnValue({
      columns,
      activities: [],
      loading: false,
      error: null,
      addActivity: vi.fn(),
      deleteActivity: vi.fn(),
      handleDragEnd: vi.fn(),
    });

    renderSchedule();

    const restDays = screen.getAllByText("Rest day");
    expect(restDays).toHaveLength(6);
  });

  it("does not show 'Rest day' while loading", () => {
    mockUseWeekActivities.mockReturnValue({
      columns: EMPTY_COLUMNS,
      activities: [],
      loading: true,
      error: null,
      addActivity: vi.fn(),
      deleteActivity: vi.fn(),
      handleDragEnd: vi.fn(),
    });

    renderSchedule();

    expect(screen.queryByText("Rest day")).toBeNull();
  });

  it("renders the Week N header with date subtitle", () => {
    mockUseWeekActivities.mockReturnValue({
      columns: EMPTY_COLUMNS,
      activities: [],
      loading: false,
      error: null,
      addActivity: vi.fn(),
      deleteActivity: vi.fn(),
      handleDragEnd: vi.fn(),
    });

    renderSchedule();

    expect(screen.getByText(/^Week \d+$/)).toBeTruthy();
    // Date subtitle uses "MMM D — MMM D, YYYY" — matches anywhere
    expect(screen.getByText(/[A-Z][a-z]{2} \d+ — [A-Z][a-z]{2} \d+, \d{4}/)).toBeTruthy();
  });

  describe("AddActivityModal integration", () => {
    let mockAddActivity: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockAddActivity = vi.fn();
      mockUseWeekActivities.mockReturnValue({
        columns: EMPTY_COLUMNS,
        activities: [],
        loading: false,
        error: null,
        addActivity: mockAddActivity,
        deleteActivity: vi.fn(),
        handleDragEnd: vi.fn(),
      });
    });

    it("opens modal when clicking Add activity button", async () => {
      const user = userEvent.setup();
      renderSchedule();

      const addButtons = screen.getAllByText("Add activity");
      await user.click(addButtons[0]);

      expect(screen.getByTestId("modal-overlay")).toBeTruthy();
      expect(screen.getByText(/Add Activity —/)).toBeTruthy();
    });

    it("completing the Climb flow (intent → duration) calls addActivity and closes the modal", async () => {
      const user = userEvent.setup();
      renderSchedule();

      const addButtons = screen.getAllByText("Add activity");
      await user.click(addButtons[0]);

      await user.click(screen.getByRole("button", { name: /^climb$/i }));
      await user.click(screen.getByRole("button", { name: /^technique$/i }));
      await user.click(screen.getByRole("button", { name: /^footwork$/i }));
      await user.click(screen.getByTestId("duration-option-90"));

      expect(mockAddActivity).toHaveBeenCalledWith(
        expect.any(String),
        {
          kind: "climb",
          intentLeafId: "footwork",
          block: null,
          durationMinutes: 90,
        },
      );
      expect(screen.queryByTestId("modal-overlay")).toBeNull();
    });

    it("closes modal when clicking overlay", async () => {
      const user = userEvent.setup();
      renderSchedule();

      const addButtons = screen.getAllByText("Add activity");
      await user.click(addButtons[0]);
      expect(screen.getByTestId("modal-overlay")).toBeTruthy();

      await user.click(screen.getByTestId("modal-overlay"));

      expect(screen.queryByTestId("modal-overlay")).toBeNull();
    });
  });
});
