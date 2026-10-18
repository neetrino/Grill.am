import type { OtpUserRecord } from "@/lib/auth/otp/types";
import { normalizePhoneToE164 } from "@/lib/phone/normalize";

/**
 * SMS login is a credential only for a verified customer phone.
 * Staff keep the existing password login.
 */
export function isSmsLoginEligible(
  user: OtpUserRecord,
  phoneE164: string,
): boolean {
  if (user.role !== "CUSTOMER" || user.status !== "ACTIVE") {
    return false;
  }
  if (user.phoneVerifiedAt === null) {
    return false;
  }
  const current = user.phone ? normalizePhoneToE164(user.phone) : null;
  return current === phoneE164;
}
