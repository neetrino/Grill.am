/**
 * SMS transport may use the in-memory Redis adapter in development and tests.
 * Production must have shared Upstash so rate limits and the MOBIPACE lock
 * are not split per instance. Password login does not call this.
 */
export function isSmsTransportAvailable(input: {
  nodeEnv: string;
  smsConfigured: boolean;
  sharedRedisConfigured: boolean;
}): boolean {
  if (!input.smsConfigured) {
    return false;
  }
  if (input.nodeEnv === "production" && !input.sharedRedisConfigured) {
    return false;
  }
  return true;
}

/** OTP flows also need the server HMAC secret. */
export function isSmsOtpRuntimeAvailable(input: {
  nodeEnv: string;
  otpSecret?: string;
  smsConfigured: boolean;
  sharedRedisConfigured: boolean;
}): boolean {
  if (!input.otpSecret) {
    return false;
  }
  return isSmsTransportAvailable(input);
}
