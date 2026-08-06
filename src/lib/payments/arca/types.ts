/** Official orderStatus values from Merchant Manual §7.1.5. */
export const ARCA_ORDER_STATUSES = [0, 1, 2, 3, 4, 5, 6] as const;

export type ArcaOrderStatusCode = (typeof ARCA_ORDER_STATUSES)[number];

export type ArcaPaymentMode = "one_stage" | "two_stage";

export type ArcaEnvironment = "test" | "production";

export type ArcaNormalizedState =
  | "captured"
  | "authorized"
  | "pending"
  | "failed"
  | "cancelled"
  | "refunded"
  | "reversed"
  | "unknown"
  | "reconciliation_required";

export type ArcaRegisterSuccess = {
  orderId: string;
  formUrl: string;
  errorCode: 0 | "0" | null;
};

export type ArcaStatusSuccess = {
  orderNumber: string;
  orderStatus: ArcaOrderStatusCode | null;
  actionCode: number | string;
  amount: number | string;
  currency?: number | string | null;
  errorCode?: number | string | null;
  errorMessage?: string | null;
  actionCodeDescription?: string | null;
  /** Present when gateway returns attributes with mdOrder. */
  attributes?: Array<{ name?: string; value?: string }>;
};

export type ArcaClientRegisterInput = {
  orderNumber: string;
  amountMinorUnits: bigint;
  currencyCode: string;
  returnUrl: string;
  language?: string;
  description?: string;
  pageView?: "DESKTOP" | "MOBILE";
  jsonParams?: Record<string, string>;
  sessionTimeoutSecs?: number;
};

export type ArcaClientRegisterResult = {
  providerOrderId: string;
  formUrl: string;
};

export type ArcaClientStatusInput = {
  orderId?: string;
  orderNumber?: string;
  language?: string;
};
