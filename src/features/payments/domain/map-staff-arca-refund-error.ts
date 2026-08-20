import {
  isPaymentDomainError,
  PaymentAmountMismatchError,
  PaymentCurrencyMismatchError,
  PaymentRefundInProgressError,
  PaymentRefundNotAllowedError,
  PaymentRefundUnconfirmedError,
} from "@/features/payments/domain/errors";
import {
  ArcaBusinessError,
  isArcaProtocolError,
} from "@/lib/payments/arca/errors";

export type StaffArcaRefundFailure = {
  code: string;
  message: string;
};

const GENERIC_MESSAGE = "Unable to refund this payment right now.";

const MESSAGES = {
  ARCA_ACCESS_DENIED:
    "The bank API login cannot reverse or refund. Ask the bank to enable reverse and refund for this merchant user.",
  ARCA_REFUND_INVALID_STATE:
    "The bank refused this refund (payment state or amount). Check the payment in the ARCA cabinet.",
  ARCA_ORDER_NOT_FOUND: "The bank did not find this payment.",
  PAYMENT_REFUND_NOT_ALLOWED:
    "This payment cannot be refunded through the bank in its current state.",
  PAYMENT_REFUND_UNCONFIRMED:
    "The bank accepted the refund request, but the status is not updated yet. Wait a minute and try again.",
  PAYMENT_REFUND_IN_PROGRESS:
    "A refund is already in progress. Wait and refresh.",
  PAYMENT_AMOUNT_MISMATCH:
    "The amount at the bank does not match this payment.",
  PAYMENT_REFUND_FAILED: GENERIC_MESSAGE,
} as const;

/** Maps refund failures to a stable staff error code (safe for UI). */
export function mapStaffArcaRefundError(error: unknown): StaffArcaRefundFailure {
  if (error instanceof PaymentRefundInProgressError) {
    return failure("PAYMENT_REFUND_IN_PROGRESS");
  }
  if (error instanceof PaymentRefundUnconfirmedError) {
    return failure("PAYMENT_REFUND_UNCONFIRMED");
  }
  if (error instanceof PaymentRefundNotAllowedError) {
    return failure("PAYMENT_REFUND_NOT_ALLOWED");
  }
  if (
    error instanceof PaymentAmountMismatchError ||
    error instanceof PaymentCurrencyMismatchError
  ) {
    return failure("PAYMENT_AMOUNT_MISMATCH");
  }
  if (error instanceof ArcaBusinessError) {
    return mapArcaBusinessRefundError(error.providerErrorCode);
  }
  if (isPaymentDomainError(error) || isArcaProtocolError(error)) {
    return failure("PAYMENT_REFUND_FAILED");
  }
  return failure("PAYMENT_REFUND_FAILED");
}

function mapArcaBusinessRefundError(providerErrorCode: string): StaffArcaRefundFailure {
  if (providerErrorCode === "5") {
    return failure("ARCA_ACCESS_DENIED");
  }
  if (providerErrorCode === "6") {
    return failure("ARCA_ORDER_NOT_FOUND");
  }
  if (providerErrorCode === "7") {
    return failure("ARCA_REFUND_INVALID_STATE");
  }
  return failure("PAYMENT_REFUND_FAILED");
}

function failure(code: keyof typeof MESSAGES): StaffArcaRefundFailure {
  return { code, message: MESSAGES[code] };
}

/** Bank `errorCode` only — never credentials or raw bodies. */
export function staffRefundProviderErrorCode(error: unknown): string | null {
  return error instanceof ArcaBusinessError ? error.providerErrorCode : null;
}

export function staffRefundErrorClass(error: unknown): string | null {
  return error instanceof Error ? error.name : null;
}
