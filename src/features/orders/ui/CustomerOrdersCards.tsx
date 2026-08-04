"use client";

import { AppLink } from "@/components/ui/AppLink";
import {
  formatOrderDrawerMoney,
  formatOrderStatusLabel,
} from "@/features/orders/ui/order-drawer-format";
import { ProfileRecentOrderCard } from "@/features/profile/ui/ProfileRecentOrderCard";
import {
  PROFILE_PRIMARY_BUTTON_CLASS,
} from "@/features/profile/ui/profile-ui";
import type { Locale } from "@/lib/i18n/config";
import { formatShortDate } from "@/lib/i18n/format-date";

type CustomerOrdersCardItem = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  baseCurrency: string;
  placedAt: string | Date;
  itemsCount: number;
};

type CustomerOrdersCardsLabels = {
  orderNumber: string;
  item: string;
  items: string;
  placedOn: string;
  viewDetails: string;
  noOrders: string;
  startShopping: string;
};

type CustomerOrdersCardsProps = {
  locale: Locale;
  orders: CustomerOrdersCardItem[];
  labels: CustomerOrdersCardsLabels;
  onOpenOrder: (orderNumber: string) => void;
  className?: string;
};

/**
 * MaMarie-style profile order cards (mobile + optional forced layout).
 */
export function CustomerOrdersCards({
  locale,
  orders,
  labels,
  onOpenOrder,
  className = "",
}: CustomerOrdersCardsProps) {
  if (orders.length === 0) {
    return (
      <div
        className={`flex flex-col items-center gap-5 rounded-[15px] border border-gray-100 bg-white py-12 ${className}`}
      >
        <p className="max-w-sm text-center text-sm text-gray-600">
          {labels.noOrders}
        </p>
        <AppLink
          href={`/${locale}/products`}
          prefetchPolicy="intent"
          className={PROFILE_PRIMARY_BUTTON_CLASS}
        >
          {labels.startShopping}
        </AppLink>
      </div>
    );
  }

  return (
    <ul className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${className}`}>
      {orders.map((order) => {
        const itemLabel =
          order.itemsCount === 1 ? labels.item : labels.items;
        return (
          <li key={order.id} className="min-w-0">
            <ProfileRecentOrderCard
              orderNumber={order.orderNumber}
              status={formatOrderStatusLabel(order.status)}
              totalLabel={formatOrderDrawerMoney(
                order.totalAmount,
                order.baseCurrency,
              )}
              metaLine={`${order.itemsCount} ${itemLabel}`}
              placedOnLine={`${labels.placedOn} ${formatShortDate(order.placedAt, locale)}`}
              orderNumberLabel={labels.orderNumber}
              viewDetailsLabel={labels.viewDetails}
              onViewDetails={() => onOpenOrder(order.orderNumber)}
            />
          </li>
        );
      })}
    </ul>
  );
}
