import { describe, expect, it } from "vitest";

import { parseCrispWebsiteId } from "@/lib/crisp/website-id";

describe("parseCrispWebsiteId", () => {
  it("accepts a UUID website id", () => {
    expect(parseCrispWebsiteId("73fbdb1d-9688-4d93-832a-eb7fdbac4e07")).toBe(
      "73fbdb1d-9688-4d93-832a-eb7fdbac4e07",
    );
  });

  it("rejects empty or malformed values", () => {
    expect(parseCrispWebsiteId("")).toBeUndefined();
    expect(parseCrispWebsiteId("not-a-uuid")).toBeUndefined();
  });
});
