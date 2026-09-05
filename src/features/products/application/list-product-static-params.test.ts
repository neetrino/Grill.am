import { describe, expect, it } from "vitest";

import { listProductStaticParams } from "@/features/products/application/list-product-static-params";

describe("listProductStaticParams", () => {
  it("does not prerender the catalog at build time", () => {
    expect(listProductStaticParams()).toEqual([]);
  });
});
