"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { ADMIN_LABEL } from "@/features/admin/ui/admin-form-classes";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import {
  createPopupAction,
  updatePopupAction,
} from "@/features/popups/application/manage-popups";
import type { AdminPopupListItem } from "@/features/popups/application/queries";

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
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <PopupDrawerForm
      key={popup?.id ?? "create"}
      locale={locale}
      onClose={onClose}
      popup={popup}
    />
  );
}

type PopupDrawerFormProps = {
  locale: string;
  onClose: () => void;
  popup: AdminPopupListItem | null;
};

function PopupDrawerForm({ locale, onClose, popup }: PopupDrawerFormProps) {
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
  const canSubmit = isEdit
    ? Boolean(imagePreview)
    : Boolean(imageFile);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label={common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
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
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <div>
              <span className={ADMIN_LABEL}>{copy.uploadImage}</span>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center rounded-xl border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50"
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
          </div>

          <div className="flex items-center gap-4 border-t border-gray-200 px-5 py-4">
            <Button type="submit" disabled={isPending || !canSubmit}>
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
        </form>
      </div>
    </div>
  );
}
