import "server-only";

import { getEnv } from "@/config/env";
import { getProviders } from "@/config/providers";
import { createDrizzleOtpChallengeRepository } from "@/lib/auth/otp/drizzle-challenges";
import { createDrizzleOtpUserRepository } from "@/lib/auth/otp/drizzle-users";
import type { OtpFlowDeps } from "@/lib/auth/otp/flow";
import { createOtpRateGate } from "@/lib/auth/otp/rate-limit";
import { createId } from "@/lib/id";
import type { Locale } from "@/lib/i18n/config";
import { isSmsConfigured, getSmsProvider } from "@/lib/sms/provider";

/**
 * Live OTP dependencies. Returns null when OTP_SECRET or MOBIPACE is missing
 * so password login can keep working.
 */
export function createOtpFlowDeps(
  locale: Locale,
  onAuthenticated: (userId: string) => Promise<void>,
): OtpFlowDeps | null {
  const secret = getEnv().OTP_SECRET;
  if (!secret || !isSmsConfigured()) {
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
