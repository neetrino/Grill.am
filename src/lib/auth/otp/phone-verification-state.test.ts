import { describe, expect, it } from "vitest";

import { resolvePhoneUpdate } from "@/lib/auth/otp/phone-verification-state";

const verifiedAt = new Date("2026-10-08T12:00:00.000Z");

describe("resolvePhoneUpdate", () => {
  it("keeps verification when the canonical number does not change", () => {
    expect(
      resolvePhoneUpdate({
        previousPhone: "099123456",
        previousVerifiedAt: verifiedAt,
        nextPhone: "+37499123456",
      }),
    ).toEqual({ phone: "+37499123456", phoneVerifiedAt: verifiedAt });
  });

  it("clears verification when the phone changes", () => {
    expect(
      resolvePhoneUpdate({
        previousPhone: "+37499123456",
        previousVerifiedAt: verifiedAt,
        nextPhone: "+37491123456",
      }),
    ).toEqual({ phone: "+37491123456", phoneVerifiedAt: null });
  });

  it("does not mark a newly saved number verified", () => {
    expect(
      resolvePhoneUpdate({
        previousPhone: null,
        previousVerifiedAt: null,
        nextPhone: "+37499123456",
      }).phoneVerifiedAt,
    ).toBeNull();
  });
});
