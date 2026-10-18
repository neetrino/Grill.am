import "server-only";

import { and, asc, eq, inArray, or } from "drizzle-orm";

import { getCartWithItems } from "@/features/cart/cart";
import { getDb } from "@/db/client";
import { mediaAssets } from "@/db/schema";
import { resolveActiveFlatBonusByProductId } from "@/features/loyalty/application/product-bonus-board";
import { computeFlatBonusEarnAmount } from "@/features/loyalty/domain/loyalty-math";
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
  productId: string;
  /** Empty string for unmodified simple products. */
  selectionKey: string;
  /** Flat bonus earn (AMD) for one unit; used for local qty recalculation. */
  bonusEarnUnitAmount: number;
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
  /** Projected Grill Coin earn for cart lines (AMD integer). */
  bonusEarnAmount: number;
  subtotalFormatted: string;
  shippingFormatted: string;
  totalFormatted: string;
  /** `+N` when earn > 0; empty otherwise. */
  bonusEarnFormatted: string;
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
  const productIds = rows.map(({ product }) => product.id);
  const [images, quote, prices, bonusByProductId] = await Promise.all([
    loadPrimaryProductImages(productIds),
    getCheckoutRateSnapshot(currency),
    resolveProductPrices(
      rows.map(({ product }) => ({
        id: product.id,
        priceAmount: product.priceAmount,
        compareAtAmount: product.compareAtAmount,
      })),
    ),
    resolveActiveFlatBonusByProductId(productIds),
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
    const bonusEarnUnitAmount = Math.max(
      0,
      Math.floor(bonusByProductId.get(product.id) ?? 0),
    );

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
      bonusEarnUnitAmount,
    });
    subtotalAmount += lineTotalAmount;
  }

  const shippingAmount = 0;
  const adjustmentsAmount = 0;
  const totalAmount = subtotalAmount + adjustmentsAmount;
  const bonusEarnAmount = computeFlatBonusEarnAmount(
    items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
    new Map(
      items.map((item) => [item.productId, item.bonusEarnUnitAmount] as const),
    ),
  );
  const bonusEarnFormatted =
    bonusEarnAmount > 0
      ? `+${bonusEarnAmount.toLocaleString(locale === "en" ? "en-US" : "ru-RU")}`
      : "";

  return {
    locale,
    currency,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    items,
    subtotalAmount,
    adjustmentsAmount,
    shippingAmount,
    totalAmount,
    bonusEarnAmount,
    subtotalFormatted: formatMoneyAmount(subtotalAmount, currency, locale),
    shippingFormatted: formatMoneyAmount(shippingAmount, currency, locale),
    totalFormatted: formatMoneyAmount(totalAmount, currency, locale),
    bonusEarnFormatted,
  };
}
