import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { mediaPublicUrl } from "@/lib/media/public-url";
import { getStoreIdentity } from "@/features/settings/application/queries";
import {
  getAdminOrderByNumber,
  type AdminOrderDetail,
} from "@/features/orders/application/queries";
import { readCodCashTenderedAmount } from "@/features/checkout/domain/cod-cash-change";
import { formatPaymentMethodDisplay } from "@/features/orders/domain/payment-method-label";

export type AdminOrderDetailItemView = {
  id: string;
  title: string;
  sku: string;
  imageUrl: string | null;
  /** Locale-resolved addon/option/exclusion labels from purchase snapshot. */
  modifierLines: string[];
  quantity: number;
  unitPriceAmount: number;
  lineTotalAmount: number;
  currency: string;
};

export type AdminOrderDetailView = {
  orderNumber: string;
  /** ISO timestamp when the order was placed. */
  placedAt: string;
  status: string;
  paymentStatus: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  /** Registered account id when the order belongs to a user; null for guests. */
  userId: string | null;
  /** Current loyalty balance for `userId`; null when guest or not loaded. */
  userBonusBalanceAmount: number | null;
  /** Customer checkout note; null when none. */
  customerNote: string | null;
  baseCurrency: string;
  subtotalAmount: number;
  deliveryAmount: number;
  discountAmount: number;
  bonusSpentAmount: number;
  bonusEarnedAmount: number;
  totalAmount: number;
  deliveryLabel: string | null;
  couponCode: string | null;
  isPickup: boolean;
  storeName: string;
  shippingMethod: string;
  addressLine: string;
  addressHint: string | null;
  paymentMethod: string;
  paymentAmount: number;
  /** COD banknote the customer will tender; null when exact or non-COD. */
  cashTenderedAmount: number | null;
  /** Change the courier should prepare (`tendered − total`). */
  cashChangeAmount: number | null;
  /** Customer-safe payment attempt summaries (no secrets / full refs). */
  paymentAttempts: Array<{
    attemptNumber: number;
    provider: string;
    status: string;
    amount: number;
    currency: string;
    createdAt: string;
    capturedAt: string | null;
    isLatest: boolean;
  }>;
  items: AdminOrderDetailItemView[];
};

function formatAddressLine(
  address: AdminOrderDetail["order"]["shippingAddress"],
  deliveryLabel: string | null,
): string {
  const city = address.city?.trim() ?? "";
  const label = deliveryLabel?.trim() ?? "";
  const cityAlreadyInMethod =
    city.length > 0 &&
    label.length > 0 &&
    (label.localeCompare(city, undefined, { sensitivity: "accent" }) === 0 ||
      label.toLowerCase().includes(city.toLowerCase()));

  const parts = [
    address.line1,
    address.line2,
    cityAlreadyInMethod ? null : address.city,
    address.region,
    address.postalCode,
  ].filter((part): part is string => Boolean(part && part.trim()));

  return parts.join(", ");
}

/** Drops a trailing ISO country code from legacy delivery labels (e.g. "Yerevan, AM"). */
function stripTrailingCountryCode(label: string): string {
  return label.replace(/,\s*[A-Z]{2}$/u, "").trim() || label;
}

/**
 * Non-pickup method line: always `Delivery, {city}` (city from address or legacy snapshot).
 */
function normalizeDeliveryMethodLabel(
  snapshot: string | null,
  isPickup: boolean,
  city: string | null | undefined,
): string | null {
  if (isPickup) {
    return snapshot;
  }

  const fromAddress = city?.trim() ?? "";
  const fromSnapshot = snapshot
    ? stripTrailingCountryCode(snapshot)
        .replace(/^delivery,?\s*/iu, "")
        .trim()
    : "";
  const cityPart =
    fromAddress ||
    (fromSnapshot.includes(",")
      ? (fromSnapshot.split(",").at(-1)?.trim() ?? "")
      : fromSnapshot);
  return cityPart ? `Delivery, ${cityPart}` : "Delivery";
}

