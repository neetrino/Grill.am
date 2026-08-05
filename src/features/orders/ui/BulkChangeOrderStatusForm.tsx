"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useConfirmDelete } from "@/components/modal/ConfirmDeleteProvider";
import { Card } from "@/components/ui/Card";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_TABLE,
  ADMIN_TABLE_CARD,
  ADMIN_TABLE_CHECKBOX,
  ADMIN_TABLE_FOOTER_ROUNDED_B,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_STATE_INSET,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TD_CENTER,
  ADMIN_TABLE_TD_CHECK,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_TH_CENTER,
  ADMIN_TABLE_TH_CHECK,
  ADMIN_TABLE_THEAD,
} from "@/features/admin/ui/admin-table-classes";
import { ADMIN_BTN_PRIMARY_CLASS } from "@/features/admin/ui/admin-ui";
import { bulkArchiveOrdersAction } from "@/features/orders/application/bulk-archive-orders";
import { AdminInlineStatusSelect } from "@/features/orders/ui/AdminInlineStatusSelect";

type BulkOrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  contactName: string;
  contactEmail: string;
  totalAmount: number;
  baseCurrency: string;
  placedAt: string | Date;
  isArchived: boolean;
};

type BulkChangeOrderStatusFormProps = {
  locale: string;
  orders: BulkOrderRow[];
  onOpenOrder: (orderNumber: string) => void;
};

function formatMoney(amount: number, currency: string): string {
  return `${amount.toLocaleString("en-US")} ${currency}`;
}

/** Row cells with their own controls (checkbox, inline status selects). */
const ROW_CONTROL_SELECTOR = "button, input, select, textarea, a, label";

function isRowControl(target: EventTarget | null): boolean {
  return (
    target instanceof Element && target.closest(ROW_CONTROL_SELECTOR) !== null
  );
}

