import { normalizePhoneToE164 } from "@/lib/phone/normalize";

export type PhoneVerificationUpdate = {
  phone: string;
  phoneVerifiedAt: Date | null;
};

/**
 * Keeps verification only when the saved number is the same canonical phone.
 * Any real number change clears `phoneVerifiedAt`.
 */
export function resolvePhoneUpdate(input: {
  previousPhone: string | null;
  previousVerifiedAt: Date | null;
  nextPhone: string;
}): PhoneVerificationUpdate {
  const previousCanonical = input.previousPhone
    ? normalizePhoneToE164(input.previousPhone)
    : null;
  const sameNumber =
    previousCanonical !== null && previousCanonical === input.nextPhone;

  return {
    phone: input.nextPhone,
    phoneVerifiedAt:
      sameNumber && input.previousVerifiedAt ? input.previousVerifiedAt : null,
  };
}
