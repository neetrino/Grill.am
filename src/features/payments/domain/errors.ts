/** Base class for payment-domain failures (safe message for logs / mapping). */
export class PaymentDomainError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "PaymentDomainError";
    this.code = code;
  }
}

export class PaymentMethodDisabledError extends PaymentDomainError {
  constructor(method: string) {
    super(
      "PAYMENT_METHOD_DISABLED",
      `Payment method "${method}" is not available.`,
    );
    this.name = "PaymentMethodDisabledError";
  }
}

export class PaymentProviderNotConfiguredError extends PaymentDomainError {
  constructor(provider: string) {
    super(
      "PAYMENT_PROVIDER_NOT_CONFIGURED",
      `Payment provider "${provider}" is not configured yet.`,
    );
    this.name = "PaymentProviderNotConfiguredError";
  }
}

export class PaymentAmountMismatchError extends PaymentDomainError {
  constructor() {
    super(
      "PAYMENT_AMOUNT_MISMATCH",
      "Verified payment amount does not match the payment attempt.",
    );
    this.name = "PaymentAmountMismatchError";
  }
}

export class PaymentCurrencyMismatchError extends PaymentDomainError {
  constructor() {
    super(
      "PAYMENT_CURRENCY_MISMATCH",
      "Verified payment currency does not match the payment attempt.",
    );
    this.name = "PaymentCurrencyMismatchError";
  }
}

export class PaymentAlreadyCapturedError extends PaymentDomainError {
  constructor() {
    super(
      "PAYMENT_ALREADY_CAPTURED",
      "Payment attempt is already captured.",
    );
    this.name = "PaymentAlreadyCapturedError";
  }
}

export class InvalidPaymentTransitionError extends PaymentDomainError {
  constructor(from: string, to: string) {
    super(
      "INVALID_PAYMENT_TRANSITION",
      `Cannot transition payment from ${from} to ${to}.`,
    );
    this.name = "InvalidPaymentTransitionError";
  }
}

export class InsufficientStockAtConfirmationError extends PaymentDomainError {
  constructor() {
    super(
      "INSUFFICIENT_STOCK_AT_CONFIRMATION",
      "Insufficient stock to fulfill the paid order.",
    );
    this.name = "InsufficientStockAtConfirmationError";
  }
}

export class PaymentNotFoundError extends PaymentDomainError {
  constructor() {
    super("PAYMENT_NOT_FOUND", "Payment attempt was not found.");
    this.name = "PaymentNotFoundError";
  }
}

export class PaymentRefundNotAllowedError extends PaymentDomainError {
  constructor() {
    super(
      "PAYMENT_REFUND_NOT_ALLOWED",
      "This payment cannot be refunded through the bank.",
    );
    this.name = "PaymentRefundNotAllowedError";
  }
}

export class PaymentRefundUnconfirmedError extends PaymentDomainError {
  constructor() {
    super(
      "PAYMENT_REFUND_UNCONFIRMED",
      "Bank refund was requested but the payment status is not yet refunded.",
    );
    this.name = "PaymentRefundUnconfirmedError";
  }
}

export class PaymentAlreadyRefundedError extends PaymentDomainError {
  constructor() {
    super(
      "PAYMENT_ALREADY_REFUNDED",
      "This payment has already been refunded.",
    );
    this.name = "PaymentAlreadyRefundedError";
  }
}

export class PaymentRefundInProgressError extends PaymentDomainError {
  constructor() {
    super(
      "PAYMENT_REFUND_IN_PROGRESS",
      "A refund is already in progress for this payment.",
    );
    this.name = "PaymentRefundInProgressError";
  }
}

export function isPaymentDomainError(
  error: unknown,
): error is PaymentDomainError {
  return error instanceof PaymentDomainError;
}
