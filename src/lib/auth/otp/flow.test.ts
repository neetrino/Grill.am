import { describe, expect, it } from "vitest";

import { hashOtpCode } from "@/lib/auth/otp/code";
import {
  requestLoginOtp,
  requestPhoneVerification,
  verifyLoginOtp,
  verifyPhoneOtp,
  type OtpFlowDeps,
} from "@/lib/auth/otp/flow";
import type { OtpRateGate, OtpUserRecord } from "@/lib/auth/otp/types";
import { SmsTransportError } from "@/lib/sms/errors";
import {
  activeRows,
  createMemoryOtpChallenges,
  createMemoryOtpUsers,
} from "../../../../tests/unit/otp/memory";

const secret = "otp-secret-with-enough-length-32b";
const phone = "+37499123456";
const now = new Date("2026-10-08T12:00:00.000Z");

describe("SMS OTP flows", () => {
  it("accepts a valid login code once and creates a session", async () => {
    const harness = createHarness([activeUser()]);
    const requested = await requestLoginOtp(harness.deps, {
      phone: "099123456",
      ip: "203.0.113.10",
    });
    expect(requested).toEqual({ ok: true, code: "accepted" });
    expect(harness.sent).toHaveLength(1);
    expect(harness.sent[0]?.text).toContain("483921");
    expect(harness.challenges.rows[0]).not.toHaveProperty("code");
    expect(harness.challenges.rows[0]?.codeHash).not.toBe("483921");
    expect(harness.challenges.rows[0]?.codeHash).toMatch(/^[a-f0-9]{64}$/);

    const verified = await verifyLoginOtp(harness.deps, {
      phone: "0037499123456",
      code: "483921",
      ip: "203.0.113.10",
    });
    expect(verified.ok).toBe(true);
    expect(harness.sessions).toEqual(["user-1"]);

    const replay = await verifyLoginOtp(harness.deps, {
      phone,
      code: "483921",
      ip: "203.0.113.10",
    });
    expect(replay.ok).toBe(false);
    expect(harness.sessions).toEqual(["user-1"]);
  });

  it("rejects an invalid code and locks the challenge after five attempts", async () => {
    const harness = createHarness([activeUser()]);
    await requestLoginOtp(harness.deps, { phone, ip: "203.0.113.10" });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const result = await verifyLoginOtp(harness.deps, {
        phone,
        code: "000000",
        ip: "203.0.113.10",
      });
      expect(result.ok).toBe(false);
    }

    const afterLimit = await verifyLoginOtp(harness.deps, {
      phone,
      code: "483921",
      ip: "203.0.113.10",
    });
    expect(afterLimit.ok).toBe(false);
    expect(harness.sessions).toEqual([]);
  });

  it("rejects expired and already consumed challenges", async () => {
    const harness = createHarness([activeUser()]);
    await requestLoginOtp(harness.deps, { phone, ip: "203.0.113.10" });
    const row = harness.challenges.rows[0];
    if (!row) {
      throw new Error("missing challenge");
    }
    row.expiresAt = new Date(now.getTime() - 1000);

    const expired = await verifyLoginOtp(harness.deps, {
      phone,
      code: "483921",
      ip: "203.0.113.10",
    });
    expect(expired.ok).toBe(false);

    row.expiresAt = new Date(now.getTime() + 60_000);
    row.consumedAt = now;
    const consumed = await verifyLoginOtp(harness.deps, {
      phone,
      code: "483921",
      ip: "203.0.113.10",
    });
    expect(consumed.ok).toBe(false);
    expect(harness.sessions).toEqual([]);
  });

  it("does not accept a login code as phone verification", async () => {
    const harness = createHarness([activeUser()]);
    await requestLoginOtp(harness.deps, { phone, ip: "203.0.113.10" });
    const result = await verifyPhoneOtp(harness.deps, {
      userId: "user-1",
      code: "483921",
      ip: "203.0.113.10",
    });
    expect(result.ok).toBe(false);
    expect(activeRows(harness.challenges.rows, "LOGIN")).toHaveLength(1);
    expect(harness.users.users[0]?.phoneVerifiedAt).toBeNull();
  });

  it("does not let two concurrent consumes both succeed", async () => {
    const harness = createHarness([activeUser()]);
    await requestLoginOtp(harness.deps, { phone, ip: "203.0.113.10" });
    const [first, second] = await Promise.all([
      verifyLoginOtp(harness.deps, { phone, code: "483921", ip: "203.0.113.11" }),
      verifyLoginOtp(harness.deps, { phone, code: "483921", ip: "203.0.113.12" }),
    ]);
    const wins = [first, second].filter((result) => result.ok);
    expect(wins).toHaveLength(1);
    expect(harness.sessions).toHaveLength(1);
  });

  it("does not sign in a suspended user or reveal an unknown phone", async () => {
    const suspended = createHarness([
      { ...activeUser(), status: "SUSPENDED" },
    ]);
    const hidden = await requestLoginOtp(suspended.deps, {
      phone,
      ip: "203.0.113.10",
    });
    expect(hidden).toEqual({ ok: true, code: "accepted" });
    expect(suspended.sent).toHaveLength(0);

    const unknown = createHarness([]);
    const missing = await requestLoginOtp(unknown.deps, {
      phone,
      ip: "203.0.113.10",
    });
    expect(missing).toEqual(hidden);
    expect(unknown.sent).toHaveLength(0);
    expect(unknown.users.users).toHaveLength(0);

    const active = createHarness([activeUser()]);
    await requestLoginOtp(active.deps, { phone, ip: "203.0.113.10" });
    const user = active.users.users[0];
    if (!user) {
      throw new Error("missing user");
    }
    user.status = "SUSPENDED";
    const denied = await verifyLoginOtp(active.deps, {
      phone,
      code: "483921",
      ip: "203.0.113.10",
    });
    expect(denied).toMatchObject({ ok: false, cause: "inactive" });
    expect(active.sessions).toEqual([]);
  });

  it("does not create a session when SMS sending fails", async () => {
    const harness = createHarness([activeUser()], {
      async sendSms() {
        throw new SmsTransportError("send_failed");
      },
    });
    const result = await requestLoginOtp(harness.deps, {
      phone,
      ip: "203.0.113.10",
    });
    expect(result).toEqual({ ok: true, code: "accepted" });
    expect(harness.sessions).toEqual([]);
    expect(harness.challenges.rows).toHaveLength(0);
  });

  it("marks only the signed-in user's phone verified", async () => {
    const harness = createHarness([
      activeUser(),
      {
        ...activeUser(),
        id: "user-2",
        phone: "+37491123456",
      },
    ]);
    const requested = await requestPhoneVerification(harness.deps, {
      userId: "user-1",
      ip: "203.0.113.10",
    });
    expect(requested).toEqual({ ok: true, code: "accepted" });

    const stolen = await verifyPhoneOtp(harness.deps, {
      userId: "user-2",
      code: "483921",
      ip: "203.0.113.10",
    });
    expect(stolen.ok).toBe(false);
    expect(harness.users.users[0]?.phoneVerifiedAt).toBeNull();

    const confirmed = await verifyPhoneOtp(harness.deps, {
      userId: "user-1",
      code: "483921",
      ip: "203.0.113.10",
    });
    expect(confirmed).toEqual({ ok: true });
    expect(harness.users.users[0]?.phoneVerifiedAt).toEqual(now);
    expect(harness.users.users[1]?.phoneVerifiedAt).toBeNull();
    expect(harness.sessions).toEqual([]);
  });

  it("rejects a challenge whose user id does not match the session", async () => {
    const harness = createHarness([activeUser()]);
    const challengeId = "challenge-foreign";
    await harness.challenges.replaceActive({
      id: challengeId,
      phone,
      userId: "someone-else",
      purpose: "VERIFY_PHONE",
      codeHash: hashOtpCode({
        secret,
        challengeId,
        phone,
        purpose: "VERIFY_PHONE",
        code: "483921",
      }),
      expiresAt: new Date(now.getTime() + 60_000),
      attempts: 0,
      maxAttempts: 5,
      consumedAt: null,
      createdAt: now,
    });

    const result = await verifyPhoneOtp(harness.deps, {
      userId: "user-1",
      code: "483921",
      ip: "203.0.113.10",
    });
    expect(result).toMatchObject({ ok: false, cause: "wrong_user" });
    expect(harness.users.users[0]?.phoneVerifiedAt).toBeNull();
    expect(harness.challenges.rows[0]?.consumedAt).toBeNull();
  });

  it("stops a second send inside the resend cooldown before SMS", async () => {
    const redisGate = realGate();
    const harness = createHarness([activeUser()], undefined, redisGate.gate);
    await requestLoginOtp(harness.deps, { phone, ip: "203.0.113.20" });
    const second = await requestLoginOtp(harness.deps, {
      phone,
      ip: "203.0.113.20",
    });
    expect(second).toEqual({ ok: false, code: "rate_limited" });
    expect(harness.sent).toHaveLength(1);
  });
});

function activeUser(): OtpUserRecord {
  return {
    id: "user-1",
    role: "CUSTOMER",
    status: "ACTIVE",
    phone,
    phoneVerifiedAt: null,
  };
}

function createHarness(
  users: OtpUserRecord[],
  sms?: OtpFlowDeps["sms"],
  rateLimit: OtpRateGate = openGate(),
) {
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
    sms: sms ?? {
      async sendSms(input) {
        sent.push({ to: input.to, text: input.text });
      },
    },
    rateLimit,
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

function realGate() {
  const gate: OtpRateGate = {
    async consumeSend() {
      gate.consumeSend = async () => ({ ok: false, retryAfterSeconds: 60 });
      return { ok: true };
    },
    async consumeVerify() {
      return { ok: true };
    },
    async clearSendCooldown() {
      return undefined;
    },
  };
  return { gate   };
}
