import "server-only";

import { z } from "zod";

import { getEnv } from "@/config/env";
import { ArcaConfigError } from "@/lib/payments/arca/errors";
import {
  ARCA_REGISTER_PATH,
  ARCA_REGISTER_PREAUTH_PATH,
  ARCA_STATUS_PATH,
  isFormUrlHostAllowed,
  resolveRegisterPath,
} from "@/lib/payments/arca/paths";
import type { ArcaEnvironment, ArcaPaymentMode } from "@/lib/payments/arca/types";

export {
  ARCA_REGISTER_PATH,
  ARCA_REGISTER_PREAUTH_PATH,
  ARCA_STATUS_PATH,
  isFormUrlHostAllowed,
  resolveRegisterPath,
};

/** Official Merchant Manual §9 connection coordinates (IDBank iPay). */
export const ARCA_OFFICIAL_PRODUCTION_BASE_URL =
  "https://ipay.arca.am/payment/rest";
/** Alternate ArCa EPG production base (bank-issued EPG host). */
export const ARCA_OFFICIAL_EPG_PRODUCTION_BASE_URL =
  "https://epg.arca.am/payment/rest";
export const ARCA_OFFICIAL_TEST_BASE_URL =
  "https://ipaytest.arca.am:8445/payment/rest";

const DEFAULT_TIMEOUT_MS = 15_000;
const MIN_TIMEOUT_MS = 3_000;
const MAX_TIMEOUT_MS = 60_000;

export type ArcaRuntimeConfig = {
  enabled: boolean;
  environment: ArcaEnvironment;
  paymentMode: ArcaPaymentMode;
  apiBaseUrl: string;
  username: string;
  password: string;
  returnBaseUrl: string;
  requestTimeoutMs: number;
  currencyCode: string;
  language: string;
  allowedFormHosts: readonly string[];
};

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function parseTimeoutMs(raw: string | undefined): number {
  if (!raw) {
    return DEFAULT_TIMEOUT_MS;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    throw new ArcaConfigError("ARCA_REQUEST_TIMEOUT_MS must be an integer.");
  }
  if (parsed < MIN_TIMEOUT_MS || parsed > MAX_TIMEOUT_MS) {
    throw new ArcaConfigError(
      `ARCA_REQUEST_TIMEOUT_MS must be between ${MIN_TIMEOUT_MS} and ${MAX_TIMEOUT_MS}.`,
    );
  }
  return parsed;
}

function parseHosts(raw: string | undefined, apiBaseUrl: string): string[] {
  const hosts = new Set<string>();
  try {
    hosts.add(new URL(apiBaseUrl).host.toLowerCase());
  } catch {
    throw new ArcaConfigError("ARCA_API_BASE_URL is not a valid URL.");
  }

  // Official / bank-issued form hosts (Merchant Manual §7.1.1, §9 + EPG).
  hosts.add("ipay.arca.am");
  hosts.add("epg.arca.am");
  hosts.add("ipaytest.arca.am:8445");
  hosts.add("ipaytest.arca.am");

  if (raw) {
    for (const part of raw.split(",")) {
      const host = part.trim().toLowerCase();
      if (host) {
        hosts.add(host);
      }
    }
  }
  return [...hosts];
}

/**
 * Resolves ARCA runtime config when credentials are present.
 * Customer checkout still follows `PAYMENT_ENABLE_ARCA`; admin may pay with
 * credentials even when that customer flag is off.
 * Credentials are server-only; administration login must never be stored here.
 */
