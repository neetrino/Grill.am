import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveOperatorEmail } from "@/features/notifications/application/send-order-emails";

vi.mock("@/config/env", () => ({
  getEnv: () => ({
    ADMIN_EMAIL: process.env.__TEST_ADMIN_EMAIL || undefined,
    RESEND_API_KEY: undefined,
    EMAIL_FROM: undefined,
  }),
}));

describe("resolveOperatorEmail", () => {
  afterEach(() => {
    delete process.env.__TEST_ADMIN_EMAIL;
    delete process.env.OPS_ALERT_EMAIL;
  });

  it("prefers ADMIN_EMAIL over OPS_ALERT_EMAIL", () => {
    process.env.__TEST_ADMIN_EMAIL = "admin@example.com";
    process.env.OPS_ALERT_EMAIL = "ops@example.com";
    expect(resolveOperatorEmail()).toBe("admin@example.com");
  });

  it("falls back to OPS_ALERT_EMAIL", () => {
    process.env.OPS_ALERT_EMAIL = "ops@example.com";
    expect(resolveOperatorEmail()).toBe("ops@example.com");
  });

  it("returns undefined when neither is set", () => {
    expect(resolveOperatorEmail()).toBeUndefined();
  });
});
