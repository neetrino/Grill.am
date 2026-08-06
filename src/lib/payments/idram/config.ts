import "server-only";

import { z } from "zod";

import { getEnv } from "@/config/env";
import { IdramConfigError } from "@/lib/payments/idram/errors";
import { IDRAM_OFFICIAL_PAYMENT_URL } from "@/lib/payments/idram/types";

export type IdramRuntimeConfig = {
  enabled: boolean;
  recAccount: string;
  secretKey: string;
  paymentUrl: string;
  resultUrl: string;
  successUrl: string;
  failUrl: string;
  allowedPaymentHosts: readonly string[];
};

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function assertHttpsInProduction(url: string, name: string): void {
  if (getEnv().NODE_ENV !== "production") {
    return;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new IdramConfigError(`${name} must be a valid URL.`);
  }
  if (parsed.protocol !== "https:") {
    throw new IdramConfigError(`${name} must use HTTPS in production.`);
  }
  if (
    parsed.hostname.includes("vercel.app") ||
    parsed.hostname.includes("localhost")
  ) {
    throw new IdramConfigError(
      `${name} must not use preview/localhost hosts in production.`,
    );
  }
}

export function getIdramConfig(): IdramRuntimeConfig | null {
  const env = getEnv();
  if (!env.PAYMENT_ENABLE_IDRAM) {
    return null;
  }

  const recAccount = env.IDRAM_REC_ACCOUNT ?? "";
  const secretKey = env.IDRAM_SECRET_KEY ?? "";
  const paymentUrl = stripTrailingSlash(
    env.IDRAM_PAYMENT_URL ?? IDRAM_OFFICIAL_PAYMENT_URL,
  );
  const resultUrl = stripTrailingSlash(env.IDRAM_RESULT_URL ?? "");
  const successUrl = stripTrailingSlash(env.IDRAM_SUCCESS_URL ?? "");
  const failUrl = stripTrailingSlash(env.IDRAM_FAIL_URL ?? "");

  if (!recAccount || !secretKey) {
    throw new IdramConfigError(
      "IDRAM_REC_ACCOUNT and IDRAM_SECRET_KEY are required when PAYMENT_ENABLE_IDRAM=true.",
    );
  }
  for (const [name, value] of [
    ["IDRAM_PAYMENT_URL", paymentUrl],
    ["IDRAM_RESULT_URL", resultUrl],
    ["IDRAM_SUCCESS_URL", successUrl],
    ["IDRAM_FAIL_URL", failUrl],
  ] as const) {
    if (!value || !z.string().url().safeParse(value).success) {
      throw new IdramConfigError(`${name} must be a valid URL.`);
    }
    assertHttpsInProduction(value, name);
  }

  let paymentHost: string;
  try {
    paymentHost = new URL(paymentUrl).host.toLowerCase();
  } catch {
    throw new IdramConfigError("IDRAM_PAYMENT_URL is not a valid URL.");
  }

  return {
    enabled: true,
    recAccount,
    secretKey,
    paymentUrl,
    resultUrl,
    successUrl,
    failUrl,
    allowedPaymentHosts: [paymentHost, "banking.idram.am"],
  };
}

export function requireIdramConfig(): IdramRuntimeConfig {
  const config = getIdramConfig();
  if (!config) {
    throw new IdramConfigError("iDram payments are disabled.");
  }
  return config;
}

export function isIdramPaymentUrlAllowed(
  url: string,
  allowedHosts: readonly string[],
): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }
    return allowedHosts.includes(parsed.host.toLowerCase());
  } catch {
    return false;
  }
}
