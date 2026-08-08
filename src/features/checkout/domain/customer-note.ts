/** Max length for a customer checkout order note (plain text). */
export const CUSTOMER_NOTE_MAX_LENGTH = 1_000;

/**
 * Sanitizes a customer checkout note to plain text.
 * Strips HTML/tags, preserves intentional newlines, returns null when empty.
 */
export function sanitizeCustomerNote(
  raw: string | null | undefined,
): string | null {
  if (!raw) {
    return null;
  }

  const cleaned = raw
    .replace(/\r\n/g, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/[<>&"]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, CUSTOMER_NOTE_MAX_LENGTH);

  return cleaned.length > 0 ? cleaned : null;
}
