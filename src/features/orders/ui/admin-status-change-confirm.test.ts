import { describe, expect, it } from "vitest";

import { buildAdminStatusChangeConfirm } from "@/features/orders/ui/admin-status-change-confirm";

const copy = {
  title: "Change status?",
  message: "Change {kind} status from {from} to {to}?",
  kindOrder: "order",
  kindPayment: "payment",
  refundTitle: "Refund this payment?",
  refundMessage: "Bank refund copy",
  cancelPaymentTitle: "Cancel this payment?",
  cancelPaymentMessage: "Local cancel copy",
  confirm: "Confirm",
  back: "Back",
};

describe("buildAdminStatusChangeConfirm", () => {
  it("uses the bank refund warning for Refunded", () => {
    const options = buildAdminStatusChangeConfirm({
      kind: "payment",
      fromLabel: "Paid",
      toValue: "REFUNDED",
      toLabel: "Refunded",
      copy,
    });
    expect(options.title).toBe(copy.refundTitle);
    expect(options.message).toBe(copy.refundMessage);
    expect(options.confirmTone).toBe("danger");
  });

  it("uses the cancel-payment warning for Cancelled", () => {
    const options = buildAdminStatusChangeConfirm({
      kind: "payment",
      fromLabel: "Pending",
      toValue: "CANCELLED",
      toLabel: "Cancelled",
      copy,
    });
    expect(options.title).toBe(copy.cancelPaymentTitle);
    expect(options.confirmTone).toBe("danger");
  });

  it("uses a generic branded confirm for ordinary status moves", () => {
    const options = buildAdminStatusChangeConfirm({
      kind: "order",
      fromLabel: "Pending",
      toValue: "PROCESSING",
      toLabel: "Processing",
      copy,
    });
    expect(options.message).toBe(
      "Change order status from Pending to Processing?",
    );
    expect(options.confirmTone).toBe("info");
  });
});
