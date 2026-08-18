/** Tidio widget public ids are alphanumeric; length varies by project. */
export const TIDIO_PUBLIC_KEY_PATTERN = /^[a-z0-9]{16,64}$/i;

const TIDIO_SCRIPT_ID_PATTERN = /code\.tidio\.co\/([a-z0-9]{16,64})\.js/i;

/**
 * Returns a trimmed Tidio public widget id, or `undefined` when missing/invalid.
 * Accepts the raw id or a `code.tidio.co/{id}.js` embed URL/snippet.
 * The value is public (frontend script id), not a secret.
 */
export function parseTidioPublicKey(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const fromUrl = trimmed.match(TIDIO_SCRIPT_ID_PATTERN);
  const candidate = fromUrl?.[1] ?? trimmed;
  if (!TIDIO_PUBLIC_KEY_PATTERN.test(candidate)) {
    return undefined;
  }

  return candidate;
}

/** Canonical Tidio embed URL for a validated public widget id. */
export function tidioWidgetScriptUrl(publicKey: string): string | undefined {
  const parsed = parseTidioPublicKey(publicKey);
  if (!parsed) {
    return undefined;
  }

  return `https://code.tidio.co/${parsed}.js`;
}
