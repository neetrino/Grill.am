import "server-only";

import { and, asc, eq, inArray, or } from "drizzle-orm";

import { getCartWithItems } from "@/features/cart/cart";
import { getDb } from "@/db/client";
import { mediaAssets } from "@/db/schema";
import {
  describeModifiers,
  parseCartModifiers,
  parseProductCustomization,
  unitAmountWithModifiers,
} from "@/features/products/domain/customization";
import { resolveProductPrices } from "@/features/promotions/application/resolve-product-prices";
import type { Locale } from "@/lib/i18n/config";
import { getCheckoutRateSnapshot } from "@/lib/fx/service";
import { mediaPublicUrl } from "@/lib/media/public-url";
import { convertAmount } from "@/lib/money/convert";
import type { Currency } from "@/lib/money/currency";
import { defaultCurrency } from "@/lib/money/currency";
import { formatMoneyAmount } from "@/lib/money/format";

export type CartDrawerItemView = {
  id: string;
  title: string;
  slug: string;
  quantity: number;
  imageUrl: string | null;
  /** Display-currency minor units for one unit. */
  unitPriceAmount: number;
  /** unitPriceAmount × quantity. */
  lineTotalAmount: number;
  unitPriceFormatted: string;
  lineTotalFormatted: string;
  modifierLines: string[];
  /** Used for optimistic upsert matching across client + server rows. */
  productId?: string;
  /** Empty string for unmodified simple products. */
  selectionKey?: string;
};

export type CartDrawerView = {
  locale: Locale;
  currency: Currency;
  itemCount: number;
  items: CartDrawerItemView[];
  /** Sum of line totals in display-currency minor units. */
  subtotalAmount: number;
  /**
   * Server-only delta applied on top of subtotal (coupons, taxes, etc.).
   * Usually 0 while the drawer total equals merchandise subtotal.
   */
  adjustmentsAmount: number;
  shippingAmount: number;
  totalAmount: number;
  subtotalFormatted: string;
  shippingFormatted: string;
  totalFormatted: string;
};

async function loadPrimaryProductImages(
  productIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (productIds.length === 0) {
    return map;
  }

  const rows = await getDb()
    .select({
      productId: mediaAssets.productId,
      objectKey: mediaAssets.objectKey,
    })
    .from(mediaAssets)
    .where(
      and(
        inArray(mediaAssets.productId, productIds),
        eq(mediaAssets.uploadStatus, "READY"),
        or(eq(mediaAssets.isPrimary, true), eq(mediaAssets.role, "PRIMARY")),
      ),
    )
    .orderBy(asc(mediaAssets.sortOrder));

  for (const row of rows) {
    if (!row.productId || map.has(row.productId)) {
      continue;
    }
    map.set(row.productId, mediaPublicUrl(row.objectKey));
  }

  return map;
}

function toDisplayMinor(
  baseAmountAmd: number,
  rate: string,
  currency: Currency,
): number {
  return Number(
    convertAmount(baseAmountAmd, rate, defaultCurrency, currency).amount,
  );
}

/** Builds storefront cart-drawer display data for the active cart. */
export async function getCartDrawerView(
  locale: Locale,
  currency: Currency,
): Promise<CartDrawerView> {
  const { items: rows } = await getCartWithItems();
  const [images, quote, prices] = await Promise.all([
    loadPrimaryProductImages(rows.map(({ product }) => product.id)),
    getCheckoutRateSnapshot(currency),
    resolveProductPrices(
      rows.map(({ product }) => ({
        id: product.id,
        priceAmount: product.priceAmount,
        compareAtAmount: product.compareAtAmount,
      })),
    ),
  ]);

  const items: CartDrawerItemView[] = [];
  let subtotalAmount = 0;

  for (const { item, product } of rows) {
    const translation =
      product.translations[locale] ?? product.translations.hy;
    const modifiers = parseCartModifiers(item.modifiers);
    const customization = parseProductCustomization(product.customization);
    const baseUnit =
      prices.get(product.id)?.unitAmount ?? product.priceAmount;
    const unitAmountAmd = unitAmountWithModifiers(
      baseUnit,
      customization,
      modifiers,
    );
    const unitPriceAmount = toDisplayMinor(
      unitAmountAmd,
      quote.rate,
      currency,
    );
    const lineTotalAmount = unitPriceAmount * item.quantity;

    items.push({
      id: item.id,
      productId: product.id,
      selectionKey: item.selectionKey,
      title: translation?.title ?? product.sku,
      slug: translation?.slug ?? product.sku,
      quantity: item.quantity,
      imageUrl: images.get(product.id) ?? null,
      unitPriceAmount,
      lineTotalAmount,
      unitPriceFormatted: formatMoneyAmount(
        unitPriceAmount,
        currency,
        locale,
      ),
      lineTotalFormatted: formatMoneyAmount(
        lineTotalAmount,
        currency,
        locale,
      ),
      modifierLines: describeModifiers(customization, modifiers, locale),
    });
    subtotalAmount += lineTotalAmount;
  }

  const shippingAmount = 0;
  const adjustmentsAmount = 0;
  const totalAmount = subtotalAmount + adjustmentsAmount;

  return {
    locale,
    currency,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    items,
    subtotalAmount,
    adjustmentsAmount,
    shippingAmount,
    totalAmount,
    subtotalFormatted: formatMoneyAmount(subtotalAmount, currency, locale),
    shippingFormatted: formatMoneyAmount(shippingAmount, currency, locale),
    totalFormatted: formatMoneyAmount(totalAmount, currency, locale),
  };
}
