import { afterEach, describe, expect, it, vi } from "vitest";

import { parseCrispWebsiteId } from "@/lib/crisp/website-id";
import { bootCrisp, CRISP_COLOR_THEME } from "@/lib/crisp/widget";

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

describe("bootCrisp", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("queues the red chatbox theme before the script loads", () => {
    const windowStub: Record<string, unknown> = {};
    vi.stubGlobal("window", windowStub);

    bootCrisp("73fbdb1d-9688-4d93-832a-eb7fdbac4e07", "hy");

    expect(CRISP_COLOR_THEME).toBe("red");
    expect(windowStub.$crisp).toEqual([
      ["config", "color:theme", [CRISP_COLOR_THEME]],
    ]);
  });
});
