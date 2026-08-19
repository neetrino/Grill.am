"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ADMIN_PAGE_SUBTITLE } from "@/features/admin/ui/admin-form-classes";
import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_TABLE,
  ADMIN_TABLE_CARD,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_STATE_INSET,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_TH_CENTER,
  ADMIN_TABLE_THEAD,
} from "@/features/admin/ui/admin-table-classes";
import type { AdminStoreListItem } from "@/features/stores/application/queries";
import { AdminStoreRow } from "@/features/stores/ui/AdminStoreRow";
import { StoreDrawer } from "@/features/stores/ui/StoreDrawer";

type AdminStoresViewProps = {
  locale: string;
  stores: AdminStoreListItem[];
};

export function AdminStoresView({ locale, stores }: AdminStoresViewProps) {
  const copy = useAdminDictionary().stores;
  const common = useAdminDictionary().common;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<AdminStoreListItem | null>(
    null,
  );

  function openCreate(): void {
    setEditingStore(null);
    setDrawerOpen(true);
  }

  function openEdit(store: AdminStoreListItem): void {
    setEditingStore(store);
    setDrawerOpen(true);
  }

  function closeDrawer(): void {
    setDrawerOpen(false);
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <AdminPageTitle>{copy.title}</AdminPageTitle>
          <p className={`mt-1 ${ADMIN_PAGE_SUBTITLE}`}>
            {formatAdminMessage(copy.count, {
              count: String(stores.length),
            })}
          </p>
        </div>
        <Button type="button" onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden />
          {copy.create}
        </Button>
      </div>

      <Card className={ADMIN_TABLE_CARD}>
        {stores.length === 0 ? (
          <p className={`${ADMIN_TABLE_STATE_INSET} text-sm text-gray-600`}>
            {copy.empty}
          </p>
        ) : (
          <div className={ADMIN_TABLE_OUTER_SCROLL}>
            <table className={ADMIN_TABLE}>
              <thead className={ADMIN_TABLE_THEAD}>
                <tr>
                  <th className={ADMIN_TABLE_TH}>{copy.table.branch}</th>
                  <th className={ADMIN_TABLE_TH}>{copy.table.address}</th>
                  <th className={ADMIN_TABLE_TH_CENTER}>{copy.table.phone}</th>
                  <th className={ADMIN_TABLE_TH_CENTER}>{common.actions}</th>
                </tr>
              </thead>
              <tbody className={ADMIN_TABLE_TBODY}>
                {stores.map((store) => (
                  <AdminStoreRow
                    key={store.id}
                    locale={locale}
                    store={store}
                    onEdit={() => openEdit(store)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <StoreDrawer
        locale={locale}
        open={drawerOpen}
        onClose={closeDrawer}
        store={editingStore}
      />
    </section>
  );
}
