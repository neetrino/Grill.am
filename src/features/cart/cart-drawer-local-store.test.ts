import { describe, expect, it, beforeEach } from "vitest";

import {
  acknowledgeOptimisticAdd,
  getCartDrawerLocalView,
  getPendingOptimisticAdds,
  recalculateLocalCartView,
  removeItemLocallyShared,
  replaceCartDrawerViewFromServer,
  resetCartDrawerLocalStoreForTests,
  rollbackUpsertLocally,
  setQuantityLocallyShared,
  upsertItemLocally,
} from "@/features/cart/cart-drawer-local-store";
import type {
  CartDrawerItemView,
  CartDrawerView,
} from "@/features/cart/get-cart-drawer-view";
import { formatMoneyAmount } from "@/lib/money/format";

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

function addLine(input: {
  productId: string;
  selectionKey?: string;
  title: string;
  slug: string;
  quantity: number;
  unitPriceAmount: number;
  modifierLines?: string[];
}) {
  return upsertItemLocally({
    productId: input.productId,
    selectionKey: input.selectionKey ?? "",
    title: input.title,
    slug: input.slug,
    quantity: input.quantity,
    imageUrl: null,
    unitPriceAmount: input.unitPriceAmount,
    locale: "hy",
    currency: "AMD",
    modifierLines: input.modifierLines ?? [],
  });
}

