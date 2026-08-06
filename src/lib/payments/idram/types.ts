export type IdramLanguage = "EN" | "AM" | "RU";

export type IdramPaymentFormPayload = {
  type: "payment_form_required";
  provider: "idram";
  orderId: string;
  orderNumber: string;
  paymentId: string;
  action: string;
  method: "POST";
  fields: Record<string, string>;
};

/** Exact official RESULT_URL success body (Merchant API §4). */
export const IDRAM_RESULT_OK_BODY = "OK";

/** Non-OK failure body — official docs only require absence of exact OK. */
export const IDRAM_RESULT_FAIL_BODY = "NO";

export type IdramResultBody =
  | typeof IDRAM_RESULT_OK_BODY
  | typeof IDRAM_RESULT_FAIL_BODY;

/** Official payment form action (Merchant API §2). */
export const IDRAM_OFFICIAL_PAYMENT_URL =
  "https://banking.idram.am/Payment/GetPayment";

/** Local policy: abandoned PENDING attempts expire after this duration. */
export const IDRAM_ATTEMPT_TTL_MS = 60 * 60 * 1000;