export function BulkChangeOrderStatusForm({
  locale,
  orders,
  onOpenOrder,
}: BulkChangeOrderStatusFormProps) {
  const dictionary = useAdminDictionary();
  const list = dictionary.orders.list;
  const bulk = dictionary.orders.bulk;
  const common = dictionary.common;
  const { confirmDelete } = useConfirmDelete();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allNumbers = orders.map((order) => order.orderNumber);
  const allSelected =
    allNumbers.length > 0 && allNumbers.every((n) => selected.has(n));

  function toggleOne(orderNumber: string): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(orderNumber)) {
        next.delete(orderNumber);
      } else {
        next.add(orderNumber);
      }
      return next;
    });
  }

  function toggleAll(): void {
    setSelected(allSelected ? new Set() : new Set(allNumbers));
  }

  function deleteSelected(): void {
    if (selected.size === 0) {
      setError(bulk.selectAtLeastOne);
      return;
    }

    void (async () => {
      const accepted = await confirmDelete({
        title: common.confirmDeleteTitle,
        message: formatAdminMessage(bulk.confirmDelete, {
          count: String(selected.size),
        }),
        confirmText: common.delete,
        cancelText: common.cancel,
      });
      if (!accepted) return;

      startTransition(async () => {
        setError(null);
        setMessage(null);
        const result = await bulkArchiveOrdersAction(locale, {
          orderNumbers: [...selected],
        });

        if (!result.ok) {
          setError(result.error.message);
          return;
        }

        setMessage(
          formatAdminMessage(bulk.deletedResult, {
            deleted: String(result.value.archived),
            skipped: String(result.value.skipped),
          }),
        );
        setSelected(new Set());
        router.refresh();
      });
    })();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-gray-700">
          {formatAdminMessage(bulk.selectedCount, {
            count: String(selected.size),
          })}
        </p>
        <button
          type="button"
          disabled={isPending || selected.size === 0}
          onClick={deleteSelected}
          className={ADMIN_BTN_PRIMARY_CLASS}
        >
          {isPending ? bulk.deleting : bulk.deleteSelected}
        </button>
        {error ? (
          <p className="w-full text-sm text-red-700">{error}</p>
        ) : null}
        {message ? (
          <p className="w-full text-sm text-green-700">{message}</p>
        ) : null}
      </Card>

      <Card className={ADMIN_TABLE_CARD}>
        <div className={ADMIN_TABLE_OUTER_SCROLL}>
          <table className={ADMIN_TABLE}>
            <thead className={ADMIN_TABLE_THEAD}>
              <tr>
                <th className={ADMIN_TABLE_TH_CHECK}>
                  <input
                    type="checkbox"
                    className={ADMIN_TABLE_CHECKBOX}
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={isPending || orders.length === 0}
                    aria-label={list.selectAll}
                  />
                </th>
                <th className={ADMIN_TABLE_TH}>{list.order}</th>
                <th className={ADMIN_TABLE_TH}>{list.customer}</th>
                <th className={ADMIN_TABLE_TH_CENTER}>{list.status}</th>
                <th className={ADMIN_TABLE_TH_CENTER}>{list.payment}</th>
                <th className={ADMIN_TABLE_TH_CENTER}>{list.total}</th>
                <th className={ADMIN_TABLE_TH}>{list.placed}</th>
              </tr>
            </thead>
            <tbody className={ADMIN_TABLE_TBODY}>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className={`${ADMIN_TABLE_ROW} cursor-pointer`}
                  tabIndex={0}
                  role="button"
                  aria-label={formatAdminMessage(list.openOrder, {
                    orderNumber: order.orderNumber,
                  })}
                  onClick={(event) => {
                    if (isRowControl(event.target)) {
                      return;
                    }
                    onOpenOrder(order.orderNumber);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") {
                      return;
                    }
                    if (isRowControl(event.target)) {
                      return;
                    }
                    event.preventDefault();
                    onOpenOrder(order.orderNumber);
                  }}
                >
                  <td className={ADMIN_TABLE_TD_CHECK}>
                    <input
                      type="checkbox"
                      className={ADMIN_TABLE_CHECKBOX}
                      checked={selected.has(order.orderNumber)}
                      onChange={() => toggleOne(order.orderNumber)}
                      disabled={isPending || order.isArchived}
                      aria-label={formatAdminMessage(list.selectOrder, {
                        orderNumber: order.orderNumber,
                      })}
                    />
                  </td>
                  <td className={ADMIN_TABLE_TD}>
                    <span className="font-medium text-gray-900">
                      {order.orderNumber}
                    </span>
                    {order.isArchived ? (
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase text-gray-600">
                        {list.archived}
                      </span>
                    ) : null}
                  </td>
                  <td className={ADMIN_TABLE_TD}>
                    <p className="text-sm text-gray-900">{order.contactName}</p>
                    <p className="text-xs text-gray-500">{order.contactEmail}</p>
                  </td>
                  <td className={ADMIN_TABLE_TD_CENTER}>
                    <div className="flex justify-center">
                      <AdminInlineStatusSelect
                        locale={locale}
                        orderNumber={order.orderNumber}
                        kind="order"
                        value={order.status}
                        disabled={isPending || order.isArchived}
                      />
                    </div>
                  </td>
                  <td className={ADMIN_TABLE_TD_CENTER}>
                    <div className="flex justify-center">
                      <AdminInlineStatusSelect
                        locale={locale}
                        orderNumber={order.orderNumber}
                        kind="payment"
                        value={order.paymentStatus}
                        disabled={isPending || order.isArchived}
                      />
                    </div>
                  </td>
                  <td className={ADMIN_TABLE_TD_CENTER}>
                    <span className="font-medium text-gray-900">
                      {formatMoney(order.totalAmount, order.baseCurrency)}
                    </span>
                  </td>
                  <td className={ADMIN_TABLE_TD}>
                    <span className="text-xs text-gray-500">
                      {new Date(order.placedAt)
                        .toISOString()
                        .slice(0, 16)
                        .replace("T", " ")}{" "}
                      {common.utc}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 ? (
          <p className={`${ADMIN_TABLE_STATE_INSET} text-sm text-gray-600`}>
            {list.empty}
          </p>
        ) : (
          <div className={ADMIN_TABLE_FOOTER_ROUNDED_B}>
            <p className="text-sm text-gray-600">
              {formatAdminMessage(list.selectedOnPage, {
                count: String(selected.size),
              })}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
