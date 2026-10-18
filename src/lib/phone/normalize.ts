import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

const DEFAULT_COUNTRY: CountryCode = "AM";

/**
 * Canonical phone value stored and compared by Grill.am.
 * Accepts local Armenian input such as `099123456` when the default region is AM.
 */
export function normalizePhoneToE164(
  input: string,
  defaultCountry: CountryCode = DEFAULT_COUNTRY,
): string | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 40) {
    return null;
  }

  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (!parsed?.isValid()) {
    return null;
  }

  return parsed.number;
}

/** Raw stored values that should match one canonical E.164 number. */
export function phoneLookupCandidates(e164: string): string[] {
  const parsed = parsePhoneNumberFromString(e164);
  if (!parsed?.isValid()) {
    return [e164];
  }

  const international = parsed.number.slice(1);
  const national = String(parsed.nationalNumber);
  return uniqueStrings([
    parsed.number,
    international,
    `00${international}`,
    national,
    `0${national}`,
  ]);
}

/** Digit-only forms used to match legacy phones that contain spaces or dashes. */
export function phoneMatchDigits(e164: string): string[] {
  const parsed = parsePhoneNumberFromString(e164);
  if (!parsed?.isValid()) {
    return [];
  }

  const international = parsed.number.slice(1);
  const national = String(parsed.nationalNumber);
  return uniqueStrings([international, national, `0${national}`]);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}
