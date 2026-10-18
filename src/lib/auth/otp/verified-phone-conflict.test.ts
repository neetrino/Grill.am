import { describe, expect, it } from "vitest";

import { isVerifiedPhoneOwnershipConflict } from "@/lib/auth/otp/verified-phone-conflict";

describe("verified phone ownership conflicts", () => {
  it("maps the verified-phone unique violation to a domain conflict", () => {
    expect(
      isVerifiedPhoneOwnershipConflict({
        code: "23505",
        constraint: "users_verified_phone_uidx",
      }),
    ).toBe(true);
  });

  it("maps a nameless unique violation from this update to a domain conflict", () => {
    expect(isVerifiedPhoneOwnershipConflict({ code: "23505" })).toBe(true);
    expect(
      isVerifiedPhoneOwnershipConflict({
        message: "update failed",
        cause: { code: "23505" },
      }),
    ).toBe(true);
  });

  it("does not hide a different unique constraint or other database errors", () => {
    expect(
      isVerifiedPhoneOwnershipConflict({
        code: "23505",
        constraint: "users_email_uidx",
      }),
    ).toBe(false);
    expect(isVerifiedPhoneOwnershipConflict({ code: "23503" })).toBe(false);
    expect(isVerifiedPhoneOwnershipConflict(new Error("connection reset"))).toBe(
      false,
    );
  });
});
