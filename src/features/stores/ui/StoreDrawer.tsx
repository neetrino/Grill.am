"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { SideSheet } from "@/components/drawer/SideSheet";
import { Button } from "@/components/ui/Button";
import {
  ADMIN_FIELD,
  ADMIN_FORM_STACK,
  ADMIN_INPUT,
  ADMIN_LABEL,
} from "@/features/admin/ui/admin-form-classes";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { AdminLocaleTabs } from "@/features/admin/ui/AdminLocaleTabs";
import { ADMIN_BTN_DASHED_CLASS } from "@/features/admin/ui/admin-ui";
import {
  createStoreAction,
  updateStoreAction,
} from "@/features/stores/application/manage-stores";
import type { AdminStoreListItem } from "@/features/stores/application/queries";
import {
  draftsFromStoreTranslations,
  resolveStoreDrawerLocale,
  type StoreLocaleDraft,
} from "@/features/stores/ui/store-drawer-drafts";
import type { Locale } from "@/lib/i18n/config";

const STORE_DRAWER_FORM_ID = "store-drawer-form";

type StoreDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  store?: AdminStoreListItem | null;
};

export function StoreDrawer({
  locale,
  open,
  onClose,
  store = null,
}: StoreDrawerProps) {
  return (
    <StoreDrawerForm
      key={store?.id ?? "create"}
      locale={locale}
      open={open}
      onClose={onClose}
      store={store}
    />
  );
}

type StoreDrawerFormProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  store: AdminStoreListItem | null;
};

function StoreDrawerForm({
  locale,
  open,
  onClose,
  store,
}: StoreDrawerFormProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.stores.drawer;
  const common = dictionary.common;
  const router = useRouter();
  const isEdit = store != null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeLocale, setActiveLocale] = useState<Locale>(() =>
    resolveStoreDrawerLocale(locale, store?.translations),
  );
  const [drafts, setDrafts] = useState<Record<Locale, StoreLocaleDraft>>(() =>
    draftsFromStoreTranslations(store?.translations),
  );
  const [phone, setPhone] = useState(store?.phone ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    store?.imageUrl ?? null,
  );
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const draft = drafts[activeLocale];
  const drawerTitle = isEdit ? copy.editTitle : copy.createTitle;
  const canSubmit = Boolean(draft.title.trim() && draft.address.trim());

  function updateDraft(patch: Partial<StoreLocaleDraft>): void {
    setDrafts((current) => ({
      ...current,
      [activeLocale]: { ...current[activeLocale], ...patch },
    }));
  }

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title={drawerTitle}
      closeLabel={common.close}
      footer={
        <div className="flex items-center gap-4 border-t border-gray-100 px-5 py-4 lg:px-4">
          <Button
            type="submit"
            form={STORE_DRAWER_FORM_ID}
            disabled={isPending || !canSubmit}
          >
            {isPending
              ? isEdit
                ? common.saving
                : common.creating
              : isEdit
                ? copy.saveChanges
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
        id={STORE_DRAWER_FORM_ID}
        className={ADMIN_FORM_STACK}
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) return;
          const current = drafts[activeLocale];
          const formData = new FormData();
          formData.set("editingLocale", activeLocale);
          formData.set("title", current.title.trim());
          formData.set("address", current.address.trim());
          formData.set("phone", phone.trim());
          if (imageFile) {
            formData.set("image", imageFile);
          }
          if (removeExistingImage) {
            formData.set("removeImage", "1");
          }

          startTransition(async () => {
            setError(null);
            const result =
              isEdit && store
                ? await updateStoreAction(locale, store.id, formData)
                : await createStoreAction(locale, formData);

            if (!result.ok) {
              setError(result.error.message);
              return;
            }

            onClose();
            router.refresh();
          });
        }}
      >
        <AdminLocaleTabs
          activeLocale={activeLocale}
          onChange={setActiveLocale}
          disabled={isPending}
        />

        <label className={ADMIN_FIELD}>
          <span className={ADMIN_LABEL}>{copy.title}</span>
          <input
            required
            value={draft.title}
            onChange={(event) => updateDraft({ title: event.target.value })}
            className={ADMIN_INPUT}
            disabled={isPending}
          />
        </label>

        <label className={ADMIN_FIELD}>
          <span className={ADMIN_LABEL}>{copy.address}</span>
          <input
            required
            value={draft.address}
            onChange={(event) => updateDraft({ address: event.target.value })}
            className={ADMIN_INPUT}
            disabled={isPending}
          />
        </label>

        <label className={ADMIN_FIELD}>
          <span className={ADMIN_LABEL}>{copy.phone}</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className={ADMIN_INPUT}
            disabled={isPending}
          />
        </label>

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
                setRemoveExistingImage(false);
              }}
            />
            {imagePreview ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setImageFile(null);
                  setImagePreview((current) => {
                    if (current?.startsWith("blob:")) {
                      URL.revokeObjectURL(current);
                    }
                    return null;
                  });
                  if (isEdit && store?.imageUrl) {
                    setRemoveExistingImage(true);
                  }
                }}
                className="text-sm font-medium text-gray-600 hover:text-red-600"
              >
                {common.remove}
              </button>
            ) : null}
          </div>
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob/admin preview
            <img
              src={imagePreview}
              alt=""
              className="mt-3 h-28 w-full rounded-xl border border-gray-200 object-cover"
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
