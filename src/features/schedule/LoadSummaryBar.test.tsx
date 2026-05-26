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
    duration_minutes: overrides.duration_minutes ?? null,
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
      name: /select goals from the skill tree/i,
    });
    expect(cta.getAttribute("href")).toBe("/goals");
  });

  it("renders one row per goal, marked as covered when sessions exist", () => {
    const goals = [{ leafId: "foot-placement" }, { leafId: "max-finger-strength" }];
    const activities = [
      makeActivity({ kind: "climb", intent_leaf_id: "foot-placement" }),
      makeActivity({ kind: "climb", intent_leaf_id: "foot-placement" }),
      makeActivity({ kind: "train", intent_leaf_id: "max-finger-strength" }),
    ];
    renderBar(activities, goals);

    expect(screen.getByText("Foot Placement")).toBeTruthy();
    expect(screen.getByText("Max Finger Strength")).toBeTruthy();
    expect(
      screen.getByTestId("goal-row-foot-placement").getAttribute("data-covered"),
    ).toBe("true");
    expect(
      screen
        .getByTestId("goal-row-max-finger-strength")
        .getAttribute("data-covered"),
    ).toBe("true");
  });

  it("renders zero-count goal rows distinctly from covered ones", () => {
    const goals = [{ leafId: "foot-placement" }, { leafId: "hip-mobility" }];
    const activities = [
      makeActivity({ kind: "climb", intent_leaf_id: "foot-placement" }),
    ];
    renderBar(activities, goals);

    expect(
      screen.getByTestId("goal-row-foot-placement").getAttribute("data-covered"),
    ).toBe("true");
    expect(
      screen.getByTestId("goal-row-hip-mobility").getAttribute("data-covered"),
    ).toBe("false");
  });

  it("excludes Warmup activities from coverage", () => {
    const goals = [{ leafId: "hip-mobility" }];
    const activities = [
      makeActivity({ kind: "warmup", intent_leaf_id: "hip-mobility" }),
    ];
    renderBar(activities, goals);

    expect(
      screen.getByTestId("goal-row-hip-mobility").getAttribute("data-covered"),
    ).toBe("false");
  });

  it("excludes Just-Climbing activities from coverage", () => {
    const goals = [{ leafId: "foot-placement" }];
    const activities = [
      makeActivity({ kind: "climb", intent_leaf_id: JUST_CLIMBING_LEAF_ID }),
    ];
    renderBar(activities, goals);

    expect(
      screen.getByTestId("goal-row-foot-placement").getAttribute("data-covered"),
    ).toBe("false");
  });

  it("ignores activities outside the supplied week window", () => {
    const goals = [{ leafId: "foot-placement" }];
    const activities = [
      makeActivity({
        scheduled_date: "2026-05-10",
        intent_leaf_id: "foot-placement",
      }),
    ];
    renderBar(activities, goals);

    expect(
      screen.getByTestId("goal-row-foot-placement").getAttribute("data-covered"),
    ).toBe("false");
  });

  it("updates coverage state when activities prop changes", () => {
    const goals = [{ leafId: "foot-placement" }];
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
    expect(
      screen.getByTestId("goal-row-foot-placement").getAttribute("data-covered"),
    ).toBe("false");

    rerender(
      <MemoryRouter>
        <GoalsProvider>
          <LoadSummaryBar
            activities={[
              makeActivity({ kind: "climb", intent_leaf_id: "foot-placement" }),
            ]}
            weekStart={WEEK_START}
            weekEnd={WEEK_END}
          />
        </GoalsProvider>
      </MemoryRouter>,
    );
    expect(
      screen.getByTestId("goal-row-foot-placement").getAttribute("data-covered"),
    ).toBe("true");
  });
});
