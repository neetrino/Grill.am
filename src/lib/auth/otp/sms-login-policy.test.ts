import { describe, expect, it } from "vitest";

import { hashOtpCode } from "@/lib/auth/otp/code";
import { isSmsLoginEligible } from "@/lib/auth/otp/eligibility";
import {
  requestLoginOtp,
  requestPhoneVerification,
  verifyLoginOtp,
  verifyPhoneOtp,
  type OtpFlowDeps,
} from "@/lib/auth/otp/flow";
import { resolvePhoneUpdate } from "@/lib/auth/otp/phone-verification-state";
import type { OtpRateGate, OtpUserRecord } from "@/lib/auth/otp/types";
import {
  createMemoryOtpChallenges,
  createMemoryOtpUsers,
} from "../../../../tests/unit/otp/memory";

const secret = "otp-secret-with-enough-length-32b";
const phone = "+37499123456";
const now = new Date("2026-10-08T12:00:00.000Z");

describe("SMS login eligibility", () => {
  it("sends a login code only for a verified customer", async () => {
    const customer = createHarness([verifiedUser()]);
    const unverified = createHarness([customerUser()]);
    const unknown = createHarness([]);

    const sent = await requestLoginOtp(customer.deps, { phone, ip: "203.0.113.8" });
    const hidden = await requestLoginOtp(unverified.deps, {
      phone,
      ip: "203.0.113.8",
    });
    const missing = await requestLoginOtp(unknown.deps, {
      phone,
      ip: "203.0.113.8",
    });

    expect(sent).toEqual({ ok: true, code: "accepted" });
    expect(hidden).toEqual(missing);
    expect(customer.sent).toHaveLength(1);
    expect(unverified.sent).toHaveLength(0);
    expect(unknown.sent).toHaveLength(0);
    expect(unknown.users.users).toHaveLength(0);
  });

  it("does not authenticate an unverified customer who presents a login code", async () => {
    const harness = createHarness([customerUser()]);
    await plantLoginChallenge(harness);

    const result = await verifyLoginOtp(harness.deps, {
      phone,
      code: "483921",
      ip: "203.0.113.8",
    });
    expect(result).toMatchObject({ ok: false, cause: "unverified" });
    expect(harness.sessions).toEqual([]);
  });

  it("keeps admin and operator SMS requests indistinguishable from an unknown phone", async () => {
    const unknown = await requestLoginOtp(createHarness([]).deps, {
      phone,
      ip: "203.0.113.8",
    });
    for (const role of ["ADMIN", "OPERATOR"] as const) {
      const harness = createHarness([{ ...verifiedUser(), role }]);
      const result = await requestLoginOtp(harness.deps, {
        phone,
        ip: "203.0.113.8",
      });
      expect(result).toEqual(unknown);
      expect(harness.sent).toHaveLength(0);
      const staff = harness.users.users[0];
      expect(staff).toBeDefined();
      if (staff) {
        expect(isSmsLoginEligible(staff, phone)).toBe(false);
      }
    }
  });

  it("drops SMS login when verification is cleared after the code was sent", async () => {
    const harness = createHarness([verifiedUser()]);
    await requestLoginOtp(harness.deps, { phone, ip: "203.0.113.8" });
    const user = harness.users.users[0];
    if (!user) {
      throw new Error("missing user");
    }
    user.phoneVerifiedAt = null;

    const result = await verifyLoginOtp(harness.deps, {
      phone,
      code: "483921",
      ip: "203.0.113.8",
    });
    expect(result).toMatchObject({ ok: false, cause: "unverified" });
    expect(harness.sessions).toEqual([]);
  });

  it("clears verification on phone change and restores SMS login after re-verify", async () => {
    const harness = createHarness([verifiedUser()]);
    const nextPhone = "+37477111222";
    const update = resolvePhoneUpdate({
      previousPhone: phone,
      previousVerifiedAt: now,
      nextPhone,
    });
    await harness.deps.users.applyPhoneChange("user-1", update);
    expect(update.phoneVerifiedAt).toBeNull();

    const oldLogin = await requestLoginOtp(harness.deps, {
      phone,
      ip: "203.0.113.8",
    });
    expect(oldLogin).toEqual({ ok: true, code: "accepted" });
    expect(harness.sent).toHaveLength(0);

    const requested = await requestPhoneVerification(harness.deps, {
      userId: "user-1",
      ip: "203.0.113.8",
    });
    expect(requested).toEqual({ ok: true, code: "accepted" });
    const confirmed = await verifyPhoneOtp(harness.deps, {
      userId: "user-1",
      code: "483921",
      ip: "203.0.113.8",
    });
    expect(confirmed).toEqual({ ok: true });

    const login = await requestLoginOtp(harness.deps, {
      phone: nextPhone,
      ip: "203.0.113.8",
    });
    expect(login).toEqual({ ok: true, code: "accepted" });
    expect(harness.sent).toHaveLength(2);
  });

  it("refuses to verify a phone another account already verified", async () => {
    const harness = createHarness([
      customerUser(),
      { ...customerUser(), id: "user-2" },
    ]);
    await requestPhoneVerification(harness.deps, {
      userId: "user-1",
      ip: "203.0.113.8",
    });
    expect(
      await verifyPhoneOtp(harness.deps, {
        userId: "user-1",
        code: "483921",
        ip: "203.0.113.8",
      }),
    ).toEqual({ ok: true });

    await requestPhoneVerification(harness.deps, {
      userId: "user-2",
      ip: "203.0.113.9",
    });
    const taken = await verifyPhoneOtp(harness.deps, {
      userId: "user-2",
      code: "483921",
      ip: "203.0.113.9",
    });
    expect(taken).toEqual({ ok: false, code: "phone_taken" });
    expect(harness.users.users[1]?.phoneVerifiedAt).toBeNull();
    expect(harness.sessions).toEqual([]);
  });
});

