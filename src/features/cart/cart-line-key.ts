export type CartLineIdentity = {
  productId: string;
  selectionKey: string;
};

/** Map/set key for a cart line. Prefer passing structured identity at APIs. */
export function cartLineMatchKey(
  productId: string,
  selectionKey: string,
): string {
  return `${productId}::${selectionKey}`;
}

/** Client-only React key before the server echoes a durable cart_items.id. */
export function optimisticCartLineId(
  productId: string,
  selectionKey: string,
): string {
  return `optimistic:${cartLineMatchKey(productId, selectionKey)}`;
}
