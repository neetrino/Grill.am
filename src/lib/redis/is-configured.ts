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
