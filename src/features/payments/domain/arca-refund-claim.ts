/** Prevents two staff refunds from both calling refund.do for the full amount. */
export const ARCA_REFUND_CLAIM_TTL_MS = 120_000;

export function isArcaRefundClaimActive(
  claimedAtIso: string | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!claimedAtIso) {
    return false;
  }
  const claimedMs = Date.parse(claimedAtIso);
  if (!Number.isFinite(claimedMs)) {
    return false;
  }
  return nowMs - claimedMs < ARCA_REFUND_CLAIM_TTL_MS;
}
