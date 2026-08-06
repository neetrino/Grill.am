import { describe, expect, it } from "vitest";

import { nextPaymentAttemptNumber } from "@/features/payments/domain/payment-attempt-number";

describe("nextPaymentAttemptNumber", () => {
  it("starts at 1 when no attempts exist", () => {
    expect(nextPaymentAttemptNumber(null)).toBe(1);
    expect(nextPaymentAttemptNumber(undefined)).toBe(1);
    expect(nextPaymentAttemptNumber(0)).toBe(1);
  });

  it("increments from the current max", () => {
    expect(nextPaymentAttemptNumber(1)).toBe(2);
    expect(nextPaymentAttemptNumber(4)).toBe(5);
  });
});
