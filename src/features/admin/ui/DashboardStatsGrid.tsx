import Link from "next/link";

import {
  ADMIN_CARD_CLASS,
  ADMIN_CHIP_RED,
  ADMIN_CHIP_YELLOW,
} from "@/features/admin/ui/admin-ui";
import type { AdminDictionary } from "@/lib/i18n/get-dictionary";

type DashboardStatsGridProps = {
  locale: string;
  users: number;
  products: number;
  labels: AdminDictionary["dashboard"];
};

function CompactStat({
  href,
  label,
  value,
  iconBg,
  iconColor,
  iconPath,
}: {
  href: string;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
  iconPath: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 transition hover:bg-brand-surface/70 ${ADMIN_CARD_CLASS}`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconBg}`}
      >
        <svg
          className={`h-4 w-4 ${iconColor}`}
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
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-lg font-bold leading-tight text-gray-900">{value}</p>
      </div>
    </Link>
  );
}

export function DashboardStatsGrid({
  locale,
  users,
  products,
  labels,
}: DashboardStatsGridProps) {
  const base = `/${locale}/admin`;

  return (
    <div className="mb-3 grid grid-cols-2 gap-3">
      <CompactStat
        href={`${base}/users`}
        label={labels.users}
        value={String(users)}
        iconBg={ADMIN_CHIP_RED.bg}
        iconColor={ADMIN_CHIP_RED.fg}
        iconPath="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
      <CompactStat
        href={`${base}/products`}
        label={labels.activeProducts}
        value={String(products)}
        iconBg={ADMIN_CHIP_YELLOW.bg}
        iconColor={ADMIN_CHIP_YELLOW.fg}
        iconPath="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </div>
  );
}
