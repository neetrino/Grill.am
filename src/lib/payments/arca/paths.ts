/** Official Merchant Manual §9 / §7.1 path suffixes. */
export const ARCA_REGISTER_PATH = "/register.do";
export const ARCA_REGISTER_PREAUTH_PATH = "/registerPreAuth.do";
export const ARCA_STATUS_PATH = "/getOrderStatusExtended.do";
export const ARCA_REVERSE_PATH = "/reverse.do";
export const ARCA_REFUND_PATH = "/refund.do";

export function resolveRegisterPath(
  mode: "one_stage" | "two_stage",
): string {
  return mode === "two_stage"
    ? ARCA_REGISTER_PREAUTH_PATH
    : ARCA_REGISTER_PATH;
}

export function isFormUrlHostAllowed(
  formUrl: string,
  allowedHosts: readonly string[],
): boolean {
  let parsed: URL;
  try {
    parsed = new URL(formUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return false;
  }
  const host = parsed.host.toLowerCase();
  return allowedHosts.some((allowed) => allowed.toLowerCase() === host);
}
