/**
 * True when the URL targets a local Postgres (CI / docker), not Neon or remote.
 * Used to pick the `pg` TCP driver instead of Neon WebSocket/HTTP.
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
