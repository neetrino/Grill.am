import { describe, expect, it } from "vitest";

import { generateOtpCode, hashOtpCode, otpHashesMatch } from "@/lib/auth/otp/code";

const secret = "otp-secret-with-enough-length-32b";

describe("OTP codes", () => {
  it("generates exactly six numeric digits", () => {
    for (let index = 0; index < 40; index += 1) {
      expect(generateOtpCode()).toMatch(/^\d{6}$/);
    }
  });

  it("hashes with purpose and phone so a code cannot cross purposes", () => {
    const login = hashOtpCode({
      secret,
      challengeId: "challenge-1",
      phone: "+37499123456",
      purpose: "LOGIN",
      code: "483921",
    });
    const verify = hashOtpCode({
      secret,
      challengeId: "challenge-1",
      phone: "+37499123456",
      purpose: "VERIFY_PHONE",
      code: "483921",
    });

    expect(login).toMatch(/^[a-f0-9]{64}$/);
    expect(login).not.toBe("483921");
    expect(login).not.toBe(verify);
    expect(otpHashesMatch(login, login)).toBe(true);
    expect(otpHashesMatch(login, verify)).toBe(false);
    expect(otpHashesMatch("short", login)).toBe(false);
  });
});
