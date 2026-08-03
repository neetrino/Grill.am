"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  Clock3,
  MapPin,
  Package,
  Wallet,
} from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import { AdminDictionaryProvider } from "@/features/admin/ui/AdminDictionaryProvider";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import { getCustomerOrderDetailAction } from "@/features/orders/application/get-customer-order-detail";
import { reorderCustomerOrderAction } from "@/features/orders/application/reorder-order";
import { OrderDetailsDrawer } from "@/features/orders/ui/OrderDetailsDrawer";
import type {
  ProfileDashboardStats,
  ProfileRecentOrder,
} from "@/features/profile/application/dashboard-queries";
import { ProfileRecentOrderCard } from "@/features/profile/ui/ProfileRecentOrderCard";
import { ProfileStatCard } from "@/features/profile/ui/ProfileStatCard";
import {
  PROFILE_CARD_CLASS,
  PROFILE_PRIMARY_BUTTON_CLASS,
  PROFILE_SECTION_TITLE_CLASS,
  PROFILE_STAT_KEYS,
  type ProfileStatKey,
} from "@/features/profile/ui/profile-ui";
import type { Locale } from "@/lib/i18n/config";
import type {
  AdminDictionary,
  ProfileDictionary,
} from "@/lib/i18n/get-dictionary";
import { formatMoneyAmount } from "@/lib/money/format";

type ProfileDashboardViewProps = {
  locale: Locale;
  stats: ProfileDashboardStats;
  recentOrders: ProfileRecentOrder[];
  dictionary: ProfileDictionary;
  adminDictionary: AdminDictionary;
};

function formatPlacedOn(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date instanceof Date ? date : new Date(date));
}

export function ProfileDashboardView({
  locale,
  stats,
  recentOrders,
  dictionary,
  adminDictionary,
}: ProfileDashboardViewProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<AdminOrderDetailView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isReordering, startReorderTransition] = useTransition();

  const statValues: Record<ProfileStatKey, string> = {
    totalOrders: String(stats.totalOrders),
    totalSpent: formatMoneyAmount(stats.totalSpent, "AMD", locale),
    pendingOrders: String(stats.pendingOrders),
    savedAddresses: String(stats.savedAddresses),
  };

  const statLabels: Record<ProfileStatKey, string> = {
    totalOrders: dictionary.totalOrders,
    totalSpent: dictionary.totalSpent,
    pendingOrders: dictionary.pendingOrders,
    savedAddresses: dictionary.savedAddresses,
  };

  const statIcons: Record<ProfileStatKey, ReactNode> = {
    totalOrders: <Package />,
    totalSpent: <Wallet />,
    pendingOrders: <Clock3 />,
    savedAddresses: <MapPin />,
  };

  function openOrder(orderNumber: string): void {
    setDrawerOpen(true);
    setDetail(null);
    setError(null);
    setReorderError(null);

    startTransition(async () => {
      const result = await getCustomerOrderDetailAction(locale, orderNumber);
      if (!result.ok) {
        setError(result.error.message);
        setDetail(null);
        return;
      }
      setDetail(result.value);
    });
  }

  function closeDrawer(): void {
    setDrawerOpen(false);
    setDetail(null);
    setError(null);
    setReorderError(null);
  }

  function handleReorder(): void {
    if (!detail || isReordering) return;
    setReorderError(null);

    startReorderTransition(async () => {
      const result = await reorderCustomerOrderAction(
        locale,
        detail.orderNumber,
      );
      if (!result.ok) {
        setReorderError(
          result.error.code === "NO_AVAILABLE_PRODUCTS"
            ? dictionary.reorderUnavailable
            : result.error.message,
        );
      }
    });
  }

  return (
    <>
      <section className="space-y-6 lg:space-y-8">
        <h1 className={`${PROFILE_SECTION_TITLE_CLASS} text-2xl lg:hidden`}>
          {dictionary.dashboard}
        </h1>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          {PROFILE_STAT_KEYS.map((key) => (
            <ProfileStatCard
              key={key}
              label={statLabels[key]}
              value={statValues[key]}
              icon={statIcons[key]}
            />
          ))}
        </div>

        <div className={`p-5 sm:p-7 ${PROFILE_CARD_CLASS}`}>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className={PROFILE_SECTION_TITLE_CLASS}>
              {dictionary.recentOrders}
            </h2>
            <AppLink
              href={`/${locale}/profile/orders`}
              prefetchPolicy="intent"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-red transition-opacity hover:opacity-80"
            >
              {dictionary.viewAllOrders}
              <span aria-hidden>→</span>
            </AppLink>
          </div>

          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-5 py-12">
              <p className="max-w-sm text-center text-sm text-gray-600">
                {dictionary.noOrders}
              </p>
              <AppLink
                href={`/${locale}/products`}
                prefetchPolicy="intent"
                className={PROFILE_PRIMARY_BUTTON_CLASS}
              >
                {dictionary.startShopping}
              </AppLink>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {recentOrders.map((order) => {
                const itemLabel =
                  order.itemsCount === 1 ? dictionary.item : dictionary.items;
                return (
                  <li key={order.id} className="min-w-0">
                    <ProfileRecentOrderCard
                      orderNumber={order.orderNumber}
                      status={order.status}
                      totalLabel={formatMoneyAmount(
                        order.totalAmount,
                        "AMD",
                        locale,
                      )}
                      metaLine={`${order.itemsCount} ${itemLabel}`}
                      placedOnLine={`${dictionary.placedOn} ${formatPlacedOn(order.placedAt, locale)}`}
                      orderNumberLabel={dictionary.orderNumber}
                      viewDetailsLabel={dictionary.viewDetails}
                      onViewDetails={() => openOrder(order.orderNumber)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <AdminDictionaryProvider dictionary={adminDictionary}>
        <OrderDetailsDrawer
          open={drawerOpen}
          onClose={closeDrawer}
          detail={detail}
          error={error}
          isLoading={isPending}
          reorder={{
            label: dictionary.reorder,
            pendingLabel: dictionary.reordering,
            onReorder: handleReorder,
            isPending: isReordering,
            error: reorderError,
          }}
        />
      </AdminDictionaryProvider>
    </>
  );
}
