import type { ArcaNormalizedState } from "@/lib/payments/arca/types";

export type ArcaPaymentMetadata = {
  sourceCartFingerprint?: string;
  arca?: {
    localOrderNumber?: string;
    formUrl?: string;
    initializationState?:
      | "registered"
      | "uncertain"
      | "failed"
      | "pending_register";
    lastVerifiedAt?: string;
    lastOrderStatus?: number | null;
    lastNormalizedState?: ArcaNormalizedState;
    providerErrorCode?: string;
  };
};

export function readArcaPaymentMetadata(
  metadata: Record<string, unknown> | null | undefined,
): ArcaPaymentMetadata {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }
  const sourceCartFingerprint =
    typeof metadata.sourceCartFingerprint === "string"
      ? metadata.sourceCartFingerprint
      : undefined;
  const arcaRaw = metadata.arca;
  if (!arcaRaw || typeof arcaRaw !== "object") {
    return { sourceCartFingerprint };
  }
  const arca = arcaRaw as Record<string, unknown>;
  return {
    sourceCartFingerprint,
    arca: {
      localOrderNumber:
        typeof arca.localOrderNumber === "string"
          ? arca.localOrderNumber
          : undefined,
      formUrl: typeof arca.formUrl === "string" ? arca.formUrl : undefined,
      initializationState:
        arca.initializationState === "registered" ||
        arca.initializationState === "uncertain" ||
        arca.initializationState === "failed" ||
        arca.initializationState === "pending_register"
          ? arca.initializationState
          : undefined,
      lastVerifiedAt:
        typeof arca.lastVerifiedAt === "string"
          ? arca.lastVerifiedAt
          : undefined,
      lastOrderStatus:
        typeof arca.lastOrderStatus === "number"
          ? arca.lastOrderStatus
          : null,
      lastNormalizedState:
        typeof arca.lastNormalizedState === "string"
          ? (arca.lastNormalizedState as ArcaNormalizedState)
          : undefined,
      providerErrorCode:
        typeof arca.providerErrorCode === "string"
          ? arca.providerErrorCode
          : undefined,
    },
  };
}

export function mergeArcaPaymentMetadata(
  existing: Record<string, unknown> | null | undefined,
  patch: Partial<NonNullable<ArcaPaymentMetadata["arca"]>>,
): Record<string, unknown> {
  const current = readArcaPaymentMetadata(existing);
  return {
    ...(existing ?? {}),
    sourceCartFingerprint: current.sourceCartFingerprint,
    arca: {
      ...(current.arca ?? {}),
      ...patch,
    },
  };
}
