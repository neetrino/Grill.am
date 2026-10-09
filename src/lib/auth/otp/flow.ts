import { normalizePhoneToE164 } from "@/lib/phone/normalize";

import { sendChallenge, verifyChallenge } from "@/lib/auth/otp/challenge-ops";
import type { OtpPurpose } from "@/lib/auth/otp/constants";
import { isSmsLoginEligible } from "@/lib/auth/otp/eligibility";
import { resolvePhoneUpdate } from "@/lib/auth/otp/phone-verification-state";
import type {
  OtpFlowDeps,
  OtpLoginVerifyResult,
  OtpPhoneVerifyResult,
  OtpRequestResult,
  OtpUserRecord,
  OtpVerifyFailureCause,
} from "@/lib/auth/otp/types";

const CODE_PATTERN = /^\d{6}$/;

export type { OtpFlowDeps } from "@/lib/auth/otp/types";

/**
 * Passwordless login / SMS signup step 1.
 * Verified customers and unknown phones receive a LOGIN code.
 * Known but ineligible numbers get the same accepted response without SMS.
 */
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
  if (candidate.kind === "found" && isSmsLoginEligible(candidate.user, phone)) {
    return sendChallenge(deps, {
      phone,
      purpose: "LOGIN",
      userId: candidate.user.id,
      hideSendFailure: true,
    });
  }

  if (candidate.kind === "none") {
    return sendChallenge(deps, {
      phone,
      purpose: "LOGIN",
      userId: null,
      hideSendFailure: true,
    });
  }

  // held / ambiguous / ineligible found — same public response, no SMS.
  return { ok: true, code: "accepted" };
}

/**
 * Passwordless login / SMS signup step 2.
 * Existing verified customers sign in; unknown phones create a customer.
 */
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
  if (!verified.ok) {
    return verified;
  }

  if (verified.userId) {
    const user = await deps.users.findById(verified.userId);
    if (!user || !isSmsLoginEligible(user, phone)) {
      return {
        ok: false,
        code: "invalid_code",
        cause: loginDenialCause(user),
      };
    }

    await deps.users.touchLastLogin(user.id, deps.now());
    await deps.onAuthenticated(user.id);
    return { ok: true, userId: user.id, role: user.role, isNewUser: false };
  }

  return completeSmsSignup(deps, phone);
}

async function completeSmsSignup(
  deps: OtpFlowDeps,
  phone: string,
): Promise<OtpLoginVerifyResult> {
  const candidate = await deps.users.findLoginCandidate(phone);
  if (candidate.kind === "found") {
    if (!isSmsLoginEligible(candidate.user, phone)) {
      return {
        ok: false,
        code: "invalid_code",
        cause: loginDenialCause(candidate.user),
      };
    }
    await deps.users.touchLastLogin(candidate.user.id, deps.now());
    await deps.onAuthenticated(candidate.user.id);
    return {
      ok: true,
      userId: candidate.user.id,
      role: candidate.user.role,
      isNewUser: false,
    };
  }
  if (candidate.kind === "ambiguous" || candidate.kind === "held") {
    return { ok: false, code: "invalid_code", cause: "ineligible" };
  }

  const created = await deps.users.createVerifiedPhoneCustomer({
    id: deps.createId(),
    phoneE164: phone,
    now: deps.now(),
  });
  if (created.kind === "phone_taken") {
    return { ok: false, code: "invalid_code", cause: "ineligible" };
  }

  await deps.onAuthenticated(created.user.id);
  return {
    ok: true,
    userId: created.user.id,
    role: created.user.role,
    isNewUser: true,
  };
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
  if (marked === "phone_taken") {
    return { ok: false, code: "phone_taken" };
  }
  if (marked !== "verified") {
    return { ok: false, code: "invalid_code", cause: "phone_mismatch" };
  }

  return { ok: true };
}

function loginDenialCause(
  user: OtpUserRecord | null,
): OtpVerifyFailureCause {
  if (!user || user.status !== "ACTIVE") {
    return user ? "inactive" : "phone_mismatch";
  }
  if (user.role !== "CUSTOMER") {
    return "ineligible";
  }
  if (user.phoneVerifiedAt === null) {
    return "unverified";
  }
  return "phone_mismatch";
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
