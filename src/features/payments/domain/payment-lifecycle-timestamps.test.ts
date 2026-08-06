import { describe, expect, it } from "vitest";

import { paymentLifecycleTimestampPatch } from "@/features/payments/domain/payment-lifecycle-timestamps";

describe("paymentLifecycleTimestampPatch", () => {
  const now = new Date("2026-08-06T12:00:00.000Z");

  it("sets captured_at once", () => {
    expect(
      paymentLifecycleTimestampPatch("CAPTURED", now, { capturedAt: null }),
    ).toEqual({ capturedAt: now });
    expect(
      paymentLifecycleTimestampPatch("CAPTURED", now, {
        capturedAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
    ).toEqual({});
  });

  it("sets failed_at and cancelled_at independently", () => {
    expect(
      paymentLifecycleTimestampPatch("FAILED", now, { failedAt: null }),
    ).toEqual({ failedAt: now });
    expect(
      paymentLifecycleTimestampPatch("CANCELLED", now, { cancelledAt: null }),
    ).toEqual({ cancelledAt: now });
  });
});
