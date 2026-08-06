/** Stable cart-line fingerprint for safe post-payment cart conversion. */
export function fingerprintCartItems(
  items: Array<{ productId: string; quantity: number }>,
): string {
  const normalized = [...items]
    .map((item) => `${item.productId}:${item.quantity}`)
    .sort();
  return normalized.join("|");
}
