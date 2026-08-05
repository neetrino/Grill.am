import { describe, expect, it } from "vitest";

/**
 * Documents the media-incident root cause: cards must prefer the product
 * image URL and only fall back to the shared placeholder.
 */
function resolveProductCardImage(
  imageUrl: string | null | undefined,
  fallback: string,
): string {
  return imageUrl?.trim() || fallback;
}

describe("product card image resolution", () => {
  const fallback = "/assets/products/product-card.webp";

  it("uses the product media URL when present", () => {
    expect(
      resolveProductCardImage(
        "https://cdn.example/uploads/products/a/woocommerce-271-0-abc.jpg",
        fallback,
      ),
    ).toBe("https://cdn.example/uploads/products/a/woocommerce-271-0-abc.jpg");
  });

  it("falls back to the shared placeholder when media is missing", () => {
    expect(resolveProductCardImage(null, fallback)).toBe(fallback);
    expect(resolveProductCardImage("  ", fallback)).toBe(fallback);
  });

  it("keeps different product URLs distinct", () => {
    const a = resolveProductCardImage(
      "https://cdn.example/uploads/products/a/img-a.jpg",
      fallback,
    );
    const b = resolveProductCardImage(
      "https://cdn.example/uploads/products/b/img-b.jpg",
      fallback,
    );
    expect(a).not.toBe(b);
    expect(a).not.toBe(fallback);
    expect(b).not.toBe(fallback);
  });
});
