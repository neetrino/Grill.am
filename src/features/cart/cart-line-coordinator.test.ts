import { beforeEach, describe, expect, it } from "vitest";

import { resetCartClientSyncForTests } from "@/features/cart/cart-client-sync";
import {
  getCartDrawerLocalView,
  getDisplayedCartLineQuantity,
  replaceCartDrawerViewFromServer,
  resetCartDrawerLocalStoreForTests,
  type OptimisticCartLineInput,
} from "@/features/cart/cart-drawer-local-store";
import {
  addCartLineQuantity,
  isCartLineSyncInFlight,
  resetCartLineCoordinatorForTests,
  setCartLineDesiredQuantity,
  setCartLineMutatorForTests,
} from "@/features/cart/cart-line-coordinator";
import type { SetCartLineQuantityInput } from "@/features/cart/cart-line-types";
import type {
  CartDrawerItemView,
  CartDrawerView,
} from "@/features/cart/get-cart-drawer-view";
import { recalculateLocalCartView } from "@/features/cart/cart-drawer-money";
import { formatMoneyAmount } from "@/lib/money/format";

function deferred<T = void>(): {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function displayOf(
  productId: string,
  unitPriceAmount = 3500,
  selectionKey = "",
): OptimisticCartLineInput {
  return {
    productId,
    selectionKey,
    title: productId,
    slug: productId,
    quantity: 1,
    imageUrl: null,
    unitPriceAmount,
    locale: "hy",
    currency: "AMD",
    modifierLines: [],
  };
}

function serverLine(
  productId: string,
  quantity: number,
  unitPriceAmount = 3500,
): CartDrawerItemView {
  return {
    id: `server-${productId}`,
    productId,
    selectionKey: "",
    title: productId,
    slug: productId,
    quantity,
    imageUrl: null,
    unitPriceAmount,
    lineTotalAmount: unitPriceAmount * quantity,
    unitPriceFormatted: formatMoneyAmount(unitPriceAmount, "AMD", "hy"),
    lineTotalFormatted: formatMoneyAmount(
      unitPriceAmount * quantity,
      "AMD",
      "hy",
    ),
    modifierLines: [],
  };
}

function serverView(items: CartDrawerItemView[]): CartDrawerView {
  return recalculateLocalCartView({
    locale: "hy",
    currency: "AMD",
    itemCount: 0,
    items,
    subtotalAmount: 0,
    adjustmentsAmount: 0,
    shippingAmount: 0,
    totalAmount: 0,
    subtotalFormatted: "",
    shippingFormatted: formatMoneyAmount(0, "AMD", "hy"),
    totalFormatted: "",
  });
}

describe("cart-line-coordinator", () => {
  beforeEach(() => {
    resetCartLineCoordinatorForTests();
    resetCartDrawerLocalStoreForTests();
    resetCartClientSyncForTests();
  });

  it("ADD then immediate REMOVE never resurrects the line", async () => {
    const first = deferred();
    const calls: number[] = [];
    setCartLineMutatorForTests(async (input) => {
      calls.push(input.quantity);
      if (calls.length === 1) {
        await first.promise;
      }
    });

    const addPromise = addCartLineQuantity({
      productId: "burger",
      selectionKey: "",
      addQuantity: 1,
      display: displayOf("burger"),
    });
    expect(getDisplayedCartLineQuantity("burger", "")).toBe(1);

    const removePromise = setCartLineDesiredQuantity({
      productId: "burger",
      selectionKey: "",
      quantity: 0,
    });
    expect(getDisplayedCartLineQuantity("burger", "")).toBe(0);
    expect(getCartDrawerLocalView()?.items ?? []).toHaveLength(0);

    first.resolve();
    await Promise.all([addPromise, removePromise]);

    expect(calls[0]).toBe(1);
    expect(calls.at(-1)).toBe(0);
    expect(getDisplayedCartLineQuantity("burger", "")).toBe(0);
    expect(getCartDrawerLocalView()?.items ?? []).toHaveLength(0);

    replaceCartDrawerViewFromServer(
      serverView([serverLine("burger", 1)]),
    );
    expect(getDisplayedCartLineQuantity("burger", "")).toBe(0);
    expect(getCartDrawerLocalView()?.items ?? []).toHaveLength(0);
  });

  it("ADD → REMOVE → ADD converges to quantity 1", async () => {
    const first = deferred();
    const calls: number[] = [];
    setCartLineMutatorForTests(async (input) => {
      calls.push(input.quantity);
      if (calls.length === 1) {
        await first.promise;
      }
    });

    void addCartLineQuantity({
      productId: "burger",
      selectionKey: "",
      addQuantity: 1,
      display: displayOf("burger"),
    });
    void setCartLineDesiredQuantity({
      productId: "burger",
      selectionKey: "",
      quantity: 0,
    });
    const final = addCartLineQuantity({
      productId: "burger",
      selectionKey: "",
      addQuantity: 1,
      display: displayOf("burger"),
    });

    expect(getDisplayedCartLineQuantity("burger", "")).toBe(1);
    first.resolve();
    await final;
    expect(getDisplayedCartLineQuantity("burger", "")).toBe(1);
    expect(calls.at(-1)).toBe(1);
  });

  it("ADD → ADD → REMOVE ends at the latest desired quantity", async () => {
    const first = deferred();
    setCartLineMutatorForTests(async () => {
      await first.promise;
    });

    void addCartLineQuantity({
      productId: "burger",
      selectionKey: "",
      addQuantity: 1,
      display: displayOf("burger"),
    });
    void addCartLineQuantity({
      productId: "burger",
      selectionKey: "",
      addQuantity: 1,
      display: displayOf("burger"),
    });
    const remove = setCartLineDesiredQuantity({
      productId: "burger",
      selectionKey: "",
      quantity: 0,
    });

    expect(getDisplayedCartLineQuantity("burger", "")).toBe(0);
    first.resolve();
    await remove;
    expect(getDisplayedCartLineQuantity("burger", "")).toBe(0);
  });

  it("does not regress UI from 3 back to 2 when an older response arrives", async () => {
    replaceCartDrawerViewFromServer(serverView([serverLine("burger", 1)]));
    const first = deferred();
    const calls: number[] = [];
    setCartLineMutatorForTests(async (input) => {
      calls.push(input.quantity);
      if (calls.length === 1) {
        await first.promise;
      }
    });

    void setCartLineDesiredQuantity({
      productId: "burger",
      selectionKey: "",
      quantity: 2,
    });
    const third = setCartLineDesiredQuantity({
      productId: "burger",
      selectionKey: "",
      quantity: 3,
    });

    expect(getDisplayedCartLineQuantity("burger", "")).toBe(3);
    first.resolve();
    await third;
    expect(getDisplayedCartLineQuantity("burger", "")).toBe(3);
    expect(calls[0]).toBe(2);
    expect(calls.at(-1)).toBe(3);
  });

  it("coalesces 1→2→3→4→3→2 to final quantity 2", async () => {
    replaceCartDrawerViewFromServer(serverView([serverLine("burger", 1)]));
    const first = deferred();
    const calls: number[] = [];
    setCartLineMutatorForTests(async (input) => {
      calls.push(input.quantity);
      if (calls.length === 1) {
        await first.promise;
      }
    });

    void setCartLineDesiredQuantity({
      productId: "burger",
      selectionKey: "",
      quantity: 2,
    });
    void setCartLineDesiredQuantity({
      productId: "burger",
      selectionKey: "",
      quantity: 3,
    });
    void setCartLineDesiredQuantity({
      productId: "burger",
      selectionKey: "",
      quantity: 4,
    });
    void setCartLineDesiredQuantity({
      productId: "burger",
      selectionKey: "",
      quantity: 3,
    });
    const last = setCartLineDesiredQuantity({
      productId: "burger",
      selectionKey: "",
      quantity: 2,
    });

    expect(getDisplayedCartLineQuantity("burger", "")).toBe(2);
    first.resolve();
    await last;
    expect(getDisplayedCartLineQuantity("burger", "")).toBe(2);
    expect(calls[0]).toBe(2);
    expect(calls.at(-1)).toBe(2);
  });

  it("REMOVE then immediate ADD converges to quantity 1", async () => {
    replaceCartDrawerViewFromServer(serverView([serverLine("burger", 1)]));
    const first = deferred();
    const calls: number[] = [];
    setCartLineMutatorForTests(async (input) => {
      calls.push(input.quantity);
      if (calls.length === 1) {
        await first.promise;
      }
    });

    void setCartLineDesiredQuantity({
      productId: "burger",
      selectionKey: "",
      quantity: 0,
    });
    const add = addCartLineQuantity({
      productId: "burger",
      selectionKey: "",
      addQuantity: 1,
      display: displayOf("burger"),
    });

    expect(getDisplayedCartLineQuantity("burger", "")).toBe(1);
    first.resolve();
    await add;
    expect(getDisplayedCartLineQuantity("burger", "")).toBe(1);
    expect(calls.at(-1)).toBe(1);
  });

  it("allows two different products to mutate concurrently", async () => {
    const burgerGate = deferred();
    const friesGate = deferred();
    const started: string[] = [];
    setCartLineMutatorForTests(async (input) => {
      started.push(input.productId);
      if (input.productId === "burger") {
        await burgerGate.promise;
        return;
      }
      await friesGate.promise;
    });

    const burger = addCartLineQuantity({
      productId: "burger",
      selectionKey: "",
      addQuantity: 1,
      display: displayOf("burger"),
    });
    const fries = addCartLineQuantity({
      productId: "fries",
      selectionKey: "",
      addQuantity: 1,
      display: displayOf("fries", 1000),
    });

    await Promise.resolve();
    await Promise.resolve();
    expect(started.sort()).toEqual(["burger", "fries"]);
    expect(isCartLineSyncInFlight("burger", "")).toBe(true);
    expect(isCartLineSyncInFlight("fries", "")).toBe(true);

    burgerGate.resolve();
    friesGate.resolve();
    await Promise.all([burger, fries]);
  });

  it("rolls back only the failed line", async () => {
    setCartLineMutatorForTests(async (input) => {
      if (input.productId === "burger") {
        throw new Error("Product unavailable.");
      }
    });

    const fries = addCartLineQuantity({
      productId: "fries",
      selectionKey: "",
      addQuantity: 1,
      display: displayOf("fries", 1000),
    });
    const burger = addCartLineQuantity({
      productId: "burger",
      selectionKey: "",
      addQuantity: 1,
      display: displayOf("burger"),
    });

    await fries;
    await expect(burger).rejects.toThrow("Product unavailable.");
    expect(getDisplayedCartLineQuantity("fries", "")).toBe(1);
    expect(getDisplayedCartLineQuantity("burger", "")).toBe(0);
    expect(
      getCartDrawerLocalView()?.items.map((item) => item.productId),
    ).toEqual(["fries"]);
  });

  it("keeps newer desired state when a stale server refresh arrives", async () => {
    const gate = deferred();
    setCartLineMutatorForTests(async () => {
      await gate.promise;
    });

    const sync = addCartLineQuantity({
      productId: "burger",
      selectionKey: "",
      addQuantity: 1,
      display: displayOf("burger"),
    });
    void setCartLineDesiredQuantity({
      productId: "burger",
      selectionKey: "",
      quantity: 4,
    });
    expect(getDisplayedCartLineQuantity("burger", "")).toBe(4);

    replaceCartDrawerViewFromServer(serverView([serverLine("burger", 2)]));
    expect(getDisplayedCartLineQuantity("burger", "")).toBe(4);

    gate.resolve();
    await sync;
    expect(getDisplayedCartLineQuantity("burger", "")).toBe(4);
  });

  it("does not create duplicate rows for rapid ADDs", async () => {
    const first = deferred();
    const calls: SetCartLineQuantityInput[] = [];
    setCartLineMutatorForTests(async (input) => {
      calls.push(input);
      if (calls.length === 1) {
        await first.promise;
      }
    });

    void addCartLineQuantity({
      productId: "burger",
      selectionKey: "",
      addQuantity: 1,
      display: displayOf("burger"),
    });
    void addCartLineQuantity({
      productId: "burger",
      selectionKey: "",
      addQuantity: 1,
      display: displayOf("burger"),
    });
    const third = addCartLineQuantity({
      productId: "burger",
      selectionKey: "",
      addQuantity: 1,
      display: displayOf("burger"),
    });

    expect(getCartDrawerLocalView()?.items).toHaveLength(1);
    expect(getDisplayedCartLineQuantity("burger", "")).toBe(3);
    first.resolve();
    await third;
    expect(getCartDrawerLocalView()?.items).toHaveLength(1);
    expect(calls.every((call) => call.productId === "burger")).toBe(true);
    expect(calls.at(-1)?.quantity).toBe(3);
  });

  it("rolls back the line when the server rejects over-stock quantity", async () => {
    replaceCartDrawerViewFromServer(serverView([serverLine("burger", 1)]));
    setCartLineMutatorForTests(async (input) => {
      if (input.quantity > 5) {
        throw new Error("Product unavailable.");
      }
    });

    await expect(
      setCartLineDesiredQuantity({
        productId: "burger",
        selectionKey: "",
        quantity: 6,
      }),
    ).rejects.toThrow("Product unavailable.");

    expect(getDisplayedCartLineQuantity("burger", "")).toBe(1);
  });

  it("never sends an optimistic id as the mutation identity", async () => {
    const calls: SetCartLineQuantityInput[] = [];
    setCartLineMutatorForTests(async (input) => {
      calls.push(input);
    });

    await addCartLineQuantity({
      productId: "burger",
      selectionKey: "",
      addQuantity: 1,
      display: displayOf("burger"),
    });
    await setCartLineDesiredQuantity({
      productId: "burger",
      selectionKey: "",
      quantity: 0,
    });

    expect(calls[0]?.productId).toBe("burger");
    expect(calls[0]?.selectionKey).toBe("");
    expect(JSON.stringify(calls)).not.toContain("optimistic:");
  });
});
