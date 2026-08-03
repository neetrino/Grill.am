import { Card } from "@/components/ui/Card";
import {
  ADMIN_BADGE,
  orderStatusBadgeClass,
} from "@/features/admin/ui/status-badge";
import {
  ADMIN_TABLE,
  ADMIN_TABLE_CARD,
  ADMIN_TABLE_FOOTER_ROUNDED_B,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_STATE_INSET,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_THEAD,
} from "@/features/admin/ui/admin-table-classes";
import { formatOrderStatusLabel } from "@/features/orders/ui/order-drawer-format";
import type { CustomerCouponRedemption } from "@/features/promotions/application/list-customer-coupon-history";
import {
  formatCouponOffer,
  formatCouponSavings,
} from "@/features/promotions/domain/format-coupon-offer";

export type CustomerPromoCodesLabels = {
  title: string;
  description: string;
  code: string;
  offer: string;
  saved: string;
  order: string;
  status: string;
  date: string;
  empty: string;
  emptyHint: string;
  pageCount: string;
};

type CustomerPromoCodesViewProps = {
  locale: string;
  rows: CustomerCouponRedemption[];
  labels: CustomerPromoCodesLabels;
};

export function CustomerPromoCodesView({
  locale,
  rows,
  labels,
}: CustomerPromoCodesViewProps) {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {labels.title}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
          {labels.description}
        </p>
      </header>

      <Card className={`${ADMIN_TABLE_CARD} !rounded-[15px] shadow-none`}>
        <div className={ADMIN_TABLE_OUTER_SCROLL}>
          <table className={ADMIN_TABLE}>
            <thead className={ADMIN_TABLE_THEAD}>
              <tr>
                <th className={ADMIN_TABLE_TH}>{labels.code}</th>
                <th className={ADMIN_TABLE_TH}>{labels.offer}</th>
                <th className={ADMIN_TABLE_TH}>{labels.saved}</th>
                <th className={ADMIN_TABLE_TH}>{labels.order}</th>
                <th className={ADMIN_TABLE_TH}>{labels.status}</th>
                <th className={ADMIN_TABLE_TH}>{labels.date}</th>
              </tr>
            </thead>
            <tbody className={ADMIN_TABLE_TBODY}>
              {rows.map((row) => (
                <tr key={row.orderId} className={ADMIN_TABLE_ROW}>
                  <td className={ADMIN_TABLE_TD}>
                    <span className="font-mono text-sm font-semibold tracking-wide text-red-600">
                      {row.code}
                    </span>
                  </td>
                  <td className={ADMIN_TABLE_TD}>
                    {formatCouponOffer(
                      row.discountType,
                      row.discountValue,
                      row.currency,
                      locale,
                    )}
                  </td>
                  <td className={ADMIN_TABLE_TD}>
                    <span className="font-medium text-gray-900">
                      {formatCouponSavings(
                        row.discountAmount,
                        row.currency,
                        locale,
                      )}
                    </span>
                  </td>
                  <td className={ADMIN_TABLE_TD}>
                    <span className="font-medium text-gray-900">
                      {row.orderNumber}
                    </span>
                  </td>
                  <td className={ADMIN_TABLE_TD}>
                    <span
                      className={`${ADMIN_BADGE} ${orderStatusBadgeClass(row.status)}`}
                    >
                      {formatOrderStatusLabel(row.status)}
                    </span>
                  </td>
                  <td className={ADMIN_TABLE_TD}>
                    <span className="text-xs text-gray-500">
                      {new Date(row.placedAt)
                        .toISOString()
                        .slice(0, 16)
                        .replace("T", " ")}{" "}
                      UTC
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 ? (
          <div className={`${ADMIN_TABLE_STATE_INSET} space-y-1`}>
            <p className="text-sm font-medium text-gray-800">{labels.empty}</p>
            <p className="text-sm text-gray-600">{labels.emptyHint}</p>
          </div>
        ) : (
          <div className={ADMIN_TABLE_FOOTER_ROUNDED_B}>
            <p className="text-sm text-gray-600">
              {labels.pageCount.replace("{count}", String(rows.length))}
            </p>
          </div>
        )}
      </Card>
    </section>
  );
}
