import "server-only";

import { getEnv } from "@/config/env";
import { getProviders } from "@/config/providers";
import { createDrizzleOtpChallengeRepository } from "@/lib/auth/otp/drizzle-challenges";
import { createDrizzleOtpUserRepository } from "@/lib/auth/otp/drizzle-users";
import type { OtpFlowDeps } from "@/lib/auth/otp/flow";
import { createOtpRateGate } from "@/lib/auth/otp/rate-limit";
import { createId } from "@/lib/id";
import type { Locale } from "@/lib/i18n/config";
import { isSharedRedisConfigured } from "@/lib/redis/is-configured";
import { isSmsOtpRuntimeAvailable } from "@/lib/sms/availability";
import { isSmsConfigured, getSmsProvider } from "@/lib/sms/provider";

/**
 * Live OTP dependencies. Returns null when SMS OTP cannot run, including
 * production without shared Redis, so password login keeps working.
 */
export function createOtpFlowDeps(
  locale: Locale,
  onAuthenticated: (userId: string) => Promise<void>,
): OtpFlowDeps | null {
  const env = getEnv();
  const secret = env.OTP_SECRET;
  if (
    !isSmsOtpRuntimeAvailable({
      nodeEnv: env.NODE_ENV,
      otpSecret: secret,
      smsConfigured: isSmsConfigured(),
      sharedRedisConfigured: isSharedRedisConfigured({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      }),
    }) ||
    !secret
  ) {
    return null;
  }

  return {
    secret,
    locale,
    now: () => new Date(),
    createId,
    challenges: createDrizzleOtpChallengeRepository(),
    users: createDrizzleOtpUserRepository(),
    sms: getSmsProvider(),
    rateLimit: createOtpRateGate(getProviders().redis.getClient(), secret),
    onAuthenticated,
  };
}
