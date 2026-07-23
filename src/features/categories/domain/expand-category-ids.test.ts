import { describe, expect, it } from "vitest";

import { expandCategoryIdsWithDescendants } from "@/features/categories/domain/expand-category-ids";

describe("expandCategoryIdsWithDescendants", () => {
  const tree = [
    { id: "root", parentId: null },
    { id: "child-a", parentId: "root" },
    { id: "child-b", parentId: "root" },
    { id: "grand-a", parentId: "child-a" },
    { id: "other", parentId: null },
  ];

  it("includes the root and all descendants", () => {
    expect(expandCategoryIdsWithDescendants(["root"], tree).sort()).toEqual([
      "child-a",
      "child-b",
      "grand-a",
      "root",
    ]);
  });

  it("includes only the selected branch for a child", () => {
    expect(expandCategoryIdsWithDescendants(["child-a"], tree).sort()).toEqual([
      "child-a",
      "grand-a",
    ]);
  });

  it("returns the leaf alone when it has no children", () => {
    expect(expandCategoryIdsWithDescendants(["grand-a"], tree)).toEqual([
      "grand-a",
    ]);
  });

  it("returns an empty list for empty roots", () => {
    expect(expandCategoryIdsWithDescendants([], tree)).toEqual([]);
  });
});
