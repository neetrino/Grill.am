const CRISP_WEBSITE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Returns a Crisp website id, or `undefined` when missing/invalid. */
export function parseCrispWebsiteId(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!CRISP_WEBSITE_ID_PATTERN.test(trimmed)) {
    return undefined;
  }
  return trimmed.toLowerCase();
}
