import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db/client";
import { products } from "@/db/schema";
import { assertE2eControlSurfaceEnabled } from "@/lib/e2e/guard";
import {
  E2E_PAYMENT_PRODUCT_SKU,
  E2E_PAYMENT_PRODUCT_SLUG,
} from "@/lib/e2e/payment-product";

export const dynamic = "force-dynamic";

/**
 * E2E-only fixture probe: confirms the seeded product exists in DB.
 * Returns 404 outside mock mode / in production.
 */
export async function GET(): Promise<NextResponse> {
  try {
    assertE2eControlSurfaceEnabled();
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const [row] = await getDb()
    .select({
      id: products.id,
      sku: products.sku,
      status: products.status,
      priceAmount: products.priceAmount,
      stockOnHand: products.stockOnHand,
      translations: products.translations,
      deletedAt: products.deletedAt,
    })
    .from(products)
    .where(
      and(
        eq(products.sku, E2E_PAYMENT_PRODUCT_SKU),
        eq(products.status, "ACTIVE"),
        isNull(products.deletedAt),
      ),
    )
    .limit(1);

  if (!row) {
    return NextResponse.json(
      {
        ok: false,
        error: "e2e_product_missing",
        expectedSku: E2E_PAYMENT_PRODUCT_SKU,
        expectedSlug: E2E_PAYMENT_PRODUCT_SLUG,
      },
      { status: 503 },
    );
  }

  const enSlug =
    typeof row.translations?.en === "object" &&
    row.translations.en &&
    "slug" in row.translations.en
      ? String((row.translations.en as { slug?: string }).slug ?? "")
      : "";

  if (enSlug !== E2E_PAYMENT_PRODUCT_SLUG) {
    return NextResponse.json(
      {
        ok: false,
        error: "e2e_product_slug_mismatch",
        expectedSlug: E2E_PAYMENT_PRODUCT_SLUG,
        actualSlug: enSlug,
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    product: {
      sku: row.sku,
      slug: enSlug,
      status: row.status,
      priceAmount: row.priceAmount,
      stockOnHand: row.stockOnHand,
      title: "E2E Checkout Product",
    },
  });
}
