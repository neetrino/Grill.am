import { describe, expect, it } from "vitest";

import {
  ARCA_REFUND_CLAIM_TTL_MS,
  isArcaRefundClaimActive,
} from "@/features/payments/domain/arca-refund-claim";

describe("isArcaRefundClaimActive", () => {
  it("is inactive when no claim exists", () => {
    expect(isArcaRefundClaimActive(undefined, 1_000)).toBe(false);
  });

  it("is active inside the TTL window", () => {
    const claimedAt = new Date(1_000).toISOString();
    expect(
      isArcaRefundClaimActive(claimedAt, 1_000 + ARCA_REFUND_CLAIM_TTL_MS - 1),
    ).toBe(true);
  });

  it("expires after the TTL window", () => {
    const claimedAt = new Date(1_000).toISOString();
    expect(
      isArcaRefundClaimActive(claimedAt, 1_000 + ARCA_REFUND_CLAIM_TTL_MS),
    ).toBe(false);
  });
});
