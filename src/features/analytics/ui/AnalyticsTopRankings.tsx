"use client";

import { Package } from "lucide-react";

import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import { ADMIN_CARD_CLASS } from "@/features/admin/ui/admin-ui";
import type {
  AnalyticsTopCategory,
  AnalyticsTopProduct,
} from "@/features/analytics/application/queries";
import { formatMoneyAmount } from "@/lib/money/format";

type AnalyticsTopRankingsProps = {
  locale: string;
  products: AnalyticsTopProduct[];
  categories: AnalyticsTopCategory[];
};

export function AnalyticsTopRankings({
  locale,
  products,
  categories,
}: AnalyticsTopRankingsProps) {
  const copy = useAdminDictionary().analytics.rankings;

  function formatMoney(amount: number): string {
    return formatMoneyAmount(amount, "AMD", locale);
  }

  return (
    <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
      <div className={`${ADMIN_CARD_CLASS} p-4`}>
        <h2 className="mb-2 text-base font-semibold text-gray-900">
          {copy.topProducts}
        </h2>
        <div className="space-y-2">
          {products.map((product, index) => (
            <div
              key={product.productId}
              className="flex items-center gap-3 rounded-[12px] px-2.5 py-2 ring-1 ring-gray-100/80"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-yellow/25 text-[11px] font-bold text-brand-ink">
                {index + 1}
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-surface">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote R2 URLs; admin list pattern
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-4 w-4 text-gray-400" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {product.title}
                </p>
                <p className="text-[11px] text-gray-500">
                  {formatAdminMessage(copy.soldCount, {
                    quantity: String(product.quantitySold),
                  })}
                  {" · "}
                  {formatAdminMessage(copy.ordersCount, {
                    count: String(product.orderCount),
                  })}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-gray-900">
                {formatMoney(product.unitPriceAmount)}
              </p>
            </div>
          ))}
          {products.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-600">
              {copy.noProductSales}
            </p>
          ) : null}
        </div>
      </div>

      <div className={`${ADMIN_CARD_CLASS} p-4`}>
        <h2 className="mb-2 text-base font-semibold text-gray-900">
          {copy.topCategories}
        </h2>
        <div className="space-y-2">
          {categories.map((category, index) => (
            <div
              key={category.categoryId}
              className="flex items-center gap-3 rounded-[12px] px-2.5 py-2 ring-1 ring-gray-100/80"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-[11px] font-bold text-brand-red">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {category.title}
                </p>
                <p className="text-[11px] text-gray-500">
                  {formatAdminMessage(copy.itemsCount, {
                    count: String(category.itemCount),
                  })}
                  {" · "}
                  {formatAdminMessage(copy.ordersCount, {
                    count: String(category.orderCount),
                  })}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-gray-900">
                {formatMoney(category.revenueAmount)}
              </p>
            </div>
          ))}
          {categories.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-600">
              {copy.noCategorySales}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
