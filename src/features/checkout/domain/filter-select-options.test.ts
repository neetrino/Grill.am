import { describe, expect, it } from "vitest";

import { filterSelectOptions } from "@/features/checkout/domain/filter-select-options";

const stores = [
  { value: "khorenatsi-95-2", label: "Khorenatsi 95/2" },
  { value: "pushkin-43-3", label: "Pushkin 43/3" },
  { value: "baghramyan-50-5", label: "Baghramyan 50/5" },
] as const;

describe("filterSelectOptions", () => {
  it("returns all options when the query is empty", () => {
    expect(filterSelectOptions(stores, "")).toEqual([...stores]);
    expect(filterSelectOptions(stores, "   ")).toEqual([...stores]);
  });

  it("matches labels case-insensitively", () => {
    expect(filterSelectOptions(stores, "push")).toEqual([stores[1]]);
    expect(filterSelectOptions(stores, "BAGH")).toEqual([stores[2]]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterSelectOptions(stores, "isakov")).toEqual([]);
  });
});
