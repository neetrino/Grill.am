import { describe, expect, it } from "vitest";

import {
  isSmsOtpRuntimeAvailable,
  isSmsTransportAvailable,
} from "@/lib/sms/availability";

const enabled = {
  otpSecret: "otp-secret-with-enough-length-32b",
  smsConfigured: true,
  sharedRedisConfigured: true,
};

describe("SMS OTP runtime availability", () => {
  it("refuses production SMS when shared Redis is missing", () => {
    expect(
      isSmsOtpRuntimeAvailable({
        ...enabled,
        nodeEnv: "production",
        sharedRedisConfigured: false,
      }),
    ).toBe(false);
    expect(
      isSmsTransportAvailable({
        nodeEnv: "production",
        smsConfigured: true,
        sharedRedisConfigured: false,
      }),
    ).toBe(false);
  });

  it("allows production SMS when Upstash is configured", () => {
    expect(
      isSmsOtpRuntimeAvailable({ ...enabled, nodeEnv: "production" }),
    ).toBe(true);
  });

  it("allows the memory adapter in development and test", () => {
    expect(
      isSmsOtpRuntimeAvailable({
        ...enabled,
        nodeEnv: "development",
        sharedRedisConfigured: false,
      }),
    ).toBe(true);
    expect(
      isSmsOtpRuntimeAvailable({
        ...enabled,
        nodeEnv: "test",
        sharedRedisConfigured: false,
      }),
    ).toBe(true);
  });

  it("stays unavailable without an OTP secret even when Redis exists", () => {
    expect(
      isSmsOtpRuntimeAvailable({
        ...enabled,
        nodeEnv: "production",
        otpSecret: undefined,
      }),
    ).toBe(false);
  });
});