export function getArcaConfig(): ArcaRuntimeConfig | null {
  const env = getEnv();
  const customerEnabled = env.PAYMENT_ENABLE_ARCA;

  const environment = env.ARCA_ENVIRONMENT;
  const apiBaseUrl = stripTrailingSlash(env.ARCA_API_BASE_URL ?? "");
  const username = env.ARCA_API_USERNAME ?? "";
  const password = env.ARCA_API_PASSWORD ?? "";
  const returnBaseUrl = stripTrailingSlash(
    env.ARCA_RETURN_BASE_URL ?? env.NEXT_PUBLIC_APP_URL,
  );
  const paymentMode = env.ARCA_PAYMENT_MODE;
  const currencyCode = env.ARCA_CURRENCY_CODE ?? "051";
  const language = env.ARCA_LANGUAGE ?? "en";
  const requestTimeoutMs = parseTimeoutMs(
    process.env.ARCA_REQUEST_TIMEOUT_MS,
  );

  const hasCompleteCredentials = Boolean(
    environment &&
      paymentMode &&
      apiBaseUrl &&
      username &&
      password &&
      z.string().url().safeParse(apiBaseUrl).success &&
      z.string().url().safeParse(returnBaseUrl).success,
  );

  if (!hasCompleteCredentials) {
    if (!customerEnabled) {
      return null;
    }
    if (!environment) {
      throw new ArcaConfigError(
        "ARCA_ENVIRONMENT is required when PAYMENT_ENABLE_ARCA=true.",
      );
    }
    if (!paymentMode) {
      throw new ArcaConfigError(
        "ARCA_PAYMENT_MODE is required when PAYMENT_ENABLE_ARCA=true (one_stage|two_stage).",
      );
    }
    if (!apiBaseUrl) {
      throw new ArcaConfigError(
        "ARCA_API_BASE_URL is required when PAYMENT_ENABLE_ARCA=true.",
      );
    }
    if (!z.string().url().safeParse(apiBaseUrl).success) {
      throw new ArcaConfigError("ARCA_API_BASE_URL must be a valid URL.");
    }
    if (!username || !password) {
      throw new ArcaConfigError(
        "ARCA_API_USERNAME and ARCA_API_PASSWORD are required when PAYMENT_ENABLE_ARCA=true.",
      );
    }
    if (!z.string().url().safeParse(returnBaseUrl).success) {
      throw new ArcaConfigError("ARCA_RETURN_BASE_URL must be a valid URL.");
    }
    return null;
  }

  if (!environment || !paymentMode) {
    return null;
  }

  if (env.NODE_ENV === "production") {
    let returnHost: URL;
    try {
      returnHost = new URL(returnBaseUrl);
    } catch {
      throw new ArcaConfigError("ARCA_RETURN_BASE_URL must be a valid URL.");
    }
    if (returnHost.protocol !== "https:") {
      throw new ArcaConfigError(
        "ARCA_RETURN_BASE_URL must use HTTPS in production.",
      );
    }
    if (
      returnHost.hostname.includes("localhost") ||
      returnHost.hostname.includes("127.0.0.1") ||
      returnHost.hostname.includes("vercel.app")
    ) {
      throw new ArcaConfigError(
        "ARCA_RETURN_BASE_URL must not use localhost/preview hosts in production.",
      );
    }
  }

  // Do not silently rewrite test↔production URL strings.
  if (
    environment === "production" &&
    apiBaseUrl.includes("ipaytest.arca.am")
  ) {
    throw new ArcaConfigError(
      "ARCA_ENVIRONMENT=production cannot use the official test host.",
    );
  }
  if (
    environment === "test" &&
    apiBaseUrl === ARCA_OFFICIAL_PRODUCTION_BASE_URL
  ) {
    throw new ArcaConfigError(
      "ARCA_ENVIRONMENT=test cannot use the official production base URL.",
    );
  }

  return {
    enabled: customerEnabled,
    environment,
    paymentMode,
    apiBaseUrl,
    username,
    password,
    returnBaseUrl,
    requestTimeoutMs,
    currencyCode,
    language,
    allowedFormHosts: parseHosts(
      env.ARCA_FORM_URL_ALLOWED_HOSTS,
      apiBaseUrl,
    ),
  };
}

export function requireArcaConfig(): ArcaRuntimeConfig {
  const config = getArcaConfig();
  if (!config) {
    throw new ArcaConfigError("ARCA payments are disabled.");
  }
  return config;
}
