import { beforeEach, describe, expect, it, vi } from "vitest";

const { executeMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
}));

vi.mock("@/db/client", () => ({
  getDb: () => ({ execute: executeMock }),
}));

import { GET } from "./route";

describe("GET /api/health/deep", () => {
  beforeEach(() => {
    executeMock.mockReset();
  });

  it("reports the database when the probe succeeds", async () => {
    executeMock.mockResolvedValueOnce([]);

    const response = await GET();
    const body = (await response.json()) as {
      status: string;
      service: string;
      database: string;
      timestamp: string;
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toMatchObject({
      status: "ok",
      service: "grill",
      database: "ok",
    });
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns 503 when the database probe fails", async () => {
    executeMock.mockRejectedValueOnce(new Error("connection refused"));

    const response = await GET();
    const body = (await response.json()) as { status: string; database: string };

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      status: "error",
      database: "error",
    });
  });
});
