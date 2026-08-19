"use client";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TD_CENTER,
} from "@/features/admin/ui/admin-table-classes";
import type { AdminStoreListItem } from "@/features/stores/application/queries";
import { StoreControls } from "@/features/stores/ui/StoreControls";

type AdminStoreRowProps = {
  locale: string;
  store: AdminStoreListItem;
  onEdit: () => void;
};

export function AdminStoreRow({ locale, store, onEdit }: AdminStoreRowProps) {
  const copy = useAdminDictionary().stores;
  const common = useAdminDictionary().common;

  return (
    <tr className={ADMIN_TABLE_ROW}>
      <td className={ADMIN_TABLE_TD}>
        <div className="flex min-w-[200px] items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-100">
            {store.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin table thumbnails
              <img
                src={store.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[10px] text-gray-400">{copy.noImage}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">{store.title}</p>
            <p className="truncate text-xs text-gray-500">{store.slug}</p>
          </div>
        </div>
      </td>
      <td className={ADMIN_TABLE_TD}>
        <span className="line-clamp-2 text-gray-700">
          {store.address || common.dash}
        </span>
      </td>
      <td className={ADMIN_TABLE_TD_CENTER}>
        <span className="text-gray-700">{store.phone || common.dash}</span>
      </td>
      <td className={ADMIN_TABLE_TD_CENTER}>
        <div className="inline-flex items-center justify-center">
          <StoreControls
            locale={locale}
            storeId={store.id}
            storeTitle={store.title}
            isActive={store.isActive}
            onEdit={onEdit}
          />
        </div>
      </td>
    </tr>
  );
}
