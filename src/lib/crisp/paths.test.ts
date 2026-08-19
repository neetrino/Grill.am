import { describe, expect, it } from "vitest";

import { isCrispEnabledPath } from "@/lib/crisp/paths";

describe("isCrispEnabledPath", () => {
  it("allows storefront routes", () => {
    expect(isCrispEnabledPath("/hy", "hy")).toBe(true);
    expect(isCrispEnabledPath("/hy/products", "hy")).toBe(true);
    expect(isCrispEnabledPath("/en/checkout", "en")).toBe(true);
  });

  it("hides the widget on admin routes", () => {
    expect(isCrispEnabledPath("/hy/admin", "hy")).toBe(false);
    expect(isCrispEnabledPath("/hy/admin/orders", "hy")).toBe(false);
  });
});
