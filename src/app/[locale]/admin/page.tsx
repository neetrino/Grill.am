import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardStatsGrid } from "@/features/admin/ui/DashboardStatsGrid";
import { ADMIN_PAGE_SUBTITLE } from "@/features/admin/ui/admin-form-classes";
import {
  ADMIN_BADGE,
  paymentStatusBadgeClass,
} from "@/features/admin/ui/status-badge";
import {
  ADMIN_CARD_CLASS,
  ADMIN_CARD_HOVER_CLASS,
  ADMIN_CARD_PADDED_CLASS,
  ADMIN_CHIP_CREAM,
  ADMIN_CHIP_RED,
  ADMIN_CHIP_SURFACE,
  ADMIN_CHIP_YELLOW,
} from "@/features/admin/ui/admin-ui";
import {
  defaultAnalyticsDateRange,
  formatPeriodDelta,
} from "@/features/analytics/domain/date-range";
import { getAdminDashboardMetrics } from "@/features/orders/application/queries";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminPageProps = {
  params: Promise<{ locale: string }>;
};

function formatMoney(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fillTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    return values[key] ?? "";
  });
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const copy = getDictionary(locale).admin.dashboard;
  const metrics = await getAdminDashboardMetrics(defaultAnalyticsDateRange());
  const revenueDelta = fillTemplate(copy.vsPrev, {
    delta: formatPeriodDelta(
      metrics.revenueAmount,
      metrics.previousRevenueAmount,
    ),
  });

  const quickActions = [
    {
      href: "products/new",
      title: copy.addProduct,
      subtitle: copy.addProductHint,
      iconBg: ADMIN_CHIP_YELLOW.bg,
      iconColor: ADMIN_CHIP_YELLOW.fg,
      iconPath: "M12 4v16m8-8H4",
    },
    {
      href: "orders",
      title: copy.manageOrders,
      subtitle: copy.manageOrdersHint,
      iconBg: ADMIN_CHIP_RED.bg,
      iconColor: ADMIN_CHIP_RED.fg,
      iconPath:
        "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
    {
      href: "users",
      title: copy.manageUsers,
      subtitle: copy.manageUsersHint,
      iconBg: ADMIN_CHIP_CREAM.bg,
      iconColor: ADMIN_CHIP_CREAM.fg,
      iconPath:
        "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    },
    {
      href: "settings",
      title: copy.settings,
      subtitle: copy.settingsHint,
      iconBg: ADMIN_CHIP_SURFACE.bg,
      iconColor: ADMIN_CHIP_SURFACE.fg,
      iconPath:
        "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    },
  ] as const;

  return (
    <section>
      <div className="mb-8">
        <p className={ADMIN_PAGE_SUBTITLE}>{copy.welcome}</p>
      </div>

      <DashboardStatsGrid
        locale={locale}
        users={metrics.users}
        products={metrics.products}
        orders={metrics.orders}
        revenueLabel={formatMoney(metrics.revenueAmount)}
        revenueDelta={revenueDelta}
        labels={copy}
      />

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={ADMIN_CARD_PADDED_CLASS}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {copy.recentOrders}
            </h2>
            <Link
              href={`/${locale}/admin/orders`}
              className="rounded-[15px] px-3 py-1.5 text-sm font-medium text-brand-red hover:bg-brand-red/5"
            >
              {copy.viewAll}
            </Link>
          </div>
          <div className="space-y-4">
            {metrics.recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/${locale}/admin/orders/${order.orderNumber}`}
                className="block rounded-[15px] ring-1 ring-gray-100/80 p-4 transition-colors hover:bg-brand-surface/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        #{order.orderNumber}
                      </p>
                      <span
                        className={`${ADMIN_BADGE} ${paymentStatusBadgeClass(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="truncate text-xs text-gray-600">
                      {order.contactEmail}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-gray-900">
                    {formatMoney(order.totalAmount)} {order.baseCurrency}
                  </p>
                </div>
              </Link>
            ))}
            {metrics.recentOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-600">
                {copy.noRecentOrders}
              </p>
            ) : null}
          </div>
        </div>

        <div className={ADMIN_CARD_PADDED_CLASS}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {copy.topProducts}
            </h2>
            <Link
              href={`/${locale}/admin/products`}
              className="rounded-[15px] px-3 py-1.5 text-sm font-medium text-brand-red hover:bg-brand-red/5"
            >
              {copy.viewAll}
            </Link>
          </div>
          <div className="space-y-4">
            {metrics.topProducts.map((product, index) => (
              <div
                key={product.productId}
                className="flex items-center gap-4 rounded-[15px] ring-1 ring-gray-100/80 p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-yellow/25 text-xs font-bold text-brand-ink">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {product.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {fillTemplate(copy.soldCount, {
                      quantity: String(product.quantity),
                    })}
                  </p>
                </div>
              </div>
            ))}
            {metrics.topProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-600">
                {copy.noProductSales}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className={`${ADMIN_CARD_CLASS} mb-8 p-6`}>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          {copy.quickActions}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={`/${locale}/admin/${action.href}`}
              className={`flex items-center gap-3 rounded-[15px] ring-1 ring-gray-200 px-4 py-4 hover:bg-brand-surface/60 ${ADMIN_CARD_HOVER_CLASS}`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${action.iconBg}`}
              >
                <svg
                  className={`h-5 w-5 ${action.iconColor}`}
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
              <div className="text-left">
                <p className="font-medium text-gray-900">{action.title}</p>
                <p className="text-xs text-gray-500">{action.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
