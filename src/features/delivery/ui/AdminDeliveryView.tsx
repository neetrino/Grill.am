"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

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
import { deleteDeliveryLocationAction } from "@/features/delivery/application/manage-delivery";
import type { AdminDeliveryLocation } from "@/features/delivery/application/queries";
import { DeliveryLocationDrawer } from "@/features/delivery/ui/DeliveryLocationDrawer";
import { MinimumOrderCard } from "@/features/delivery/ui/MinimumOrderCard";
import { formatMoneyAmount } from "@/lib/money/format";

type AdminDeliveryViewProps = {
  locale: string;
  locations: AdminDeliveryLocation[];
  minimumOrderAmount: number | null;
};

export function AdminDeliveryView({
  locale,
  locations,
  minimumOrderAmount,
}: AdminDeliveryViewProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.delivery;
  const common = dictionary.common;
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLocation, setEditingLocation] =
    useState<AdminDeliveryLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate(): void {
    setEditingLocation(null);
    setDrawerOpen(true);
  }

  function openEdit(location: AdminDeliveryLocation): void {
    setEditingLocation(location);
    setDrawerOpen(true);
  }

  function closeDrawer(): void {
    setDrawerOpen(false);
    setEditingLocation(null);
  }

  function onDelete(location: AdminDeliveryLocation): void {
    if (
      !window.confirm(
        formatAdminMessage(copy.confirmDelete, { city: location.city }),
      )
    ) {
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = await deleteDeliveryLocationAction(locale, location.id);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={ADMIN_PAGE_TITLE}>{copy.title}</h1>
          <p className={`mt-1 ${ADMIN_PAGE_SUBTITLE}`}>{copy.subtitle}</p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden />
          {copy.addLocation}
        </Button>
      </div>

      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}

      <MinimumOrderCard locale={locale} initialAmount={minimumOrderAmount} />

      <Card className={ADMIN_TABLE_CARD}>
        {locations.length === 0 ? (
          <p className={`${ADMIN_TABLE_STATE_INSET} text-sm text-gray-600`}>
            {copy.empty}
          </p>
        ) : (
          <div className={ADMIN_TABLE_OUTER_SCROLL}>
            <table className={ADMIN_TABLE}>
              <thead className={ADMIN_TABLE_THEAD}>
                <tr>
                  <th className={ADMIN_TABLE_TH}>{copy.table.country}</th>
                  <th className={ADMIN_TABLE_TH}>{copy.table.city}</th>
                  <th className={ADMIN_TABLE_TH}>{copy.table.price}</th>
                  <th className={ADMIN_TABLE_TH}>{copy.table.freeFrom}</th>
                  <th className={ADMIN_TABLE_TH}>{common.actions}</th>
                </tr>
              </thead>
              <tbody className={ADMIN_TABLE_TBODY}>
                {locations.map((location) => (
                  <tr key={location.id} className={ADMIN_TABLE_ROW}>
                    <td className={ADMIN_TABLE_TD}>{location.country}</td>
                    <td className={ADMIN_TABLE_TD}>
                      <span className="font-medium text-gray-900">
                        {location.city}
                      </span>
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      {formatMoneyAmount(location.priceAmount, "AMD", locale)}
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      {location.freeThresholdAmount != null
                        ? formatMoneyAmount(
                            location.freeThresholdAmount,
                            "AMD",
                            locale,
                          )
                        : common.dash}
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(location)}
                          disabled={isPending}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          aria-label={formatAdminMessage(copy.editNamed, {
                            city: location.city,
                          })}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(location)}
                          disabled={isPending}
                          className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-700"
                          aria-label={formatAdminMessage(copy.deleteNamed, {
                            city: location.city,
                          })}
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

      <DeliveryLocationDrawer
        locale={locale}
        open={drawerOpen}
        onClose={closeDrawer}
        location={editingLocation}
      />
    </section>
  );
}
