import { describe, expect, it } from "vitest";

import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import { renderAdminOrderEmail } from "@/features/notifications/templates/admin-order-email-template";

function sampleDetail(
  overrides?: Partial<AdminOrderDetailView>,
): AdminOrderDetailView {
  return {
    orderNumber: "GR-1001",
    placedAt: "2026-08-08T10:00:00.000Z",
    status: "PENDING",
    paymentStatus: "AWAITING_PAYMENT",
    contactName: "Anna <script>",
    contactEmail: "anna@example.com",
    contactPhone: "+37400000000",
    customerNote: null,
    baseCurrency: "AMD",
    subtotalAmount: 5000,
    deliveryAmount: 500,
    discountAmount: 0,
    totalAmount: 5500,
    deliveryLabel: "Yerevan delivery",
    couponCode: null,
    isPickup: false,
    storeName: "Grill.am",
    shippingMethod: "delivery",
    addressLine: "Abovyan 10, Yerevan",
    addressHint: null,
    paymentMethod: "Cash",
    paymentAmount: 5500,
    cashTenderedAmount: 10000,
    cashChangeAmount: 4500,
    paymentAttempts: [],
    items: [
      {
        id: "item-1",
        title: "Burger & Fries",
        sku: "BF-1",
        imageUrl: null,
        modifierLines: ["Extra cheese", 'Sauce "hot"'],
        quantity: 2,
        unitPriceAmount: 2500,
        lineTotalAmount: 5000,
        currency: "AMD",
      },
    ],
    ...overrides,
  };
}

describe("renderAdminOrderEmail", () => {
  it("renders escaped HTML with full order details", () => {
    const rendered = renderAdminOrderEmail({
      locale: "en",
      storeName: "Grill.am",
      detail: sampleDetail(),
    });

    expect(rendered.subject).toContain("GR-1001");
    expect(rendered.html).toContain("GR-1001");
    expect(rendered.html).toContain("Anna &lt;script&gt;");
    expect(rendered.html).not.toContain("<script>");
    expect(rendered.html).toContain("Extra cheese");
    expect(rendered.html).toContain("Cash");
    expect(rendered.text).toContain("anna@example.com");
    expect(rendered.text).toContain("Abovyan 10, Yerevan");
    expect(rendered.text).toContain("Cash tendered");
  });

  it("shows the pickup branch address for take-away orders", () => {
    const rendered = renderAdminOrderEmail({
      locale: "en",
      storeName: "Grill.am",
      detail: sampleDetail({
        isPickup: true,
        shippingMethod: "pickup",
        deliveryAmount: 0,
        totalAmount: 5000,
        addressLine: "Khorenatsi 95/2, Yerevan, AM",
      }),
    });

    expect(rendered.html).toContain("Khorenatsi 95/2, Yerevan, AM");
    expect(rendered.text).toContain("Khorenatsi 95/2, Yerevan, AM");
  });

  it("supports Russian locale subject", () => {
    const rendered = renderAdminOrderEmail({
      locale: "ru",
      storeName: "Grill.am",
      detail: sampleDetail(),
    });

    expect(rendered.subject).toBe("Новый заказ GR-1001");
    expect(rendered.text).toContain("Клиент");
  });
});
