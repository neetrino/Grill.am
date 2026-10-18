export type UpstashRedisCredentials = {
  url: string;
  token: string;
};

/** True when Upstash REST URL and token are both present. */
export function isUpstashRedisConfigured(
  input: { url?: string; token?: string },
): input is UpstashRedisCredentials {
  return Boolean(input.url && input.token);
}

/**
 * Shared Redis required for production SMS rate limits and the MOBIPACE lock.
 * An in-memory adapter is not shared across instances.
 */
export function isSharedRedisConfigured(
  input: { url?: string; token?: string },
): input is UpstashRedisCredentials {
  return isUpstashRedisConfigured(input);
}
