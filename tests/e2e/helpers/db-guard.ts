import "dotenv/config";

/**
 * Refuses unsafe E2E database URLs. Never prints the URL.
 */
export function assertSafeE2eDatabaseUrl(url: string): void {
  const lower = url.toLowerCase();
  if (
    (lower.includes("prod") || lower.includes("production")) &&
    !lower.includes("test") &&
    !lower.includes("e2e")
  ) {
    throw new Error(
      "Refusing E2E against a production-looking database URL.",
    );
  }

  if (!/test|e2e/i.test(url) && process.env.E2E_ALLOW_DEV_DB !== "true") {
    throw new Error(
      "E2E_DATABASE_URL must contain 'test' or 'e2e', or set E2E_ALLOW_DEV_DB=true for an explicit local exception.",
    );
  }

  if (process.env.E2E_PROVIDER_MODE === "live") {
    throw new Error("E2E_PROVIDER_MODE=live is forbidden.");
  }

  if (process.env.E2E_EMAIL_MODE === "live") {
    throw new Error("E2E_EMAIL_MODE=live is forbidden.");
  }
}

export function resolveE2eDatabaseUrl(): string {
  const url =
    process.env.E2E_DATABASE_URL?.trim() ||
    process.env.TEST_DATABASE_URL?.trim() ||
    (process.env.E2E_ALLOW_DEV_DB === "true"
      ? process.env.DATABASE_URL?.trim()
      : undefined);

  if (!url) {
    throw new Error(
      "E2E_DATABASE_URL (or TEST_DATABASE_URL) is required for E2E prepare.",
    );
  }

  assertSafeE2eDatabaseUrl(url);
  return url;
}
