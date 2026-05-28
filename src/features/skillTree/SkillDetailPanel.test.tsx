import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SkillDetailPanel } from "./SkillDetailPanel";
import { GoalsProvider } from "../../contexts/GoalsContext";
import type { Goal, TreeLeaf } from "../../types";

const FOOTWORK_LEAF: TreeLeaf = {
  id: "foot-placement",
  label: "Foot Placement",
  description: "Develop precise foot placement.",
  allowedKinds: ["climb"],
};

function renderPanel(opts: { leaf?: TreeLeaf; initialGoals?: Goal[] } = {}) {
  const { leaf = FOOTWORK_LEAF, initialGoals = [] } = opts;
  if (initialGoals.length > 0) {
    localStorage.setItem("volume:goals", JSON.stringify(initialGoals));
  }
  const onClose = vi.fn();
  render(
    <GoalsProvider>
      <SkillDetailPanel leaf={leaf} categoryColor="#F5A623" onClose={onClose} />
    </GoalsProvider>,
  );
  return { onClose, user: userEvent.setup() };
}

beforeEach(() => {
  localStorage.clear();
});

describe("SkillDetailPanel goal lifecycle", () => {
  it("renders Set as Goal when the leaf is not yet a goal", () => {
    renderPanel();
    expect(screen.getByRole("button", { name: /set as goal/i })).toBeTruthy();
  });

  it("clicking Set as Goal flips the button to Remove Goal and persists the goal", async () => {
    const { user } = renderPanel();
    await user.click(screen.getByRole("button", { name: /set as goal/i }));
    expect(screen.getByRole("button", { name: /remove goal/i })).toBeTruthy();
    const stored = JSON.parse(localStorage.getItem("volume:goals") ?? "[]");
    expect(stored).toEqual([{ leafId: "foot-placement" }]);
  });

  it("clicking Remove Goal flips back to Set as Goal and clears the stored goal", async () => {
    const { user } = renderPanel({ initialGoals: [{ leafId: "foot-placement" }] });
    expect(screen.getByRole("button", { name: /remove goal/i })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /remove goal/i }));
    expect(screen.getByRole("button", { name: /set as goal/i })).toBeTruthy();
    const stored = JSON.parse(localStorage.getItem("volume:goals") ?? "[]");
    expect(stored).toEqual([]);
  });

  it("disables the Set button when the user already has 5 goals", () => {
    renderPanel({
      initialGoals: [
        { leafId: "balance-weight-shifting" },
        { leafId: "dynamic-movement" },
        { leafId: "hip-mobility" },
        { leafId: "shoulder-mobility" },
        { leafId: "max-finger-strength" },
      ],
    });
    const btn = screen.getByRole("button", { name: /goals full/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("still allows Remove Goal when at the 5-goal cap if the panel's leaf is one of the goals", async () => {
    const { user } = renderPanel({
      initialGoals: [
        { leafId: "foot-placement" },
        { leafId: "balance-weight-shifting" },
        { leafId: "dynamic-movement" },
        { leafId: "hip-mobility" },
        { leafId: "shoulder-mobility" },
      ],
    });
    const btn = screen.getByRole("button", { name: /remove goal/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    await user.click(btn);
    const stored = JSON.parse(localStorage.getItem("volume:goals") ?? "[]");
    expect(stored.some((g: Goal) => g.leafId === "footwork")).toBe(false);
    expect(stored).toHaveLength(4);
  });
});
