import type { OtpPurpose } from "@/lib/auth/otp/constants";
import type { UserRole, UserStatus } from "@/features/users/domain/user-lifecycle";
import type { Locale } from "@/lib/i18n/config";
import type { SendSmsInput } from "@/lib/sms/types";

export type OtpUserRecord = {
  id: string;
  role: UserRole;
  status: UserStatus;
  phone: string | null;
  phoneVerifiedAt: Date | null;
};

export type OtpChallengeRecord = {
  id: string;
  phone: string;
  userId: string | null;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  consumedAt: Date | null;
  createdAt: Date;
};

export type OtpChallengeRepository = {
  /** Closes any active challenge for the phone and purpose, then inserts one. */
  replaceActive(
    record: OtpChallengeRecord,
  ): Promise<"inserted" | "conflict">;
  findLatestActive(
    phone: string,
    purpose: OtpPurpose,
    now: Date,
  ): Promise<OtpChallengeRecord | null>;
  incrementFailedAttempt(
    id: string,
    now: Date,
  ): Promise<"incremented" | "exhausted">;
  /**
   * Marks the challenge consumed at most once.
   * A second call, or a call that loses the race, returns null.
   */
  consume(id: string, now: Date): Promise<OtpChallengeRecord | null>;
  deleteById(id: string): Promise<void>;
};

export type OtpUserRepository = {
  findLoginCandidate(
    phoneE164: string,
  ): Promise<
    | { kind: "none" }
    | { kind: "held" }
    | { kind: "ambiguous" }
    | { kind: "found"; user: OtpUserRecord }
  >;
  findById(id: string): Promise<OtpUserRecord | null>;
  /** Persists a canonical phone and the verification timestamp that belongs to it. */
  applyPhoneChange(
    userId: string,
    update: { phone: string; phoneVerifiedAt: Date | null },
  ): Promise<void>;
  markPhoneVerified(
    userId: string,
    phoneE164: string,
    verifiedAt: Date,
  ): Promise<"verified" | "unchanged" | "phone_taken">;
  /**
   * Creates an ACTIVE CUSTOMER with a verified phone after SMS signup OTP.
   * Uses a placeholder email/name until the customer edits their profile.
   */
  createVerifiedPhoneCustomer(input: {
    id: string;
    phoneE164: string;
    now: Date;
  }): Promise<
    { kind: "created"; user: OtpUserRecord } | { kind: "phone_taken" }
  >;
  touchLastLogin(userId: string, at: Date): Promise<void>;
};

export type RateLimitDecision =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

export type OtpRateGate = {
  consumeSend(input: {
    phone: string;
    ip: string;
    purpose: OtpPurpose;
    now: Date;
  }): Promise<RateLimitDecision>;
  consumeVerify(input: {
    phone: string;
    ip: string;
    now: Date;
  }): Promise<RateLimitDecision>;
  clearSendCooldown(input: {
    phone: string;
    purpose: OtpPurpose;
  }): Promise<void>;
};

export type OtpPublicFailure =
  | "invalid_phone"
  | "invalid_code"
  | "rate_limited"
  | "unavailable"
  | "phone_missing"
  | "phone_taken";

export type OtpRequestResult =
  | { ok: true; code: "accepted" | "already_verified" }
  | { ok: false; code: OtpPublicFailure };

export type OtpVerifyFailureCause =
  | "mismatch"
  | "missing"
  | "expired"
  | "consumed"
  | "attempts"
  | "wrong_user"
  | "wrong_purpose"
  | "inactive"
  | "phone_mismatch"
  | "invalid_phone"
  | "unverified"
  | "ineligible";

export type OtpLoginVerifyResult =
  | {
      ok: true;
      userId: string;
      role: OtpUserRecord["role"];
      /** True when this verify created a new customer via SMS signup. */
      isNewUser: boolean;
    }
  | {
      ok: false;
      code: "invalid_code" | "rate_limited" | "unavailable";
      cause?: OtpVerifyFailureCause;
    };

export type OtpFlowDeps = {
  secret: string;
  locale: Locale;
  now: () => Date;
  createId: () => string;
  generateCode?: () => string;
  challenges: OtpChallengeRepository;
  users: OtpUserRepository;
  sms: { sendSms(input: SendSmsInput): Promise<void> };
  rateLimit: OtpRateGate;
  onAuthenticated: (userId: string) => Promise<void>;
};

export type OtpPhoneVerifyResult =
  | { ok: true }
  | {
      ok: false;
      code: OtpPublicFailure;
      cause?: OtpVerifyFailureCause;
    };
