import Link from "next/link";

import {
  ADMIN_CARD_HOVER_CLASS,
  ADMIN_CARD_PADDED_CLASS,
  ADMIN_CHIP_CREAM,
  ADMIN_CHIP_RED,
  ADMIN_CHIP_YELLOW,
} from "@/features/admin/ui/admin-ui";
import type { AdminDictionary } from "@/lib/i18n/get-dictionary";

type DashboardStatsGridProps = {
  locale: string;
  users: number;
  products: number;
  orders: number;
  revenueLabel: string;
  revenueDelta?: string;
  labels: AdminDictionary["dashboard"];
};

function StatCard({
  href,
  label,
  value,
  hint,
  iconBg,
  iconColor,
  iconPath,
}: {
  href: string;
  label: string;
  value: string;
  hint?: string;
  iconBg: string;
  iconColor: string;
  iconPath: string;
}) {
  return (
    <Link href={href} className="block h-full">
      <div
        className={`relative flex h-full min-h-[112px] flex-col justify-center ${ADMIN_CARD_PADDED_CLASS} ${ADMIN_CARD_HOVER_CLASS} hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBg}`}
          >
            <svg
              className={`h-6 w-6 ${iconColor}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={iconPath}
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        {hint ? (
          <p className="absolute right-4 bottom-3 max-w-[70%] truncate text-right text-xs text-gray-500">
            {hint}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function DashboardStatsGrid({
  locale,
  users,
  products,
  orders,
  revenueLabel,
  revenueDelta,
  labels,
}: DashboardStatsGridProps) {
  const base = `/${locale}/admin`;

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
      <StatCard
        href={`${base}/users`}
        label={labels.users}
        value={String(users)}
        iconBg={ADMIN_CHIP_RED.bg}
        iconColor={ADMIN_CHIP_RED.fg}
        iconPath="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
      <StatCard
        href={`${base}/products`}
        label={labels.activeProducts}
        value={String(products)}
        iconBg={ADMIN_CHIP_YELLOW.bg}
        iconColor={ADMIN_CHIP_YELLOW.fg}
        iconPath="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
      <StatCard
        href={`${base}/orders`}
        label={labels.ordersRange}
        value={String(orders)}
        iconBg={ADMIN_CHIP_CREAM.bg}
        iconColor={ADMIN_CHIP_CREAM.fg}
        iconPath="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
      <StatCard
        href={`${base}/analytics`}
        label={labels.revenueRange}
        value={revenueLabel}
        hint={revenueDelta}
        iconBg={ADMIN_CHIP_RED.bg}
        iconColor={ADMIN_CHIP_RED.fg}
        iconPath="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </div>
  );
}
