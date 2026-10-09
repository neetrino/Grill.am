/**
 * Synthetic identity for customers created via SMS OTP signup
 * before they optionally fill real profile fields.
 */

/** Stable unique email derived from the verified E.164 phone. */
export function smsPlaceholderEmail(phoneE164: string): string {
  return `sms.${phoneE164.replace(/\D/g, "")}@phone.local`;
}

/** Whether the address is an SMS-signup placeholder (not a real inbox). */
export function isSmsPlaceholderEmail(email: string): boolean {
  return /^sms\.\d+@phone\.local$/i.test(email.trim());
}
