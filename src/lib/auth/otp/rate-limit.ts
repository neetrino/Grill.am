import { createHmac } from "node:crypto";

import {
  DEFAULT_OTP_RATE_LIMITS,
  type OtpRateLimitConfig,
} from "@/lib/auth/otp/constants";
import type { OtpRateGate, RateLimitDecision } from "@/lib/auth/otp/types";
import { logger } from "@/lib/observability/logger";
import type { RedisClient } from "@/lib/redis/types";

const CLOSED: RateLimitDecision = { ok: false, retryAfterSeconds: 60 };

/**
 * Fixed-window SMS limits on the existing Redis adapter.
 * Fails closed when Redis cannot be updated so a limiter outage cannot send SMS.
 */
export function createOtpRateGate(
  redis: RedisClient,
  secret: string,
  config: OtpRateLimitConfig = DEFAULT_OTP_RATE_LIMITS,
): OtpRateGate {
  const phoneHash = (phone: string): string =>
    createHmac("sha256", secret).update(`phone:${phone}`).digest("hex");
  const ipHash = (ip: string): string =>
    createHmac("sha256", secret).update(`ip:${ip}`).digest("hex");

  return {
    async consumeSend({ phone, ip, purpose, now }) {
      try {
        const ipDecision = await hitWindow(
          redis,
          windowKey("otp:send:ip", ipHash(ip), now, config.sendIpWindowSeconds),
          config.sendIpLimit,
          config.sendIpWindowSeconds,
        );
        if (!ipDecision.ok) {
          return ipDecision;
        }

        const phoneDecision = await hitWindow(
          redis,
          windowKey(
            `otp:send:phone:${purpose}`,
            phoneHash(phone),
            now,
            config.sendPhoneWindowSeconds,
          ),
          config.sendPhoneLimit,
          config.sendPhoneWindowSeconds,
        );
        if (!phoneDecision.ok) {
          return phoneDecision;
        }

        const cooldownKey = `otp:cooldown:${purpose}:${phoneHash(phone)}`;
        const reserved = await redis.set(cooldownKey, "1", {
          nx: true,
          ex: config.resendCooldownSeconds,
        });
        if (reserved !== "OK") {
          return {
            ok: false,
            retryAfterSeconds: config.resendCooldownSeconds,
          };
        }

        return { ok: true };
      } catch {
        logger.warn("otp.rate_limit_failed", { op: "send" });
        return CLOSED;
      }
    },

    async consumeVerify({ phone, ip, now }) {
      try {
        const ipDecision = await hitWindow(
          redis,
          windowKey(
            "otp:verify:ip",
            ipHash(ip),
            now,
            config.verifyIpWindowSeconds,
          ),
          config.verifyIpLimit,
          config.verifyIpWindowSeconds,
        );
        if (!ipDecision.ok) {
          return ipDecision;
        }

        return hitWindow(
          redis,
          windowKey(
            "otp:verify:phone",
            phoneHash(phone),
            now,
            config.verifyPhoneWindowSeconds,
          ),
          config.verifyPhoneLimit,
          config.verifyPhoneWindowSeconds,
        );
      } catch {
        logger.warn("otp.rate_limit_failed", { op: "verify" });
        return CLOSED;
      }
    },

    async clearSendCooldown({ phone, purpose }) {
      try {
        await redis.del(`otp:cooldown:${purpose}:${phoneHash(phone)}`);
      } catch {
        logger.warn("otp.rate_limit_failed", { op: "clear_cooldown" });
      }
    },
  };
}

function windowKey(
  prefix: string,
  id: string,
  now: Date,
  windowSeconds: number,
): string {
  const bucket = Math.floor(now.getTime() / 1000 / windowSeconds);
  return `${prefix}:${id}:${bucket}`;
}

async function hitWindow(
  redis: RedisClient,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitDecision> {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }

  if (count > limit) {
    return { ok: false, retryAfterSeconds: windowSeconds };
  }

  return { ok: true };
}
