import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { HEALTH_SERVICE_NAME } from "./constants";
import { GET } from "./route";

describe("GET /api/health", () => {
  it("reports runtime health without external dependencies", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const body = (await response.json()) as {
      status: string;
      service: string;
      timestamp: string;
    };

    expect(body.status).toBe("ok");
    expect(body.service).toBe(HEALTH_SERVICE_NAME);
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(body).not.toHaveProperty("database");
  });

  it("does not import database or external clients", () => {
    const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

    expect(source).not.toMatch(
      /prisma|drizzle|getDb|neon|redis|upstash|@aws-sdk|fetch\(/i,
    );
  });
});
