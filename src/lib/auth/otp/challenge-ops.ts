import { logger } from "@/lib/observability/logger";
import { SmsTransportError } from "@/lib/sms/errors";

import { generateOtpCode, hashOtpCode, otpHashesMatch } from "@/lib/auth/otp/code";
import {
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MS,
  type OtpPurpose,
} from "@/lib/auth/otp/constants";
import { buildOtpSmsText } from "@/lib/auth/otp/sms-text";
import type {
  OtpChallengeRecord,
  OtpFlowDeps,
  OtpRequestResult,
  OtpVerifyFailureCause,
} from "@/lib/auth/otp/types";

type ChallengeCheck =
  | { ok: true; userId: string | null; phone: string }
  | { ok: false; code: "invalid_code"; cause: OtpVerifyFailureCause };

/** Issues one active challenge and sends it. Failures never return the code. */
export async function sendChallenge(
  deps: OtpFlowDeps,
  input: {
    phone: string;
    purpose: OtpPurpose;
    /** Null for SMS signup challenges before the customer row exists. */
    userId: string | null;
    hideSendFailure: boolean;
  },
): Promise<OtpRequestResult> {
  const issued = createChallengeRecord(deps, input);
  const stored = await deps.challenges.replaceActive(issued.record);
  if (stored === "conflict") {
    return input.hideSendFailure
      ? { ok: true, code: "accepted" }
      : { ok: false, code: "rate_limited" };
  }

  try {
    await deps.sms.sendSms({
      to: input.phone,
      text: buildOtpSmsText(deps.locale, issued.code),
      reference: issued.record.id,
    });
  } catch (error) {
    await deps.challenges.deleteById(issued.record.id);
    await deps.rateLimit.clearSendCooldown({
      phone: input.phone,
      purpose: input.purpose,
    });
    logger.warn("otp.sms_failed", {
      purpose: input.purpose,
      code: error instanceof SmsTransportError ? error.code : "send_failed",
    });
    return input.hideSendFailure
      ? { ok: true, code: "accepted" }
      : { ok: false, code: "unavailable" };
  }

  return { ok: true, code: "accepted" };
}

/** Checks purpose, HMAC, expiry, attempts, and single-use consumption. */
export async function verifyChallenge(
  deps: OtpFlowDeps,
  input: {
    phone: string;
    code: string;
    purpose: OtpPurpose;
    expectedUserId?: string;
  },
): Promise<ChallengeCheck> {
  const active = await deps.challenges.findLatestActive(
    input.phone,
    input.purpose,
    deps.now(),
  );
  if (!active) {
    return { ok: false, code: "invalid_code", cause: "missing" };
  }
  if (input.expectedUserId && active.userId !== input.expectedUserId) {
    return { ok: false, code: "invalid_code", cause: "wrong_user" };
  }

  const computed = hashOtpCode({
    secret: deps.secret,
    challengeId: active.id,
    phone: active.phone,
    purpose: input.purpose,
    code: input.code,
  });
  if (!otpHashesMatch(active.codeHash, computed)) {
    const attempt = await deps.challenges.incrementFailedAttempt(
      active.id,
      deps.now(),
    );
    return {
      ok: false,
      code: "invalid_code",
      cause: attempt === "exhausted" ? "attempts" : "mismatch",
    };
  }

  const consumed = await deps.challenges.consume(active.id, deps.now());
  if (!consumed) {
    return { ok: false, code: "invalid_code", cause: "consumed" };
  }

  return { ok: true, userId: active.userId, phone: active.phone };
}

function createChallengeRecord(
  deps: OtpFlowDeps,
  input: { phone: string; purpose: OtpPurpose; userId: string | null },
): { record: OtpChallengeRecord; code: string } {
  const now = deps.now();
  const id = deps.createId();
  const code = (deps.generateCode ?? generateOtpCode)();
  return {
    code,
    record: {
      id,
      phone: input.phone,
      userId: input.userId,
      purpose: input.purpose,
      codeHash: hashOtpCode({
        secret: deps.secret,
        challengeId: id,
        phone: input.phone,
        purpose: input.purpose,
        code,
      }),
      expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      attempts: 0,
      maxAttempts: OTP_MAX_ATTEMPTS,
      consumedAt: null,
      createdAt: now,
    },
  };
}
