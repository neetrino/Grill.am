import { normalizePhoneToE164 } from "@/lib/phone/normalize";

import { sendChallenge, verifyChallenge } from "@/lib/auth/otp/challenge-ops";
import type { OtpPurpose } from "@/lib/auth/otp/constants";
import { resolvePhoneUpdate } from "@/lib/auth/otp/phone-verification-state";
import type {
  OtpFlowDeps,
  OtpLoginVerifyResult,
  OtpPhoneVerifyResult,
  OtpRequestResult,
} from "@/lib/auth/otp/types";

const CODE_PATTERN = /^\d{6}$/;

export type { OtpFlowDeps } from "@/lib/auth/otp/types";

/** Passwordless login step 1. Unknown phones get the same accepted response. */
export async function requestLoginOtp(
  deps: OtpFlowDeps,
  input: { phone: string; ip: string },
): Promise<OtpRequestResult> {
  const phone = normalizePhoneToE164(input.phone);
  if (!phone) {
    return { ok: false, code: "invalid_phone" };
  }

  const allowed = await allowSend(deps, phone, input.ip, "LOGIN");
  if (!allowed) {
    return { ok: false, code: "rate_limited" };
  }

  const candidate = await deps.users.findLoginCandidate(phone);
  if (candidate.kind !== "found") {
    return { ok: true, code: "accepted" };
  }

  return sendChallenge(deps, {
    phone,
    purpose: "LOGIN",
    userId: candidate.user.id,
    hideSendFailure: true,
  });
}

/** Passwordless login step 2. Creates a session only after a consumed LOGIN OTP. */
export async function verifyLoginOtp(
  deps: OtpFlowDeps,
  input: { phone: string; code: string; ip: string },
): Promise<OtpLoginVerifyResult> {
  const phone = normalizePhoneToE164(input.phone);
  if (!phone || !CODE_PATTERN.test(input.code)) {
    return { ok: false, code: "invalid_code", cause: "invalid_phone" };
  }

  const allowed = await allowVerify(deps, phone, input.ip);
  if (!allowed) {
    return { ok: false, code: "rate_limited" };
  }

  const verified = await verifyChallenge(deps, {
    phone,
    code: input.code,
    purpose: "LOGIN",
  });
  if (!verified.ok || !verified.userId) {
    return verified.ok
      ? { ok: false, code: "invalid_code", cause: "missing" }
      : verified;
  }

  const user = await deps.users.findById(verified.userId);
  const currentPhone = user?.phone ? normalizePhoneToE164(user.phone) : null;
  if (!user || user.status !== "ACTIVE" || currentPhone !== phone) {
    return {
      ok: false,
      code: "invalid_code",
      cause: user && user.status !== "ACTIVE" ? "inactive" : "phone_mismatch",
    };
  }

  await deps.users.touchLastLogin(user.id, deps.now());
  await deps.onAuthenticated(user.id);
  return { ok: true, userId: user.id, role: user.role };
}

/** Authenticated user asks to prove the phone already stored on their account. */
export async function requestPhoneVerification(
  deps: OtpFlowDeps,
  input: { userId: string; ip: string },
): Promise<OtpRequestResult> {
  const user = await deps.users.findById(input.userId);
  if (!user || user.status !== "ACTIVE") {
    return { ok: false, code: "unavailable" };
  }

  const phone = user.phone ? normalizePhoneToE164(user.phone) : null;
  if (!phone) {
    return { ok: false, code: "phone_missing" };
  }

  const update = resolvePhoneUpdate({
    previousPhone: user.phone,
    previousVerifiedAt: user.phoneVerifiedAt,
    nextPhone: phone,
  });
  if (user.phone !== update.phone) {
    await deps.users.applyPhoneChange(user.id, update);
  }
  if (update.phoneVerifiedAt) {
    return { ok: true, code: "already_verified" };
  }

  const allowed = await allowSend(deps, phone, input.ip, "VERIFY_PHONE");
  if (!allowed) {
    return { ok: false, code: "rate_limited" };
  }

  return sendChallenge(deps, {
    phone,
    purpose: "VERIFY_PHONE",
    userId: user.id,
    hideSendFailure: false,
  });
}

/** Sets phoneVerifiedAt only for the signed-in user after a VERIFY_PHONE OTP. */
export async function verifyPhoneOtp(
  deps: OtpFlowDeps,
  input: { userId: string; code: string; ip: string },
): Promise<OtpPhoneVerifyResult> {
  const user = await deps.users.findById(input.userId);
  if (!user || user.status !== "ACTIVE") {
    return { ok: false, code: "unavailable", cause: "wrong_user" };
  }

  const phone = user.phone ? normalizePhoneToE164(user.phone) : null;
  if (!phone || !CODE_PATTERN.test(input.code)) {
    return { ok: false, code: "phone_missing" };
  }

  const allowed = await allowVerify(deps, phone, input.ip);
  if (!allowed) {
    return { ok: false, code: "rate_limited" };
  }

  const verified = await verifyChallenge(deps, {
    phone,
    code: input.code,
    purpose: "VERIFY_PHONE",
    expectedUserId: input.userId,
  });
  if (!verified.ok) {
    return verified;
  }

  const marked = await deps.users.markPhoneVerified(
    input.userId,
    phone,
    deps.now(),
  );
  if (!marked) {
    return { ok: false, code: "invalid_code", cause: "phone_mismatch" };
  }

  return { ok: true };
}

async function allowSend(
  deps: OtpFlowDeps,
  phone: string,
  ip: string,
  purpose: OtpPurpose,
): Promise<boolean> {
  const decision = await deps.rateLimit.consumeSend({
    phone,
    ip,
    purpose,
    now: deps.now(),
  });
  return decision.ok;
}

async function allowVerify(
  deps: OtpFlowDeps,
  phone: string,
  ip: string,
): Promise<boolean> {
  const decision = await deps.rateLimit.consumeVerify({
    phone,
    ip,
    now: deps.now(),
  });
  return decision.ok;
}
