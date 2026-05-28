import { describe, it, expect } from "vitest";
import { isLeaf } from "./tree";
import type { TreeLeaf } from "../types";

describe("isLeaf", () => {
  it("returns true for a leaf node", () => {
    expect(isLeaf({ id: "x", label: "X", allowedKinds: ["climb"] })).toBe(true);
  });
  it("returns false for a branch node", () => {
    expect(isLeaf({ id: "x", label: "X", children: [] })).toBe(false);
  });
});

describe("TreeLeaf description field", () => {
  it("accepts optional description", () => {
    const node: TreeLeaf = { id: "x", label: "X", description: "Test desc", allowedKinds: ["climb"] };
    expect(node.description).toBe("Test desc");
  });
  it("description is optional", () => {
    const node: TreeLeaf = { id: "y", label: "Y", allowedKinds: ["climb"] };
    expect(node.description).toBeUndefined();
  });
});
