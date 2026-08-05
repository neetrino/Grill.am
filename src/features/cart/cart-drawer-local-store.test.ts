import { describe, expect, it, beforeEach } from "vitest";

import {
  acknowledgeOptimisticAdd,
  getCartDrawerLocalView,
  getPendingOptimisticAdds,
  replaceCartDrawerViewFromServer,
  resetCartDrawerLocalStoreForTests,
  rollbackUpsertLocally,
  upsertItemLocally,
} from "@/features/cart/cart-drawer-local-store";
import type { CartDrawerView } from "@/features/cart/get-cart-drawer-view";

function serverView(
  items: CartDrawerView["items"],
): CartDrawerView {
  return {
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    items,
    subtotalFormatted: "1,000 ֏",
    shippingFormatted: "0 ֏",
    totalFormatted: "1,000 ֏",
  };
}

describe("cart-drawer-local-store optimistic upsert", () => {
  beforeEach(() => {
    resetCartDrawerLocalStoreForTests();
  });

  it("inserts a new optimistic line and bumps pending count", () => {
    const result = upsertItemLocally({
      productId: "p1",
      selectionKey: "",
      title: "Burger",
      slug: "burger",
      quantity: 1,
      imageUrl: "/burger.webp",
      unitPriceFormatted: "2,000 ֏",
      modifierLines: [],
    });

    expect(result.created).toBe(true);
    expect(result.quantityDelta).toBe(1);
    expect(result.previousItem).toBeNull();
    expect(getPendingOptimisticAdds()).toBe(1);

    const view = getCartDrawerLocalView();
    expect(view?.items).toHaveLength(1);
    expect(view?.items[0]).toMatchObject({
      id: "optimistic:p1::",
      productId: "p1",
      selectionKey: "",
      title: "Burger",
      quantity: 1,
      unitPriceFormatted: "2,000 ֏",
    });
    expect(view?.itemCount).toBe(1);
  });

  it("increases quantity for the same product + selectionKey", () => {
    upsertItemLocally({
      productId: "p1",
      selectionKey: "",
      title: "Burger",
      slug: "burger",
      quantity: 1,
      imageUrl: null,
      unitPriceFormatted: "2,000 ֏",
      modifierLines: [],
    });

    const second = upsertItemLocally({
      productId: "p1",
      selectionKey: "",
      title: "Burger",
      slug: "burger",
      quantity: 2,
      imageUrl: null,
      unitPriceFormatted: "2,000 ֏",
      modifierLines: [],
    });

    expect(second.created).toBe(false);
    expect(second.quantityDelta).toBe(2);
    expect(getCartDrawerLocalView()?.items).toHaveLength(1);
    expect(getCartDrawerLocalView()?.items[0]?.quantity).toBe(3);
    expect(getCartDrawerLocalView()?.itemCount).toBe(3);
  });

  it("keeps different selectionKeys as separate lines", () => {
    upsertItemLocally({
      productId: "p1",
      selectionKey: "",
      title: "Burger",
      slug: "burger",
      quantity: 1,
      imageUrl: null,
      unitPriceFormatted: "2,000 ֏",
      modifierLines: [],
    });
    upsertItemLocally({
      productId: "p1",
      selectionKey: '{"optionChoices":{"size":"l"}}',
      title: "Burger",
      slug: "burger",
      quantity: 1,
      imageUrl: null,
      unitPriceFormatted: "2,500 ֏",
      modifierLines: ["Size: Large"],
    });

    const view = getCartDrawerLocalView();
    expect(view?.items).toHaveLength(2);
    expect(view?.itemCount).toBe(2);
  });

  it("rolls back a created optimistic line", () => {
    const result = upsertItemLocally({
      productId: "p1",
      selectionKey: "",
      title: "Burger",
      slug: "burger",
      quantity: 1,
      imageUrl: null,
      unitPriceFormatted: "2,000 ֏",
      modifierLines: [],
    });

    rollbackUpsertLocally(result);

    expect(getCartDrawerLocalView()?.items).toEqual([]);
    expect(getCartDrawerLocalView()?.itemCount).toBe(0);
    expect(getPendingOptimisticAdds()).toBe(0);
  });

  it("rolls back a quantity increase without removing newer extras", () => {
    const first = upsertItemLocally({
      productId: "p1",
      selectionKey: "",
      title: "Burger",
      slug: "burger",
      quantity: 1,
      imageUrl: null,
      unitPriceFormatted: "2,000 ֏",
      modifierLines: [],
    });
    const second = upsertItemLocally({
      productId: "p1",
      selectionKey: "",
      title: "Burger",
      slug: "burger",
      quantity: 2,
      imageUrl: null,
      unitPriceFormatted: "2,000 ֏",
      modifierLines: [],
    });
    upsertItemLocally({
      productId: "p2",
      selectionKey: "",
      title: "Fries",
      slug: "fries",
      quantity: 1,
      imageUrl: null,
      unitPriceFormatted: "800 ֏",
      modifierLines: [],
    });

    rollbackUpsertLocally(second);

    const view = getCartDrawerLocalView();
    expect(view?.items).toHaveLength(2);
    expect(view?.items.find((item) => item.productId === "p1")?.quantity).toBe(
      1,
    );
    expect(view?.items.find((item) => item.productId === "p2")?.quantity).toBe(
      1,
    );

    rollbackUpsertLocally(first);
    expect(
      getCartDrawerLocalView()?.items.find((item) => item.productId === "p1"),
    ).toBeUndefined();
    expect(getCartDrawerLocalView()?.items).toHaveLength(1);
  });

  it("preserves pending optimistic lines while reconciling server view", () => {
    upsertItemLocally({
      productId: "p-new",
      selectionKey: "",
      title: "New",
      slug: "new",
      quantity: 1,
      imageUrl: null,
      unitPriceFormatted: "1,000 ֏",
      modifierLines: [],
    });

    replaceCartDrawerViewFromServer(
      serverView([
        {
          id: "server-1",
          productId: "p-old",
          selectionKey: "",
          title: "Old",
          slug: "old",
          quantity: 1,
          imageUrl: null,
          unitPriceFormatted: "900 ֏",
          modifierLines: [],
        },
      ]),
    );

    const view = getCartDrawerLocalView();
    expect(view?.items.map((item) => item.productId)).toEqual([
      "p-old",
      "p-new",
    ]);
  });

  it("drops optimistic extras after acknowledge when server echoes the line", () => {
    upsertItemLocally({
      productId: "p1",
      selectionKey: "",
      title: "Burger",
      slug: "burger",
      quantity: 1,
      imageUrl: null,
      unitPriceFormatted: "2,000 ֏",
      modifierLines: [],
    });
    acknowledgeOptimisticAdd();

    replaceCartDrawerViewFromServer(
      serverView([
        {
          id: "server-line",
          productId: "p1",
          selectionKey: "",
          title: "Burger",
          slug: "burger",
          quantity: 1,
          imageUrl: "/real.webp",
          unitPriceFormatted: "1,800 ֏",
          modifierLines: [],
        },
      ]),
    );

    const view = getCartDrawerLocalView();
    expect(view?.items).toHaveLength(1);
    expect(view?.items[0]?.id).toBe("server-line");
    expect(view?.items[0]?.unitPriceFormatted).toBe("1,800 ֏");
    expect(getPendingOptimisticAdds()).toBe(0);
  });
});
