import { describe, expect, it } from "vitest";

/**
 * Cards prefer the product image URL and render a blank white area when
 * media is missing (no shared placeholder asset).
 */
function resolveProductCardImage(
  imageUrl: string | null | undefined,
): string | null {
  return imageUrl?.trim() || null;
}

describe("product card image resolution", () => {
  it("uses the product media URL when present", () => {
    expect(
      resolveProductCardImage(
        "https://cdn.example/uploads/products/a/woocommerce-271-0-abc.jpg",
      ),
    ).toBe("https://cdn.example/uploads/products/a/woocommerce-271-0-abc.jpg");
  });

  it("resolves to null when media is missing", () => {
    expect(resolveProductCardImage(null)).toBeNull();
    expect(resolveProductCardImage("  ")).toBeNull();
  });

  it("keeps different product URLs distinct", () => {
    const a = resolveProductCardImage(
      "https://cdn.example/uploads/products/a/img-a.jpg",
    );
    const b = resolveProductCardImage(
      "https://cdn.example/uploads/products/b/img-b.jpg",
    );
    expect(a).not.toBe(b);
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
  });
});
