/** Detects PostgreSQL unique_violation (23505). */
export function isUniqueViolation(error: unknown): boolean {
  const code = extractPostgresCode(error);
  return code === "23505";
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
