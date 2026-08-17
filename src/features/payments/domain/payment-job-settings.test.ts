import { describe, expect, it } from "vitest";

import {
  DEFAULT_PAYMENT_PENDING_TIMEOUT_MINUTES,
  DEFAULT_PAYMENT_RECONCILE_INTERVAL_MINUTES,
  parsePaymentJobSettings,
  pendingTimeoutMsFromMinutes,
} from "@/features/payments/domain/payment-job-settings";

describe("payment job settings", () => {
  it("defaults to twice-hourly reconcile and 60m pending TTL", () => {
    expect(parsePaymentJobSettings({})).toEqual({
      reconcileIntervalMinutes: DEFAULT_PAYMENT_RECONCILE_INTERVAL_MINUTES,
      pendingTimeoutMinutes: DEFAULT_PAYMENT_PENDING_TIMEOUT_MINUTES,
    });
    expect(pendingTimeoutMsFromMinutes(60)).toBe(60 * 60 * 1000);
  });

  it("parses explicit minute values", () => {
    expect(
      parsePaymentJobSettings({
        reconcileIntervalMinutes: "30",
        pendingTimeoutMinutes: "60",
      }),
    ).toEqual({
      reconcileIntervalMinutes: 30,
      pendingTimeoutMinutes: 60,
    });
  });

  it("rejects out-of-range values", () => {
    expect(() =>
      parsePaymentJobSettings({ reconcileIntervalMinutes: "1" }),
    ).toThrow(/PAYMENT_RECONCILE_INTERVAL_MINUTES/);
    expect(() =>
      parsePaymentJobSettings({ pendingTimeoutMinutes: "5" }),
    ).toThrow(/PAYMENT_PENDING_TIMEOUT_MINUTES/);
  });
});
