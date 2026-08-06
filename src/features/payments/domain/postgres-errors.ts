/**
 * Detects PostgreSQL unique_violation (23505), optionally for a constraint name.
 */
export function isUniqueViolation(
  error: unknown,
  constraintName?: string,
): boolean {
  const code = extractPostgresCode(error);
  if (code !== "23505") {
    return false;
  }
  if (!constraintName) {
    return true;
  }
  const name = extractConstraintName(error);
  return name === constraintName;
}

function extractPostgresCode(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }
  const record = error as Record<string, unknown>;
  if (typeof record.code === "string") {
    return record.code;
  }
  if (record.cause && typeof record.cause === "object") {
    const cause = record.cause as Record<string, unknown>;
    if (typeof cause.code === "string") {
      return cause.code;
    }
  }
  return null;
}

function extractConstraintName(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }
  const record = error as Record<string, unknown>;
  if (typeof record.constraint === "string") {
    return record.constraint;
  }
  if (record.cause && typeof record.cause === "object") {
    const cause = record.cause as Record<string, unknown>;
    if (typeof cause.constraint === "string") {
      return cause.constraint;
    }
  }
  const message =
    error instanceof Error
      ? error.message
      : typeof record.message === "string"
        ? record.message
        : "";
  const match = /constraint \"([^\"]+)\"/i.exec(message);
  return match?.[1] ?? null;
}

export const PAYMENTS_ORDER_ATTEMPT_UIDX = "payments_order_attempt_uidx";
export const PAYMENTS_PROVIDER_REF_UIDX = "payments_provider_ref_uidx";
export const PAYMENTS_ONE_CAPTURED_UIDX = "payments_one_captured_per_order_uidx";
