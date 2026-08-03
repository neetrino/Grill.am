"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Copy, Pencil, Trash2 } from "lucide-react";

import { useConfirmDelete } from "@/components/modal/ConfirmDeleteProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ADMIN_PAGE_SUBTITLE,
  ADMIN_PAGE_TITLE,
} from "@/features/admin/ui/admin-form-classes";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_TABLE,
  ADMIN_TABLE_CARD,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_STATE_INSET,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_THEAD,
} from "@/features/admin/ui/admin-table-classes";
import {
  deletePromotionAction,
  duplicatePromotionAction,
} from "@/features/promotions/application/upsert-promotion";
import type { AdminPromotionListItem } from "@/features/promotions/application/queries";
import { CouponDrawer } from "@/features/promotions/ui/CouponDrawer";

type AdminCouponsViewProps = {
  locale: string;
  coupons: AdminPromotionListItem[];
};

function valueLabel(discountType: string, discountValue: number): string {
  return discountType === "PERCENTAGE"
    ? `${discountValue}%`
    : String(discountValue);
}

function formatValidUntil(
  endsAt: Date | string | null,
  locale: string,
  dash: string,
): string {
  if (!endsAt) return dash;
  return new Date(endsAt).toLocaleString(locale);
}

export function AdminCouponsView({ locale, coupons }: AdminCouponsViewProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.coupons;
  const common = dictionary.common;
  const { confirmDelete } = useConfirmDelete();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] =
    useState<AdminPromotionListItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate(): void {
    setEditingCoupon(null);
    setDrawerOpen(true);
  }

  function openEdit(coupon: AdminPromotionListItem): void {
    setEditingCoupon(coupon);
    setDrawerOpen(true);
  }

  function closeDrawer(): void {
    setDrawerOpen(false);
    setEditingCoupon(null);
  }

  function runAction(action: () => Promise<void>): void {
    startTransition(async () => {
      setError(null);
      try {
        await action();
        router.refresh();
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : common.actionsFailed,
        );
      }
    });
  }

  function typeLabel(discountType: string): string {
    return discountType === "PERCENTAGE" ? copy.typePercent : copy.typeFixed;
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={ADMIN_PAGE_TITLE}>{copy.title}</h1>
          <p className={`mt-1 ${ADMIN_PAGE_SUBTITLE}`}>{copy.subtitle}</p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          {copy.add}
        </Button>
      </div>

      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}

      <Card className={ADMIN_TABLE_CARD}>
        {coupons.length === 0 ? (
          <p className={`${ADMIN_TABLE_STATE_INSET} text-sm text-gray-600`}>
            {copy.empty}
          </p>
        ) : (
          <div className={ADMIN_TABLE_OUTER_SCROLL}>
            <table className={ADMIN_TABLE}>
              <thead className={ADMIN_TABLE_THEAD}>
                <tr>
                  <th className={ADMIN_TABLE_TH}>{copy.table.code}</th>
                  <th className={ADMIN_TABLE_TH}>{copy.table.type}</th>
                  <th className={ADMIN_TABLE_TH}>{copy.table.value}</th>
                  <th className={ADMIN_TABLE_TH}>{copy.table.usageLimit}</th>
                  <th className={ADMIN_TABLE_TH}>{copy.table.used}</th>
                  <th className={ADMIN_TABLE_TH}>{copy.table.active}</th>
                  <th className={ADMIN_TABLE_TH}>{copy.table.validUntil}</th>
                  <th className={ADMIN_TABLE_TH}>{common.actions}</th>
                </tr>
              </thead>
              <tbody className={ADMIN_TABLE_TBODY}>
                {coupons.map((promo) => (
                  <tr key={promo.id} className={ADMIN_TABLE_ROW}>
                    <td className={ADMIN_TABLE_TD}>
                      <span className="font-medium text-gray-900">
                        {promo.code}
                      </span>
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      {typeLabel(promo.discountType)}
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      {valueLabel(promo.discountType, promo.discountValue)}
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      {promo.totalUsageLimit ?? common.dash}
                    </td>
                    <td className={ADMIN_TABLE_TD}>{promo.usedCount}</td>
                    <td className={ADMIN_TABLE_TD}>
                      {promo.isActive ? (
                        <Check
                          className="h-4 w-4 text-gray-900"
                          aria-label={common.active}
                        />
                      ) : (
                        <span className="text-gray-400">{common.dash}</span>
                      )}
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      <span className="text-sm text-gray-700">
                        {formatValidUntil(promo.endsAt, locale, common.dash)}
                      </span>
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          aria-label={formatAdminMessage(copy.editNamed, {
                            code: promo.code ?? "",
                          })}
                          onClick={() => openEdit(promo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          aria-label={formatAdminMessage(copy.duplicateNamed, {
                            code: promo.code ?? "",
                          })}
                          onClick={() =>
                            runAction(async () => {
                              const result = await duplicatePromotionAction(
                                locale,
                                promo.id,
                              );
                              if (!result.ok) {
                                throw new Error(result.error.message);
                              }
                            })
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          className="rounded p-1.5 text-red-500 hover:bg-red-50"
                          aria-label={formatAdminMessage(copy.deleteNamed, {
                            code: promo.code ?? "",
                          })}
                          onClick={() =>
                            void (async () => {
                              const accepted = await confirmDelete({
                                title: common.confirmDeleteTitle,
                                message: formatAdminMessage(
                                  copy.confirmDelete,
                                  { code: promo.code ?? "" },
                                ),
                                confirmText: common.delete,
                                cancelText: common.cancel,
                              });
                              if (!accepted) return;

                              runAction(async () => {
                                const result = await deletePromotionAction(
                                  locale,
                                  promo.id,
                                );
                                if (!result.ok) {
                                  throw new Error(result.error.message);
                                }
                              });
                            })()
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CouponDrawer
        locale={locale}
        open={drawerOpen}
        onClose={closeDrawer}
        coupon={editingCoupon}
      />
    </section>
  );
}
