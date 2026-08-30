import { describe, expect, it } from "vitest";

import { isUpstashRedisConfigured } from "@/lib/redis/is-configured";

describe("isUpstashRedisConfigured", () => {
  it("requires both url and token", () => {
    expect(isUpstashRedisConfigured({})).toBe(false);
    expect(isUpstashRedisConfigured({ url: "https://example.upstash.io" })).toBe(
      false,
    );
    expect(isUpstashRedisConfigured({ token: "token" })).toBe(false);
    expect(
      isUpstashRedisConfigured({
        url: "https://example.upstash.io",
        token: "token",
      }),
    ).toBe(true);
  });
});
