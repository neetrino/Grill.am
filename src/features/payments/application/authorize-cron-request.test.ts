import { describe, expect, it } from "vitest";

import { authorizeCronRequest } from "@/features/payments/application/authorize-cron-request";

describe("authorizeCronRequest", () => {
  it("rejects when CRON_SECRET is unset", () => {
    const previous = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;
    const request = new Request("http://localhost/cron", {
      headers: { Authorization: "Bearer anything" },
    });
    expect(authorizeCronRequest(request)).toBe(false);
    if (previous === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = previous;
    }
  });

  it("accepts matching bearer token", () => {
    const previous = process.env.CRON_SECRET;
    process.env.CRON_SECRET = "test-cron-secret";
    const request = new Request("http://localhost/cron", {
      headers: { Authorization: "Bearer test-cron-secret" },
    });
    expect(authorizeCronRequest(request)).toBe(true);
    if (previous === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = previous;
    }
  });

  it("rejects mismatched bearer token", () => {
    const previous = process.env.CRON_SECRET;
    process.env.CRON_SECRET = "test-cron-secret";
    const request = new Request("http://localhost/cron", {
      headers: { Authorization: "Bearer wrong" },
    });
    expect(authorizeCronRequest(request)).toBe(false);
    if (previous === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = previous;
    }
  });
});
