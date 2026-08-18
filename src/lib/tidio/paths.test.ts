import { describe, expect, it } from "vitest";

import { isTidioEnabledPath } from "@/lib/tidio/paths";

describe("isTidioEnabledPath", () => {
  it("allows storefront routes", () => {
    expect(isTidioEnabledPath("/hy", "hy")).toBe(true);
    expect(isTidioEnabledPath("/hy/products", "hy")).toBe(true);
    expect(isTidioEnabledPath("/en/checkout", "en")).toBe(true);
  });

  it("hides the widget on admin routes", () => {
    expect(isTidioEnabledPath("/hy/admin", "hy")).toBe(false);
    expect(isTidioEnabledPath("/hy/admin/orders", "hy")).toBe(false);
  });
});
