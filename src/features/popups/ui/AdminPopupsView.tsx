"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ADMIN_PAGE_SUBTITLE,
  ADMIN_PAGE_TITLE,
  ADMIN_SECTION_TITLE,
} from "@/features/admin/ui/admin-form-classes";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import { ADMIN_BADGE } from "@/features/admin/ui/status-badge";
import type { AdminPopupListItem } from "@/features/popups/application/queries";
import { MAX_POPUPS } from "@/features/popups/domain/popup-rules";
import { PopupControls } from "@/features/popups/ui/PopupControls";
import { PopupDrawer } from "@/features/popups/ui/PopupDrawer";

type AdminPopupsViewProps = {
  locale: string;
  items: AdminPopupListItem[];
};

export function AdminPopupsView({ locale, items }: AdminPopupsViewProps) {
  const copy = useAdminDictionary().popups;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<AdminPopupListItem | null>(
    null,
  );

  const atLimit = items.length >= MAX_POPUPS;

  function openCreate(): void {
    setEditingPopup(null);
    setDrawerOpen(true);
  }

  function openEdit(popup: AdminPopupListItem): void {
    setEditingPopup(popup);
    setDrawerOpen(true);
  }

  function closeDrawer(): void {
    setDrawerOpen(false);
    setEditingPopup(null);
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={ADMIN_PAGE_TITLE}>{copy.title}</h1>
          <p className={`mt-1 ${ADMIN_PAGE_SUBTITLE}`}>
            {formatAdminMessage(copy.count, {
              count: String(items.length),
              max: String(MAX_POPUPS),
            })}
          </p>
        </div>
        <Button type="button" onClick={openCreate} disabled={atLimit}>
          {copy.create}
        </Button>
      </div>

      {atLimit ? (
        <p className="mb-4 text-sm text-amber-800">
          {formatAdminMessage(copy.limitReached, { max: String(MAX_POPUPS) })}
        </p>
      ) : null}

      <div className="mb-4">
        <h2 className={ADMIN_SECTION_TITLE}>
          {formatAdminMessage(copy.listHeading, {
            count: String(items.length),
          })}
        </h2>
      </div>

      <div className="space-y-3">
        {items.map((popup) => (
          <Card key={popup.id} className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 flex-1 gap-3">
                {popup.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                  <img
                    src={popup.imageUrl}
                    alt=""
                    className="h-20 w-28 shrink-0 rounded-lg border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-xs text-gray-400">
                    {copy.noImage}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{copy.itemLabel}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {popup.createdAtLabel}
                  </p>
                  <div className="mt-2">
                    <span
                      className={`${ADMIN_BADGE} ${
                        popup.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {popup.isActive ? copy.active : copy.inactive}
                    </span>
                  </div>
                </div>
              </div>
              <PopupControls
                locale={locale}
                popupId={popup.id}
                isActive={popup.isActive}
                onEdit={() => openEdit(popup)}
              />
            </div>
          </Card>
        ))}
        {items.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-sm text-gray-600">{copy.empty}</p>
          </Card>
        ) : null}
      </div>

      <PopupDrawer
        locale={locale}
        open={drawerOpen}
        onClose={closeDrawer}
        popup={editingPopup}
      />
    </section>
  );
}
