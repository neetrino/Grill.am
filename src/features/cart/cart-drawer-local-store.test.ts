import { beforeEach, describe, expect, it } from "vitest";

import { resetCartClientSyncForTests } from "@/features/cart/cart-client-sync";
import {
  applyDesiredCartLine,
  getCartDrawerLocalView,
  getDisplayedCartLineQuantity,
  recalculateLocalCartView,
  replaceCartDrawerViewFromServer,
  resetCartDrawerLocalStoreForTests,
  type OptimisticCartLineInput,
} from "@/features/cart/cart-drawer-local-store";
import type {
  CartDrawerItemView,
  CartDrawerView,
} from "@/features/cart/get-cart-drawer-view";
import { formatMoneyAmount } from "@/lib/money/format";

function displayLine(
  productId: string,
  quantity: number,
  unitPriceAmount: number,
  selectionKey = "",
): OptimisticCartLineInput {
  return {
    productId,
    selectionKey,
    title: productId,
    slug: productId,
    quantity,
    imageUrl: null,
    unitPriceAmount,
    locale: "hy",
    currency: "AMD",
    modifierLines: [],
  };
}

function moneyLine(input: {
  id: string;
  productId: string;
  selectionKey?: string;
  title: string;
  slug: string;
  quantity: number;
  unitPriceAmount: number;
}): CartDrawerItemView {
  const unitPriceAmount = input.unitPriceAmount;
  const lineTotalAmount = unitPriceAmount * input.quantity;
  return {
    id: input.id,
    productId: input.productId,
    selectionKey: input.selectionKey ?? "",
    title: input.title,
    slug: input.slug,
    quantity: input.quantity,
    imageUrl: null,
    unitPriceAmount,
    lineTotalAmount,
    unitPriceFormatted: formatMoneyAmount(unitPriceAmount, "AMD", "hy"),
    lineTotalFormatted: formatMoneyAmount(lineTotalAmount, "AMD", "hy"),
    modifierLines: [],
  };
}

function serverView(items: CartDrawerItemView[]): CartDrawerView {
  const subtotalAmount = items.reduce(
    (sum, item) => sum + item.unitPriceAmount * item.quantity,
    0,
  );
  return recalculateLocalCartView({
    locale: "hy",
    currency: "AMD",
    itemCount: 0,
    items,
    subtotalAmount,
    adjustmentsAmount: 0,
    shippingAmount: 0,
    totalAmount: subtotalAmount,
    subtotalFormatted: "",
    shippingFormatted: formatMoneyAmount(0, "AMD", "hy"),
    totalFormatted: "",
  });
}

describe("cart-drawer-local-store desired overlay", () => {
  beforeEach(() => {
    resetCartDrawerLocalStoreForTests();
    resetCartClientSyncForTests();
  });

  it("adds a new item and increases subtotal immediately", () => {
    applyDesiredCartLine({
      productId: "p1",
      selectionKey: "",
      desiredQuantity: 1,
      display: displayLine("p1", 1, 3500),
    });

    const view = getCartDrawerLocalView();
    expect(view?.subtotalAmount).toBe(3500);
    expect(view?.totalAmount).toBe(3500);
    expect(view?.items[0]?.lineTotalAmount).toBe(3500);
  });

  it("calculates line total for quantity greater than one", () => {
    applyDesiredCartLine({
      productId: "p1",
      selectionKey: "",
      desiredQuantity: 2,
      display: displayLine("p1", 2, 3500),
    });

    expect(getCartDrawerLocalView()?.items[0]?.lineTotalAmount).toBe(7000);
    expect(getCartDrawerLocalView()?.subtotalAmount).toBe(7000);
  });

  it("keeps variants separate and sums both into subtotal", () => {
    applyDesiredCartLine({
      productId: "p1",
      selectionKey: "",
      desiredQuantity: 1,
      display: displayLine("p1", 1, 3500),
    });
    applyDesiredCartLine({
      productId: "p1",
      selectionKey: '{"optionChoices":{"size":"l"}}',
      desiredQuantity: 1,
      display: displayLine("p1", 1, 4000, '{"optionChoices":{"size":"l"}}'),
    });

    expect(getCartDrawerLocalView()?.items).toHaveLength(2);
    expect(getCartDrawerLocalView()?.subtotalAmount).toBe(7500);
  });

  it("overlays newer desired quantity on a stale server snapshot", () => {
    applyDesiredCartLine({
      productId: "p1",
      selectionKey: "",
      desiredQuantity: 3,
      display: displayLine("p1", 3, 3500),
    });

    replaceCartDrawerViewFromServer(
      serverView([
        moneyLine({
          id: "server-line",
          productId: "p1",
          title: "p1",
          slug: "p1",
          quantity: 2,
          unitPriceAmount: 3500,
        }),
      ]),
    );

    expect(getDisplayedCartLineQuantity("p1", "")).toBe(3);
    expect(getCartDrawerLocalView()?.items[0]?.quantity).toBe(3);
  });

  it("hides a line whose desired quantity is 0 even if the server still has it", () => {
    replaceCartDrawerViewFromServer(
      serverView([
        moneyLine({
          id: "server-line",
          productId: "p1",
          title: "p1",
          slug: "p1",
          quantity: 1,
          unitPriceAmount: 3500,
        }),
      ]),
    );
    applyDesiredCartLine({
      productId: "p1",
      selectionKey: "",
      desiredQuantity: 0,
    });

    expect(getCartDrawerLocalView()?.items).toHaveLength(0);
    expect(getCartDrawerLocalView()?.subtotalAmount).toBe(0);
  });

  it("keeps pending optimistic lines during stale reconcile", () => {
    applyDesiredCartLine({
      productId: "p-new",
      selectionKey: "",
      desiredQuantity: 1,
      display: displayLine("p-new", 1, 3500),
    });

    replaceCartDrawerViewFromServer(
      serverView([
        moneyLine({
          id: "server-1",
          productId: "p-old",
          title: "Old",
          slug: "old",
          quantity: 1,
          unitPriceAmount: 10_000,
        }),
      ]),
    );

    expect(getCartDrawerLocalView()?.items.map((item) => item.productId)).toEqual(
      ["p-old", "p-new"],
    );
    expect(getCartDrawerLocalView()?.subtotalAmount).toBe(13_500);
  });

  it("ignores an older server revision", () => {
    replaceCartDrawerViewFromServer(
      serverView([
        moneyLine({
          id: "v2",
          productId: "p1",
          title: "p1",
          slug: "p1",
          quantity: 2,
          unitPriceAmount: 3500,
        }),
      ]),
      2,
    );
    replaceCartDrawerViewFromServer(
      serverView([
        moneyLine({
          id: "v1",
          productId: "p1",
          title: "p1",
          slug: "p1",
          quantity: 1,
          unitPriceAmount: 3500,
        }),
      ]),
      1,
    );

    expect(getCartDrawerLocalView()?.items[0]?.quantity).toBe(2);
  });
});
