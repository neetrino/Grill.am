import type { ConfirmDeleteOptions } from "@/components/modal/ConfirmDeleteProvider";
import { formatAdminMessage } from "@/features/admin/ui/format-admin-message";
import type { AdminDictionary } from "@/lib/i18n/get-dictionary";

type StatusConfirmCopy = AdminDictionary["orders"]["statusConfirm"];

/**
 * Branded confirm copy for admin order/payment status changes.
 */
export function buildAdminStatusChangeConfirm(input: {
  kind: "order" | "payment";
  fromLabel: string;
  toValue: string;
  toLabel: string;
  copy: StatusConfirmCopy;
}): ConfirmDeleteOptions {
  const { copy } = input;
  const kindLabel =
    input.kind === "order" ? copy.kindOrder : copy.kindPayment;
  const isRefund = input.kind === "payment" && input.toValue === "REFUNDED";
  const isPaymentCancel =
    input.kind === "payment" && input.toValue === "CANCELLED";
  const isDestructive =
    isRefund || isPaymentCancel || input.toValue === "CANCELLED";

  if (isRefund) {
    return {
      title: copy.refundTitle,
      message: copy.refundMessage,
      confirmText: copy.confirm,
      cancelText: copy.back,
      confirmTone: "danger",
    };
  }

  if (isPaymentCancel) {
    return {
      title: copy.cancelPaymentTitle,
      message: copy.cancelPaymentMessage,
      confirmText: copy.confirm,
      cancelText: copy.back,
      confirmTone: "danger",
    };
  }

  return {
    title: copy.title,
    message: formatAdminMessage(copy.message, {
      kind: kindLabel,
      from: input.fromLabel,
      to: input.toLabel,
    }),
    confirmText: copy.confirm,
    cancelText: copy.back,
    confirmTone: isDestructive ? "danger" : "info",
  };
}