describe("cart-drawer-local-store optimistic money", () => {
  beforeEach(() => {
    resetCartDrawerLocalStoreForTests();
  });

  it("adds a new item and increases subtotal immediately", () => {
    addLine({
      productId: "p1",
      title: "Burger",
      slug: "burger",
      quantity: 1,
      unitPriceAmount: 3500,
    });

    const view = getCartDrawerLocalView();
    expect(view?.subtotalAmount).toBe(3500);
    expect(view?.totalAmount).toBe(3500);
    expect(view?.subtotalFormatted).toBe(formatMoneyAmount(3500, "AMD", "hy"));
    expect(view?.items[0]?.lineTotalAmount).toBe(3500);
  });

  it("calculates line total for quantity greater than one", () => {
    addLine({
      productId: "p1",
      title: "Burger",
      slug: "burger",
      quantity: 2,
      unitPriceAmount: 3500,
    });

    const view = getCartDrawerLocalView();
    expect(view?.items[0]?.quantity).toBe(2);
    expect(view?.items[0]?.lineTotalAmount).toBe(7000);
    expect(view?.subtotalAmount).toBe(7000);
    expect(view?.subtotalFormatted).toBe(formatMoneyAmount(7000, "AMD", "hy"));
  });

  it("increases quantity and subtotal for the same line", () => {
    addLine({
      productId: "p1",
      title: "Burger",
      slug: "burger",
      quantity: 1,
      unitPriceAmount: 3500,
    });
    addLine({
      productId: "p1",
      title: "Burger",
      slug: "burger",
      quantity: 2,
      unitPriceAmount: 3500,
    });

    const view = getCartDrawerLocalView();
    expect(view?.items).toHaveLength(1);
    expect(view?.items[0]?.quantity).toBe(3);
    expect(view?.subtotalAmount).toBe(10_500);
  });

  it("keeps variants separate and sums both into subtotal", () => {
    addLine({
      productId: "p1",
      selectionKey: "",
      title: "Burger",
      slug: "burger",
      quantity: 1,
      unitPriceAmount: 3500,
    });
    addLine({
      productId: "p1",
      selectionKey: '{"optionChoices":{"size":"l"}}',
      title: "Burger",
      slug: "burger",
      quantity: 1,
      unitPriceAmount: 4000,
      modifierLines: ["Size: Large"],
    });

    const view = getCartDrawerLocalView();
    expect(view?.items).toHaveLength(2);
    expect(view?.subtotalAmount).toBe(7500);
  });

  it("rolls back and restores the previous subtotal", () => {
    addLine({
      productId: "existing",
      title: "Fries",
      slug: "fries",
      quantity: 1,
      unitPriceAmount: 1000,
    });
    acknowledgeOptimisticAdd();

    const failed = addLine({
      productId: "p1",
      title: "Burger",
      slug: "burger",
      quantity: 2,
      unitPriceAmount: 3500,
    });
    expect(getCartDrawerLocalView()?.subtotalAmount).toBe(8000);

    rollbackUpsertLocally(failed);

    expect(getCartDrawerLocalView()?.subtotalAmount).toBe(1000);
    expect(getCartDrawerLocalView()?.items).toHaveLength(1);
    expect(getPendingOptimisticAdds()).toBe(0);
  });

  it("recalculates subtotal when quantity changes", () => {
    addLine({
      productId: "p1",
      title: "Burger",
      slug: "burger",
      quantity: 1,
      unitPriceAmount: 3500,
    });
    const itemId = getCartDrawerLocalView()?.items[0]?.id;
    expect(itemId).toBeTruthy();

    setQuantityLocallyShared(itemId!, 3);

    expect(getCartDrawerLocalView()?.items[0]?.lineTotalAmount).toBe(10_500);
    expect(getCartDrawerLocalView()?.subtotalAmount).toBe(10_500);
  });

  it("recalculates subtotal when a line is removed", () => {
    addLine({
      productId: "p1",
      title: "Burger",
      slug: "burger",
      quantity: 1,
      unitPriceAmount: 3500,
    });
    addLine({
      productId: "p2",
      title: "Fries",
      slug: "fries",
      quantity: 1,
      unitPriceAmount: 1000,
    });
    const burgerId = getCartDrawerLocalView()?.items.find(
      (item) => item.productId === "p1",
    )?.id;
    expect(burgerId).toBeTruthy();

    removeItemLocallyShared(burgerId!);

    expect(getCartDrawerLocalView()?.subtotalAmount).toBe(1000);
    expect(getCartDrawerLocalView()?.items).toHaveLength(1);
  });

  it("includes pending optimistic lines in subtotal during stale reconcile", () => {
    addLine({
      productId: "p-new",
      title: "New",
      slug: "new",
      quantity: 1,
      unitPriceAmount: 3500,
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

    const view = getCartDrawerLocalView();
    expect(view?.items.map((item) => item.productId)).toEqual([
      "p-old",
      "p-new",
    ]);
    expect(view?.subtotalAmount).toBe(13_500);
  });

  it("replaces optimistic prices after final server reconciliation", () => {
    addLine({
      productId: "p1",
      title: "Burger",
      slug: "burger",
      quantity: 1,
      unitPriceAmount: 3500,
    });
    acknowledgeOptimisticAdd();

    replaceCartDrawerViewFromServer(
      serverView([
        moneyLine({
          id: "server-line",
          productId: "p1",
          title: "Burger",
          slug: "burger",
          quantity: 1,
          unitPriceAmount: 3200,
        }),
      ]),
    );

    const view = getCartDrawerLocalView();
    expect(view?.items).toHaveLength(1);
    expect(view?.items[0]?.unitPriceAmount).toBe(3200);
    expect(view?.subtotalAmount).toBe(3200);
    expect(getPendingOptimisticAdds()).toBe(0);
  });

  it("does not corrupt totals when first add fails and second succeeds", () => {
    const first = addLine({
      productId: "p1",
      title: "Burger",
      slug: "burger",
      quantity: 1,
      unitPriceAmount: 3500,
    });
    const second = addLine({
      productId: "p2",
      title: "Fries",
      slug: "fries",
      quantity: 1,
      unitPriceAmount: 1000,
    });

    expect(getCartDrawerLocalView()?.subtotalAmount).toBe(4500);

    rollbackUpsertLocally(first);
    acknowledgeOptimisticAdd(); // second succeeds

    expect(getCartDrawerLocalView()?.subtotalAmount).toBe(1000);
    expect(getCartDrawerLocalView()?.items.map((i) => i.productId)).toEqual([
      "p2",
    ]);
    expect(second.created).toBe(true);
  });

  it("supports acceptance example: 10000 + 3500×2 = 17000 immediately", () => {
    replaceCartDrawerViewFromServer(
      serverView([
        moneyLine({
          id: "server-old",
          productId: "old",
          title: "Existing",
          slug: "existing",
          quantity: 1,
          unitPriceAmount: 10_000,
        }),
      ]),
    );

    addLine({
      productId: "p1",
      title: "Burger",
      slug: "burger",
      quantity: 2,
      unitPriceAmount: 3500,
    });

    expect(getCartDrawerLocalView()?.subtotalAmount).toBe(17_000);
    expect(getCartDrawerLocalView()?.subtotalFormatted).toBe(
      formatMoneyAmount(17_000, "AMD", "hy"),
    );
    expect(getCartDrawerLocalView()?.totalFormatted).toBe(
      formatMoneyAmount(17_000, "AMD", "hy"),
    );
  });
});
