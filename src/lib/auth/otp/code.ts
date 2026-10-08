import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import { OTP_LENGTH, type OtpPurpose } from "@/lib/auth/otp/constants";

/** Cryptographically secure 6-digit numeric OTP. Never log the result. */
export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(OTP_LENGTH, "0");
}

export type OtpHashInput = {
  secret: string;
  challengeId: string;
  phone: string;
  purpose: OtpPurpose;
  code: string;
};

/**
 * HMAC-SHA256 over challenge id, phone, purpose, and code.
 * A bare SHA-256 of a 6-digit code is not enough.
 */
export function hashOtpCode(input: OtpHashInput): string {
  const payload = [
    input.challengeId,
    input.phone,
    input.purpose,
    input.code,
  ].join(":");

  return createHmac("sha256", input.secret).update(payload).digest("hex");
}

/** Constant-time compare of two hex HMAC digests. */
export function otpHashesMatch(storedHex: string, computedHex: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(storedHex) || !/^[a-f0-9]{64}$/i.test(computedHex)) {
    return false;
  }

  const stored = Buffer.from(storedHex, "hex");
  const computed = Buffer.from(computedHex, "hex");
  return timingSafeEqual(stored, computed);
}
