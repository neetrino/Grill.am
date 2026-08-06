import {
  PaymentAmountMismatchError,
  PaymentCurrencyMismatchError,
} from "@/features/payments/domain/errors";

export type ConfirmAmountCheckInput = {
  verifiedAmount: number;
  verifiedCurrency: string;
  paymentAmount: number;
  paymentCurrency: string;
  orderTotalAmount: number;
  orderCurrency: string;
};

/**
 * Server-authoritative amount/currency checks for payment confirmation.
 * Throws domain errors on mismatch.
 */
export function assertConfirmPaymentAmounts(
  input: ConfirmAmountCheckInput,
): void {
  if (input.verifiedAmount !== input.paymentAmount) {
    throw new PaymentAmountMismatchError();
  }

  if (
    input.verifiedCurrency.toUpperCase() !==
    input.paymentCurrency.toUpperCase()
  ) {
    throw new PaymentCurrencyMismatchError();
  }

  if (
    input.verifiedAmount !== input.orderTotalAmount ||
    input.verifiedCurrency.toUpperCase() !== input.orderCurrency.toUpperCase()
  ) {
    throw new PaymentAmountMismatchError();
  }
}
