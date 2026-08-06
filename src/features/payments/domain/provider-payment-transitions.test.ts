import { describe, expect, it } from "vitest";

import {
  canProviderTransitionPaymentStatus,
  getEligibleProviderPaymentStatuses,
} from "@/features/payments/domain/provider-payment-transitions";

describe("provider payment transitions", () => {
  it("allows PENDING → CAPTURED / FAILED / CANCELLED", () => {
    expect(canProviderTransitionPaymentStatus("PENDING", "CAPTURED")).toBe(
      true,
    );
    expect(canProviderTransitionPaymentStatus("PENDING", "FAILED")).toBe(true);
    expect(canProviderTransitionPaymentStatus("PENDING", "CANCELLED")).toBe(
      true,
    );
  });

  it("rejects capture of FAILED or CANCELLED on the same attempt", () => {
    expect(canProviderTransitionPaymentStatus("FAILED", "CAPTURED")).toBe(
      false,
    );
    expect(canProviderTransitionPaymentStatus("CANCELLED", "CAPTURED")).toBe(
      false,
    );
  });

  it("never downgrades CAPTURED", () => {
    expect(getEligibleProviderPaymentStatuses("CAPTURED")).toEqual([]);
    expect(canProviderTransitionPaymentStatus("CAPTURED", "FAILED")).toBe(
      false,
    );
    expect(canProviderTransitionPaymentStatus("CAPTURED", "PENDING")).toBe(
      false,
    );
  });
});
