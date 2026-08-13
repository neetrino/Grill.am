import { describe, expect, it } from "vitest";

import { checkoutSchema } from "@/features/checkout/schemas";
import { GRILL_STORE_LOCATIONS } from "@/features/stores/yandex-map-embed";

const pickupStoreId = GRILL_STORE_LOCATIONS[0]?.id ?? "khorenatsi-95-2";

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    firstName: "Anna",
    lastName: "Hakobyan",
    contactEmail: "anna@example.com",
    contactPhone: "+37491111111",
    shippingMethod: "pickup",
    paymentMethod: "cash_on_delivery",
    pickupStoreId,
    idempotencyKey: "idempotency-key-ok",
    locale: "en",
    ...overrides,
  };
}

describe("checkoutSchema pickup branch", () => {
  it("accepts a known pickup store id", () => {
    const parsed = checkoutSchema.safeParse(baseInput());
    expect(parsed.success).toBe(true);
  });

  it("rejects pickup without a store id", () => {
    const parsed = checkoutSchema.safeParse(
      baseInput({ pickupStoreId: undefined }),
    );
    expect(parsed.success).toBe(false);
  });

  it("rejects an unknown pickup store id", () => {
    const parsed = checkoutSchema.safeParse(
      baseInput({ pickupStoreId: "not-a-real-store" }),
    );
    expect(parsed.success).toBe(false);
  });

  it("does not require pickupStoreId for delivery", () => {
    const parsed = checkoutSchema.safeParse(
      baseInput({
        shippingMethod: "delivery",
        pickupStoreId: undefined,
        deliveryRuleId: "11111111-1111-4111-8111-111111111111",
        line1: "Abovyan 10",
      }),
    );
    expect(parsed.success).toBe(true);
  });
});
