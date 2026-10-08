import { describe, expect, it } from "vitest";

import { createOtpRateGate } from "@/lib/auth/otp/rate-limit";
import { createMemoryRedisAdapter } from "@/lib/redis/memory-adapter";

const secret = "otp-secret-with-enough-length-32b";
const now = new Date("2026-10-08T12:00:00.000Z");

describe("OTP rate limits", () => {
  it("blocks a phone after the send limit inside the window", async () => {
    const gate = createOtpRateGate(
      createMemoryRedisAdapter().getClient(),
      secret,
      testLimits({ sendPhoneLimit: 2 }),
    );

    await expect(send(gate, "+37499123456", "203.0.113.1")).resolves.toEqual({
      ok: true,
    });
    await gate.clearSendCooldown({
      phone: "+37499123456",
      purpose: "LOGIN",
    });
    await expect(send(gate, "+37499123456", "203.0.113.1")).resolves.toEqual({
      ok: true,
    });
    await gate.clearSendCooldown({
      phone: "+37499123456",
      purpose: "LOGIN",
    });
    await expect(send(gate, "+37499123456", "203.0.113.1")).resolves.toMatchObject(
      { ok: false },
    );
  });

  it("blocks an IP across different phones", async () => {
    const gate = createOtpRateGate(
      createMemoryRedisAdapter().getClient(),
      secret,
      testLimits({ sendIpLimit: 2, sendPhoneLimit: 10 }),
    );

    await expect(send(gate, "+37499123456", "203.0.113.8")).resolves.toEqual({
      ok: true,
    });
    await expect(send(gate, "+37491123456", "203.0.113.8")).resolves.toEqual({
      ok: true,
    });
    await expect(send(gate, "+37477123456", "203.0.113.8")).resolves.toMatchObject(
      { ok: false },
    );
  });

  it("enforces the resend cooldown for the same phone", async () => {
    const gate = createOtpRateGate(
      createMemoryRedisAdapter().getClient(),
      secret,
      testLimits({ resendCooldownSeconds: 60 }),
    );

    await expect(send(gate, "+37499123456", "203.0.113.9")).resolves.toEqual({
      ok: true,
    });
    const second = await send(gate, "+37499123456", "203.0.113.9");
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.retryAfterSeconds).toBe(60);
    }
  });
});

function testLimits(
  overrides: Partial<{
    sendPhoneLimit: number;
    sendIpLimit: number;
    resendCooldownSeconds: number;
  }>,
) {
  return {
    sendPhoneLimit: overrides.sendPhoneLimit ?? 5,
    sendPhoneWindowSeconds: 15 * 60,
    sendIpLimit: overrides.sendIpLimit ?? 20,
    sendIpWindowSeconds: 15 * 60,
    verifyPhoneLimit: 15,
    verifyPhoneWindowSeconds: 15 * 60,
    verifyIpLimit: 40,
    verifyIpWindowSeconds: 15 * 60,
    resendCooldownSeconds: overrides.resendCooldownSeconds ?? 60,
  };
}

function send(
  gate: ReturnType<typeof createOtpRateGate>,
  phone: string,
  ip: string,
) {
  return gate.consumeSend({ phone, ip, purpose: "LOGIN", now });
}
