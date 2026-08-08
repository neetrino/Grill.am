import Link from "next/link";

import {
  ADMIN_CARD_CLASS,
  ADMIN_CARD_HOVER_CLASS,
  ADMIN_CHIP_CREAM,
  ADMIN_CHIP_RED,
  ADMIN_CHIP_SURFACE,
  ADMIN_CHIP_YELLOW,
} from "@/features/admin/ui/admin-ui";
import type { AdminDictionary } from "@/lib/i18n/get-dictionary";

type DashboardQuickActionsProps = {
  locale: string;
  labels: AdminDictionary["dashboard"];
};

export function DashboardQuickActions({
  locale,
  labels,
}: DashboardQuickActionsProps) {
  const quickActions = [
    {
      href: "products/new",
      title: labels.addProduct,
      subtitle: labels.addProductHint,
      iconBg: ADMIN_CHIP_YELLOW.bg,
      iconColor: ADMIN_CHIP_YELLOW.fg,
      iconPath: "M12 4v16m8-8H4",
    },
    {
      href: "orders",
      title: labels.manageOrders,
      subtitle: labels.manageOrdersHint,
      iconBg: ADMIN_CHIP_RED.bg,
      iconColor: ADMIN_CHIP_RED.fg,
      iconPath:
        "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
    {
      href: "users",
      title: labels.manageUsers,
      subtitle: labels.manageUsersHint,
      iconBg: ADMIN_CHIP_CREAM.bg,
      iconColor: ADMIN_CHIP_CREAM.fg,
      iconPath:
        "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    },
    {
      href: "settings",
      title: labels.settings,
      subtitle: labels.settingsHint,
      iconBg: ADMIN_CHIP_SURFACE.bg,
      iconColor: ADMIN_CHIP_SURFACE.fg,
      iconPath:
        "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    },
  ] as const;

  return (
    <div className={`${ADMIN_CARD_CLASS} mb-3 p-4`}>
      <h2 className="mb-2 text-base font-semibold text-gray-900">
        {labels.quickActions}
      </h2>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={`/${locale}/admin/${action.href}`}
            className={`flex items-center gap-2.5 rounded-[12px] px-3 py-2.5 ring-1 ring-gray-200 hover:bg-brand-surface/60 ${ADMIN_CARD_HOVER_CLASS}`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${action.iconBg}`}
            >
              <svg
                className={`h-4 w-4 ${action.iconColor}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={action.iconPath}
                />
              </svg>
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-medium text-gray-900">
                {action.title}
              </p>
              <p className="truncate text-[11px] text-gray-500">
                {action.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
