import { describe, expect, it } from "vitest";

import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import {
  renderCustomerCodOrderCreatedEmail,
  renderCustomerPaymentCapturedEmail,
  renderCustomerPaymentFailedEmail,
} from "@/features/notifications/templates/customer-order-email-template";

function sampleDetail(
  overrides?: Partial<AdminOrderDetailView>,
): AdminOrderDetailView {
  return {
    orderNumber: "GR-2002",
    placedAt: "2026-08-08T12:00:00.000Z",
    status: "CONFIRMED",
    paymentStatus: "PAID",
    contactName: "Sam <img>",
    contactEmail: "sam@example.com",
    contactPhone: "+37411111111",
    customerNote: null,
    baseCurrency: "AMD",
    subtotalAmount: 3000,
    deliveryAmount: 0,
    discountAmount: 0,
    totalAmount: 3000,
    deliveryLabel: null,
    couponCode: null,
    isPickup: true,
    storeName: "Grill.am",
    shippingMethod: "pickup",
    addressLine: "",
    addressHint: null,
    paymentMethod: "Card",
    paymentAmount: 3000,
    cashTenderedAmount: null,
    cashChangeAmount: null,
    paymentAttempts: [],
    items: [
      {
        id: "item-2",
        title: "Chicken Wrap",
        sku: "CW-1",
        imageUrl: null,
        modifierLines: ["No onion"],
        quantity: 1,
        unitPriceAmount: 3000,
        lineTotalAmount: 3000,
        currency: "AMD",
      },
    ],
    ...overrides,
  };
}

describe("renderCustomerCodOrderCreatedEmail", () => {
  it("renders rich HTML with escaped user content and order lines", () => {
    const rendered = renderCustomerCodOrderCreatedEmail({
      locale: "en",
      storeName: "Grill.am",
      detail: sampleDetail(),
      amountFormatted: "3,000 ֏",
    });

    expect(rendered.subject).toContain("GR-2002");
    expect(rendered.html).toContain("GR-2002");
    expect(rendered.html).toContain("Chicken Wrap");
    expect(rendered.html).toContain("3,000");
    expect(rendered.html).toContain("Sam &lt;img&gt;");
    expect(rendered.html).not.toContain("<img>");
    expect(rendered.html).not.toContain("REQUIRES_REVIEW");
    expect(rendered.text).toContain("pay on delivery");
    expect(rendered.text).toContain("No onion");
  });
});

describe("renderCustomerPaymentCapturedEmail", () => {
  it("includes payment received copy in subject", () => {
    const rendered = renderCustomerPaymentCapturedEmail({
      locale: "en",
      storeName: "Grill.am",
      detail: sampleDetail(),
      amountFormatted: "3,000 ֏",
    });

    expect(rendered.subject).toContain("Payment received");
    expect(rendered.html).toContain("Thank you for ordering");
  });
});

describe("renderCustomerPaymentFailedEmail", () => {
  it("shows a failed-payment status banner in HTML", () => {
    const rendered = renderCustomerPaymentFailedEmail({
      locale: "en",
      storeName: "Grill.am",
      detail: sampleDetail({ paymentStatus: "FAILED" }),
      amountFormatted: "3,000 ֏",
    });

    expect(rendered.subject).toContain("Payment not completed");
    expect(rendered.html).toContain("Payment was not completed");
  });
});