/** Maps a loaded order into a serializable admin drawer view. */
export function toAdminOrderDetailView(
  detail: AdminOrderDetail,
  storeName: string,
  options?: {
    userBonusBalanceAmount?: number | null;
  },
): AdminOrderDetailView {
  const { order, items, payments } = detail;
  const isPickup = order.deliveryLabelSnapshot === "Store pickup";
  const deliveryLabel = normalizeDeliveryMethodLabel(
    order.deliveryLabelSnapshot,
    isPickup,
    order.shippingAddress.city,
  );
  const latestPayment = payments[0] ?? null;
  const cashTenderedAmount = latestPayment
    ? readCodCashTenderedAmount(latestPayment.metadata)
    : null;
  const cashChangeAmount =
    cashTenderedAmount != null
      ? Math.max(0, cashTenderedAmount - order.totalAmount)
      : null;

  return {
    orderNumber: order.orderNumber,
    placedAt: order.placedAt.toISOString(),
    status: order.status,
    paymentStatus: order.paymentStatus,
    contactName: order.contactName,
    contactEmail: order.contactEmail,
    contactPhone: order.contactPhone,
    userId: order.userId ?? null,
    userBonusBalanceAmount:
      order.userId != null
        ? (options?.userBonusBalanceAmount ?? null)
        : null,
    customerNote: order.customerNote ?? null,
    baseCurrency: order.baseCurrency,
    subtotalAmount: order.subtotalAmount,
    deliveryAmount: order.deliveryAmount,
    discountAmount: order.discountAmount,
    bonusSpentAmount: order.bonusSpentAmount,
    bonusEarnedAmount: order.bonusEarnedAmount,
    totalAmount: order.totalAmount,
    deliveryLabel,
    couponCode: order.promotionCodeSnapshot,
    isPickup,
    storeName,
    shippingMethod: isPickup
      ? "pickup"
      : (deliveryLabel ?? "delivery"),
    addressLine: formatAddressLine(order.shippingAddress, deliveryLabel),
    addressHint: isPickup
      ? "You can pick up your order at this store"
      : null,
    paymentMethod: formatPaymentMethodDisplay(latestPayment?.method),
    paymentAmount: latestPayment?.amount ?? order.totalAmount,
    cashTenderedAmount,
    cashChangeAmount,
    paymentAttempts: payments.map((payment, index) => ({
      attemptNumber: payment.attemptNumber,
      provider: payment.provider,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      createdAt: payment.createdAt.toISOString(),
      capturedAt: payment.capturedAt?.toISOString() ?? null,
      isLatest: index === 0,
    })),
    items: items.map((item) => ({
      id: item.id,
      title: item.productTitleSnapshot,
      sku: item.productSkuSnapshot,
      imageUrl: item.productImageKeySnapshot
        ? mediaPublicUrl(item.productImageKeySnapshot)
        : null,
      modifierLines: item.modifiersSnapshot?.labels ?? [],
      quantity: item.quantity,
      unitPriceAmount: item.unitBaseAmount,
      lineTotalAmount: item.lineTotalAmount,
      currency: item.currency,
    })),
  };
}

/** Loads order detail shaped for the admin drawer. */
export async function getAdminOrderDetailView(
  orderNumber: string,
): Promise<AdminOrderDetailView | null> {
  const detail = await getAdminOrderByNumber(orderNumber);
  if (!detail) {
    return null;
  }

  const identity = await getStoreIdentity();
  const userId = detail.order.userId;
  let userBonusBalanceAmount: number | null = null;
  if (userId) {
    const [user] = await getDb()
      .select({ bonusBalanceAmount: users.bonusBalanceAmount })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    userBonusBalanceAmount = user?.bonusBalanceAmount ?? 0;
  }

  return toAdminOrderDetailView(detail, identity.name, {
    userBonusBalanceAmount,
  });
}
