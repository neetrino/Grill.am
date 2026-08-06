/**
 * Safe provider readiness / health checks for operators.
 * Never prints secret values — only presence booleans and missing names.
 */

import { getEnv } from "@/config/env";
import { resolvePaymentMethodAvailability } from "@/features/payments/domain/payment-availability";

export type ProviderReadinessReport = {
  provider: "cod" | "arca" | "idram";
  enabledFlag: boolean;
  configurationValid: boolean;
  missingEnvNames: string[];
  readyToEnable: boolean;
  notes: string[];
};

function missing(
  names: string[],
  values: Record<string, string | undefined>,
): string[] {
  return names.filter((name) => {
    const value = values[name];
    return !value || value.trim().length === 0;
  });
}

export function getPaymentProviderReadiness(): ProviderReadinessReport[] {
  const env = getEnv();
  const availability = resolvePaymentMethodAvailability({
    PAYMENT_ENABLE_COD: env.PAYMENT_ENABLE_COD,
    PAYMENT_ENABLE_ARCA: env.PAYMENT_ENABLE_ARCA,
    PAYMENT_ENABLE_IDRAM: env.PAYMENT_ENABLE_IDRAM,
  });

  const cod: ProviderReadinessReport = {
    provider: "cod",
    enabledFlag: availability.cash_on_delivery,
    configurationValid: true,
    missingEnvNames: [],
    readyToEnable: availability.cash_on_delivery,
    notes: ["COD has no provider credentials."],
  };

  const arcaRequired = [
    "ARCA_ENVIRONMENT",
    "ARCA_API_BASE_URL",
    "ARCA_API_USERNAME",
    "ARCA_API_PASSWORD",
    "ARCA_RETURN_BASE_URL",
    "ARCA_PAYMENT_MODE",
    "ARCA_CURRENCY_CODE",
  ];
  const arcaMissing = missing(arcaRequired, {
    ARCA_ENVIRONMENT: env.ARCA_ENVIRONMENT,
    ARCA_API_BASE_URL: env.ARCA_API_BASE_URL,
    ARCA_API_USERNAME: env.ARCA_API_USERNAME,
    ARCA_API_PASSWORD: env.ARCA_API_PASSWORD,
    ARCA_RETURN_BASE_URL: env.ARCA_RETURN_BASE_URL,
    ARCA_PAYMENT_MODE: env.ARCA_PAYMENT_MODE,
    ARCA_CURRENCY_CODE: env.ARCA_CURRENCY_CODE,
  });
  const arcaConfigValid = arcaMissing.length === 0;
  const arca: ProviderReadinessReport = {
    provider: "arca",
    enabledFlag: availability.arca,
    configurationValid: arcaConfigValid,
    missingEnvNames: arcaMissing,
    readyToEnable: availability.arca && arcaConfigValid,
    notes: [
      "Sandbox/controlled acceptance must be recorded before production enable.",
      "Host allowlist and return URL must be canonical.",
      "Do not enable until migrations 0010–0012 are applied.",
    ],
  };

  const idramRequired = [
    "IDRAM_REC_ACCOUNT",
    "IDRAM_SECRET_KEY",
    "IDRAM_PAYMENT_URL",
    "IDRAM_RESULT_URL",
    "IDRAM_SUCCESS_URL",
    "IDRAM_FAIL_URL",
  ];
  const idramMissing = missing(idramRequired, {
    IDRAM_REC_ACCOUNT: env.IDRAM_REC_ACCOUNT,
    IDRAM_SECRET_KEY: env.IDRAM_SECRET_KEY,
    IDRAM_PAYMENT_URL: env.IDRAM_PAYMENT_URL,
    IDRAM_RESULT_URL: env.IDRAM_RESULT_URL,
    IDRAM_SUCCESS_URL: env.IDRAM_SUCCESS_URL,
    IDRAM_FAIL_URL: env.IDRAM_FAIL_URL,
  });
  const idramConfigValid = idramMissing.length === 0;
  const idram: ProviderReadinessReport = {
    provider: "idram",
    enabledFlag: availability.idram,
    configurationValid: idramConfigValid,
    missingEnvNames: idramMissing,
    readyToEnable: availability.idram && idramConfigValid,
    notes: [
      "RESULT/SUCCESS/FAIL URLs must match merchant portal exactly.",
      "Controlled production verification required before enable.",
      "Do not enable until migrations 0010–0012 are applied.",
    ],
  };

  return [cod, arca, idram];
}

export function formatPaymentReadinessReport(
  reports: ProviderReadinessReport[],
): string {
  const lines: string[] = ["Payment provider readiness (safe summary)", ""];
  for (const report of reports) {
    lines.push(`## ${report.provider.toUpperCase()}`);
    lines.push(`- enabledFlag: ${report.enabledFlag}`);
    lines.push(`- configurationValid: ${report.configurationValid}`);
    lines.push(`- readyToEnable: ${report.readyToEnable}`);
    lines.push(
      `- missingEnvNames: ${
        report.missingEnvNames.length
          ? report.missingEnvNames.join(", ")
          : "(none)"
      }`,
    );
    for (const note of report.notes) {
      lines.push(`- note: ${note}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
