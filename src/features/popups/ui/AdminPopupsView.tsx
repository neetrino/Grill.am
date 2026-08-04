"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ADMIN_PAGE_SUBTITLE,
  ADMIN_SECTION_TITLE,
} from "@/features/admin/ui/admin-form-classes";
import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_CONTENT_CARD_CLASS,
  ADMIN_CONTENT_CARD_GRID,
  ADMIN_CONTENT_CARD_STATUS_CLASS,
} from "@/features/admin/ui/admin-ui";
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
          <AdminPageTitle>{copy.title}</AdminPageTitle>
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

      {items.length === 0 ? (
        <Card className="rounded-[15px] p-6">
          <p className="text-center text-sm text-gray-600">{copy.empty}</p>
        </Card>
      ) : (
        <div className={ADMIN_CONTENT_CARD_GRID}>
          {items.map((popup) => (
            <Card key={popup.id} className={ADMIN_CONTENT_CARD_CLASS}>
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
                {popup.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                  <img
                    src={popup.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center border-b border-dashed border-gray-200 text-xs text-gray-400">
                    {copy.noImage}
                  </div>
                )}
                <span
                  className={`${ADMIN_BADGE} ${ADMIN_CONTENT_CARD_STATUS_CLASS} ${
                    popup.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {popup.isActive ? copy.active : copy.inactive}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 font-medium text-gray-900">
                    {copy.itemLabel}
                  </p>
                  <PopupControls
                    locale={locale}
                    popupId={popup.id}
                    isActive={popup.isActive}
                    onEdit={() => openEdit(popup)}
                  />
                </div>
                <p className="text-xs text-gray-500">{popup.createdAtLabel}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <PopupDrawer
        locale={locale}
        open={drawerOpen}
        onClose={closeDrawer}
        popup={editingPopup}
      />
    </section>
  );
}
