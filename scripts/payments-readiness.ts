import "dotenv/config";

/**
 * Operator command: prints safe readiness booleans / missing env names only.
 * Reads process.env directly so CLI does not import Next `server-only` modules.
 * Never prints secret values.
 */

type ProviderReadinessReport = {
  provider: "cod" | "arca" | "idram";
  enabledFlag: boolean;
  configurationValid: boolean;
  missingEnvNames: string[];
  readyToEnable: boolean;
  notes: string[];
};

function flagEnabled(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return defaultValue;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return defaultValue;
}

function missing(names: string[]): string[] {
  return names.filter((name) => {
    const value = process.env[name];
    return !value || value.trim().length === 0;
  });
}

function getReports(): ProviderReadinessReport[] {
  const codEnabled = flagEnabled("PAYMENT_ENABLE_COD", true);
  const arcaEnabled = flagEnabled("PAYMENT_ENABLE_ARCA", false);
  const idramEnabled = flagEnabled("PAYMENT_ENABLE_IDRAM", false);

  const arcaMissing = missing([
    "ARCA_ENVIRONMENT",
    "ARCA_API_BASE_URL",
    "ARCA_API_USERNAME",
    "ARCA_API_PASSWORD",
    "ARCA_RETURN_BASE_URL",
    "ARCA_PAYMENT_MODE",
    "ARCA_CURRENCY_CODE",
  ]);
  const idramMissing = missing([
    "IDRAM_REC_ACCOUNT",
    "IDRAM_SECRET_KEY",
    "IDRAM_PAYMENT_URL",
    "IDRAM_RESULT_URL",
    "IDRAM_SUCCESS_URL",
    "IDRAM_FAIL_URL",
  ]);

  return [
    {
      provider: "cod",
      enabledFlag: codEnabled,
      configurationValid: true,
      missingEnvNames: [],
      readyToEnable: codEnabled,
      notes: ["COD has no provider credentials."],
    },
    {
      provider: "arca",
      enabledFlag: arcaEnabled,
      configurationValid: arcaMissing.length === 0,
      missingEnvNames: arcaMissing,
      readyToEnable: arcaEnabled && arcaMissing.length === 0,
      notes: [
        "Sandbox/controlled acceptance must be recorded before production enable.",
        "Host allowlist and return URL must be canonical.",
      ],
    },
    {
      provider: "idram",
      enabledFlag: idramEnabled,
      configurationValid: idramMissing.length === 0,
      missingEnvNames: idramMissing,
      readyToEnable: idramEnabled && idramMissing.length === 0,
      notes: [
        "RESULT/SUCCESS/FAIL URLs must match merchant portal exactly.",
        "Controlled production verification required before enable.",
      ],
    },
  ];
}

function formatReports(reports: ProviderReadinessReport[]): string {
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

function main(): void {
  const reports = getReports();
  console.log(formatReports(reports));
  const blocked = reports.filter(
    (report) => report.enabledFlag && !report.configurationValid,
  );
  if (blocked.length > 0) {
    process.exitCode = 2;
  }
}

main();
