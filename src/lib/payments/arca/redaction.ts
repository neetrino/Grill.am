const SENSITIVE_KEYS = new Set([
  "password",
  "userName",
  "username",
  "pan",
  "$pan",
  "cvc",
  "$cvc",
  "cvv",
  "cardholdername",
  "authorization",
]);

/** Redacts credential-like keys from nested structures for safe logging. */
export function redactSensitive(
  value: unknown,
  depth = 0,
): unknown {
  if (depth > 6) {
    return "[truncated]";
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item, depth + 1));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        out[key] = "[REDACTED]";
      } else {
        out[key] = redactSensitive(nested, depth + 1);
      }
    }
    return out;
  }
  if (typeof value === "string" && value.length > 256) {
    return `${value.slice(0, 32)}…[truncated]`;
  }
  return value;
}

/** Short stable fingerprint for provider references in logs. */
export function redactProviderReference(
  reference: string | null | undefined,
): string | null {
  if (!reference) {
    return null;
  }
  if (reference.length <= 8) {
    return "****";
  }
  return `${reference.slice(0, 4)}…${reference.slice(-4)}`;
}
