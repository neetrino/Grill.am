/**
 * MOBIPACE recipients are international digits without a leading + or 00.
 * Call this only from the SMS provider.
 */
export function toMobipaceRecipient(e164: string): string | null {
  if (!e164.startsWith("+")) {
    return null;
  }

  const digits = e164.slice(1);
  if (!/^[1-9]\d{7,14}$/.test(digits)) {
    return null;
  }

  return digits;
}
