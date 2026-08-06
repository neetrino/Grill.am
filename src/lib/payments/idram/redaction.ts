const SENSITIVE_KEYS = new Set([
  "secret",
  "secret_key",
  "idram_secret_key",
  "edp_checksum",
  "edp_payer_account",
  "password",
]);

/** Redacts secret/payer fields from nested structures for safe logging. */
export function redactIdramSensitive(value: unknown, depth = 0): unknown {
  if (depth > 6) {
    return "[truncated]";
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactIdramSensitive(item, depth + 1));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        out[key] = "[REDACTED]";
      } else {
        out[key] = redactIdramSensitive(nested, depth + 1);
      }
    }
    return out;
  }
  return value;
}

export function redactBillNumber(billNo: string | null | undefined): string | null {
  if (!billNo) return null;
  if (billNo.length <= 6) return "****";
  return `${billNo.slice(0, 3)}…${billNo.slice(-3)}`;
}

export function redactTransId(transId: string | null | undefined): string | null {
  if (!transId) return null;
  if (transId.length <= 4) return "****";
  return `${transId.slice(0, 2)}…${transId.slice(-2)}`;
}
