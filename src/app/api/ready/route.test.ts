import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/ready", () => {
  it("reports readiness without external dependencies", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: "white-shop",
    });
  });
});
