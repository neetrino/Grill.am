import type {
  ArcaNormalizedState,
  ArcaOrderStatusCode,
  ArcaPaymentMode,
} from "@/lib/payments/arca/types";

export type ArcaStatusMapping = {
  officialCode: ArcaOrderStatusCode;
  officialMeaning: string;
  localState: ArcaNormalizedState;
  sideEffects: string;
};

/**
 * Exhaustive mapping from Merchant Manual §7.1.5 OrderStatus table
 * and §5.5–5.6 lifecycle names.
 */
export const ARCA_STATUS_MAP: readonly ArcaStatusMapping[] = [
  {
    officialCode: 0,
    officialMeaning: "Order registered but not paid (CREATED)",
    localState: "pending",
    sideEffects: "Keep PENDING; no stock/cart mutation",
  },
  {
    officialCode: 1,
    officialMeaning: "Amount held on card (APPROVED, two-stage)",
    localState: "authorized",
    sideEffects:
      "Record AUTHORIZED only; not CAPTURED unless merchant deposits",
  },
  {
    officialCode: 2,
    officialMeaning: "Full authorization / funds deposited (DEPOSITED)",
    localState: "captured",
    sideEffects: "confirmPayment (CAPTURED + stock once)",
  },
  {
    officialCode: 3,
    officialMeaning: "Authorization reversed (REVERSED)",
    localState: "reversed",
    sideEffects: "Do not fail as ordinary decline; review/reconcile",
  },
  {
    officialCode: 4,
    officialMeaning: "Refund performed (REFUNDED)",
    localState: "refunded",
    sideEffects: "Not ordinary FAILED; reconciliation",
  },
  {
    officialCode: 5,
    officialMeaning: "ACS authorization initiated (3DS in progress)",
    localState: "pending",
    sideEffects: "Keep PENDING; allow recheck",
  },
  {
    officialCode: 6,
    officialMeaning: "Authorization declined (DECLINED)",
    localState: "failed",
    sideEffects: "failPayment(FAILED)",
  },
] as const;

const BY_CODE = new Map(
  ARCA_STATUS_MAP.map((row) => [row.officialCode, row] as const),
);

export function mapArcaOrderStatus(
  code: ArcaOrderStatusCode | null,
  mode: ArcaPaymentMode,
): ArcaStatusMapping {
  if (code === null) {
    return {
      officialCode: 0,
      officialMeaning: "Unknown / missing orderStatus",
      localState: "unknown",
      sideEffects: "Preserve state; do not capture or fail",
    };
  }

  const mapped = BY_CODE.get(code);
  if (!mapped) {
    return {
      officialCode: code,
      officialMeaning: "Undocumented orderStatus",
      localState: "unknown",
      sideEffects: "Preserve state; mark for review",
    };
  }

  // One-stage merchants should not treat hold (1) as success.
  if (code === 1 && mode === "one_stage") {
    return {
      ...mapped,
      localState: "reconciliation_required",
      sideEffects:
        "Unexpected APPROVED under one-stage config — operator review",
    };
  }

  return mapped;
}

export function isDocumentedArcaOrderStatus(
  code: number,
): code is ArcaOrderStatusCode {
  return BY_CODE.has(code as ArcaOrderStatusCode);
}
