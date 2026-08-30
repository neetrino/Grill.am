import { afterEach, describe, expect, it } from "vitest";

import {
  canPrerenderProductParams,
  listProductStaticParams,
} from "@/features/products/application/list-product-static-params";

describe("listProductStaticParams", () => {
  const previous = process.env.DATABASE_URL;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.DATABASE_URL;
      return;
    }
    process.env.DATABASE_URL = previous;
  });

  it("does not prerender when DATABASE_URL is missing", () => {
    expect(canPrerenderProductParams(undefined)).toBe(false);
    expect(canPrerenderProductParams("")).toBe(false);
    expect(canPrerenderProductParams("  ")).toBe(false);
  });

  it("returns no paths without hitting the database in CI", async () => {
    delete process.env.DATABASE_URL;
    await expect(listProductStaticParams()).resolves.toEqual([]);
  });
});
