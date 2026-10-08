/**
 * True when the URL targets a local Postgres (CI / docker).
 * Localhost uses node-postgres. Every other host uses the Neon serverless
 * driver (HTTP for queries, WebSocket for `withTransaction`).
 * This is not a general remote-Postgres switch: a non-Neon remote URL is
 * still treated as Neon. Production Grill.am uses Neon, so no extra
 * DATABASE_PROVIDER setting is required.
 */
export function isLocalDatabaseUrl(connectionString: string): boolean {
  try {
    const parsed = new URL(connectionString);
    const host = parsed.hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return /@(localhost|127\.0\.0\.1|\[::1\])[:/]/i.test(connectionString);
  }
}
