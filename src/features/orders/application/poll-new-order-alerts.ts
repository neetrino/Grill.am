"use server";

import {
  listRecentOrdersForAlert,
  NEW_ORDER_ALERT_LOOKBACK_MS,
  type NewOrderAlertItem,
} from "@/features/orders/application/list-recent-orders-for-alert";
import { requireOrdersStaff } from "@/lib/auth/policies";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { err, ok, type Result } from "@/lib/result";

export type NewOrderAlertDto = {
  id: string;
  orderNumber: string;
  contactName: string;
  totalAmount: number;
  baseCurrency: string;
  paymentMethod: string | null;
  placedAt: string;
};

export type PollNewOrderAlertsValue = {
  orders: NewOrderAlertDto[];
  polledAt: string;
};

function toDto(row: NewOrderAlertItem): NewOrderAlertDto {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    contactName: row.contactName,
    totalAmount: row.totalAmount,
    baseCurrency: row.baseCurrency,
    paymentMethod: row.paymentMethod,
    placedAt: row.placedAt.toISOString(),
  };
}

/**
 * Authenticated poll of recent orders for the admin new-order sound alert.
 * Client filters by local baseline + acknowledged IDs.
 */
export async function pollNewOrderAlertsAction(
  locale: string,
): Promise<Result<PollNewOrderAlertsValue>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  await requireOrdersStaff(locale as Locale);

  const since = new Date(Date.now() - NEW_ORDER_ALERT_LOOKBACK_MS);
  const rows = await listRecentOrdersForAlert(since);

  return ok({
    orders: rows.map(toDto),
    polledAt: new Date().toISOString(),
  });
}
