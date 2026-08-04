"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { SideSheet } from "@/components/drawer/SideSheet";
import { Button } from "@/components/ui/Button";
import { ADMIN_LABEL } from "@/features/admin/ui/admin-form-classes";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { ADMIN_BTN_DASHED_CLASS } from "@/features/admin/ui/admin-ui";
import {
  createPopupAction,
  updatePopupAction,
} from "@/features/popups/application/manage-popups";
import type { AdminPopupListItem } from "@/features/popups/application/queries";

const POPUP_DRAWER_FORM_ID = "popup-drawer-form";

type PopupDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  popup?: AdminPopupListItem | null;
};

export function PopupDrawer({
  locale,
  open,
  onClose,
  popup = null,
}: PopupDrawerProps) {
  return (
    <PopupDrawerForm
      key={popup?.id ?? "create"}
      locale={locale}
      open={open}
      onClose={onClose}
      popup={popup}
    />
  );
}

type PopupDrawerFormProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  popup: AdminPopupListItem | null;
};

function PopupDrawerForm({
  locale,
  open,
  onClose,
  popup,
}: PopupDrawerFormProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.popups.drawer;
  const common = dictionary.common;
  const router = useRouter();
  const isEdit = popup != null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    popup?.imageUrl ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const title = isEdit ? copy.editTitle : copy.createTitle;
  const canSubmit = isEdit ? Boolean(imagePreview) : Boolean(imageFile);

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title={title}
      closeLabel={common.close}
      footer={
        <div className="flex items-center gap-4 border-t border-gray-100 px-5 py-4 lg:px-4">
          <Button
            type="submit"
            form={POPUP_DRAWER_FORM_ID}
            disabled={isPending || !canSubmit}
          >
            {isPending
              ? isEdit
                ? common.saving
                : common.creating
              : isEdit
                ? common.edit
                : common.create}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            {common.cancel}
          </button>
        </div>
      }
    >
      <form
        id={POPUP_DRAWER_FORM_ID}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) return;

          const formData = new FormData();
          if (imageFile) {
            formData.set("image", imageFile);
          }

          startTransition(async () => {
            setError(null);
            const result =
              isEdit && popup
                ? await updatePopupAction(locale, popup.id, formData)
                : await createPopupAction(locale, formData);

            if (!result.ok) {
              setError(result.error.message);
              return;
            }

            onClose();
            router.refresh();
          });
        }}
      >
        <div>
          <span className={ADMIN_LABEL}>{copy.uploadImage}</span>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
              className={ADMIN_BTN_DASHED_CLASS}
            >
              {imagePreview ? copy.changeImage : copy.uploadButton}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={isPending}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                event.target.value = "";
                setImagePreview((current) => {
                  if (current?.startsWith("blob:")) {
                    URL.revokeObjectURL(current);
                  }
                  return file ? URL.createObjectURL(file) : null;
                });
                setImageFile(file);
              }}
            />
          </div>
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob/admin preview
            <img
              src={imagePreview}
              alt=""
              className="mt-3 max-h-64 w-full rounded-xl border border-gray-200 object-contain"
            />
          ) : (
            <p className="mt-2 text-sm text-gray-500">{copy.imageHint}</p>
          )}
        </div>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </form>
    </SideSheet>
  );
}