function customerUser(): OtpUserRecord {
  return {
    id: "user-1",
    role: "CUSTOMER",
    status: "ACTIVE",
    phone,
    phoneVerifiedAt: null,
  };
}

function verifiedUser(): OtpUserRecord {
  return { ...customerUser(), phoneVerifiedAt: now };
}

function createHarness(users: OtpUserRecord[]) {
  const challenges = createMemoryOtpChallenges();
  const userRepository = createMemoryOtpUsers(users);
  const sessions: string[] = [];
  const sent: Array<{ to: string; text: string }> = [];
  let ids = 0;
  const deps: OtpFlowDeps = {
    secret,
    locale: "en",
    now: () => now,
    createId: () => {
      ids += 1;
      return `00000000-0000-4000-8000-${String(ids).padStart(12, "0")}`;
    },
    generateCode: () => "483921",
    challenges,
    users: userRepository,
    sms: {
      async sendSms(input) {
        sent.push({ to: input.to, text: input.text });
      },
    },
    rateLimit: openGate(),
    onAuthenticated: async (userId) => {
      sessions.push(userId);
    },
  };
  return { deps, challenges, users: userRepository, sessions, sent };
}

function openGate(): OtpRateGate {
  return {
    async consumeSend() {
      return { ok: true };
    },
    async consumeVerify() {
      return { ok: true };
    },
    async clearSendCooldown() {
      return undefined;
    },
  };
}

async function plantLoginChallenge(harness: ReturnType<typeof createHarness>) {
  const challengeId = "00000000-0000-4000-8000-000000000099";
  await harness.challenges.replaceActive({
    id: challengeId,
    phone,
    userId: "user-1",
    purpose: "LOGIN",
    codeHash: hashOtpCode({
      secret,
      challengeId,
      phone,
      purpose: "LOGIN",
      code: "483921",
    }),
    expiresAt: new Date(now.getTime() + 60_000),
    attempts: 0,
    maxAttempts: 5,
    consumedAt: null,
    createdAt: now,
  });
}
