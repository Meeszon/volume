import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoadSummaryBar } from "./LoadSummaryBar";
import { GoalsProvider } from "../../contexts/GoalsContext";
import { JUST_CLIMBING_LEAF_ID } from "../../data/syntheticIntents";
import type { DbActivity, Goal } from "../../types";

const WEEK_START = new Date(2026, 4, 18); // Mon 18 May 2026
const WEEK_END = new Date(2026, 4, 24); // Sun 24 May 2026

function makeActivity(overrides: Partial<DbActivity>): DbActivity {
  return {
    id: overrides.id ?? `act-${Math.random()}`,
    user_id: "user-1",
    scheduled_date: overrides.scheduled_date ?? "2026-05-20",
    kind: overrides.kind ?? "climb",
    intent_leaf_id: overrides.intent_leaf_id ?? null,
    block: overrides.block ?? null,
    order: overrides.order ?? 0,
    created_at: overrides.created_at ?? "2026-05-20T00:00:00Z",
  };
}

function renderBar(
  activities: DbActivity[],
  goals: Goal[],
  weekStart: Date = WEEK_START,
  weekEnd: Date = WEEK_END,
) {
  localStorage.setItem("volume:goals", JSON.stringify(goals));
  return render(
    <MemoryRouter>
      <GoalsProvider>
        <LoadSummaryBar
          activities={activities}
          weekStart={weekStart}
          weekEnd={weekEnd}
        />
      </GoalsProvider>
    </MemoryRouter>,
  );
}

describe("LoadSummaryBar", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the empty-state CTA when no goals are set", () => {
    renderBar([], []);
    expect(screen.getByText(/no goals set/i)).toBeTruthy();
    const cta = screen.getByRole("link", {
      name: /pick goals on the skill tree/i,
    });
    expect(cta.getAttribute("href")).toBe("/goals");
  });

  it("renders one row per goal with the correct count", () => {
    const goals = [{ leafId: "footwork" }, { leafId: "finger-strength" }];
    const activities = [
      makeActivity({ kind: "climb", intent_leaf_id: "footwork" }),
      makeActivity({ kind: "climb", intent_leaf_id: "footwork" }),
      makeActivity({ kind: "train", intent_leaf_id: "finger-strength" }),
    ];
    renderBar(activities, goals);

    expect(screen.getByText("Footwork")).toBeTruthy();
    expect(screen.getByText("Finger Strength")).toBeTruthy();
    expect(screen.getByTestId("goal-count-footwork").textContent).toBe("2");
    expect(screen.getByTestId("goal-count-finger-strength").textContent).toBe(
      "1",
    );
  });

  it("renders zero-count goal rows", () => {
    const goals = [{ leafId: "footwork" }, { leafId: "hip-mobility" }];
    const activities = [
      makeActivity({ kind: "climb", intent_leaf_id: "footwork" }),
    ];
    renderBar(activities, goals);

    expect(screen.getByTestId("goal-count-footwork").textContent).toBe("1");
    expect(screen.getByTestId("goal-count-hip-mobility").textContent).toBe("0");
  });

  it("excludes Warmup activities from the count", () => {
    const goals = [{ leafId: "footwork" }];
    const activities = [
      makeActivity({ kind: "climb", intent_leaf_id: "footwork" }),
      makeActivity({ kind: "warmup", intent_leaf_id: "footwork" }),
    ];
    renderBar(activities, goals);

    expect(screen.getByTestId("goal-count-footwork").textContent).toBe("1");
  });

  it("excludes Just-Climbing activities from the count", () => {
    const goals = [{ leafId: "footwork" }];
    const activities = [
      makeActivity({ kind: "climb", intent_leaf_id: "footwork" }),
      makeActivity({ kind: "climb", intent_leaf_id: JUST_CLIMBING_LEAF_ID }),
    ];
    renderBar(activities, goals);

    expect(screen.getByTestId("goal-count-footwork").textContent).toBe("1");
  });

  it("ignores activities outside the supplied week window", () => {
    const goals = [{ leafId: "footwork" }];
    const activities = [
      makeActivity({
        scheduled_date: "2026-05-10",
        intent_leaf_id: "footwork",
      }),
      makeActivity({
        scheduled_date: "2026-05-20",
        intent_leaf_id: "footwork",
      }),
    ];
    renderBar(activities, goals);

    expect(screen.getByTestId("goal-count-footwork").textContent).toBe("1");
  });

  it("updates the count when activities prop changes", () => {
    const goals = [{ leafId: "footwork" }];
    localStorage.setItem("volume:goals", JSON.stringify(goals));

    const { rerender } = render(
      <MemoryRouter>
        <GoalsProvider>
          <LoadSummaryBar
            activities={[]}
            weekStart={WEEK_START}
            weekEnd={WEEK_END}
          />
        </GoalsProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("goal-count-footwork").textContent).toBe("0");

    rerender(
      <MemoryRouter>
        <GoalsProvider>
          <LoadSummaryBar
            activities={[
              makeActivity({ kind: "climb", intent_leaf_id: "footwork" }),
            ]}
            weekStart={WEEK_START}
            weekEnd={WEEK_END}
          />
        </GoalsProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("goal-count-footwork").textContent).toBe("1");
  });
});
