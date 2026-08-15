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
import { AdminSelect } from "@/features/admin/ui/AdminSelect";
import { ADMIN_BTN_DASHED_CLASS } from "@/features/admin/ui/admin-ui";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { AdminLocaleTabs } from "@/features/admin/ui/AdminLocaleTabs";
import {
  createCategoryFromDrawerAction,
  updateCategoryFromDrawerAction,
} from "@/features/categories/actions";
import type { AdminCategoryListItem } from "@/features/categories/application/list-admin-categories";
import {
  buildCategoryLocaleCopies,
  draftsFromCategoryTranslations,
  filledCategoryLocales,
  resolveCategoryEditorLocale,
  resolvedCategorySlug,
  type CategoryLocaleDraft,
} from "@/features/categories/ui/category-drawer-drafts";
import { hasCategoryLocaleCopy } from "@/features/categories/domain/merge-category-translations";
import type { Locale } from "@/lib/i18n/config";

const CATEGORY_DRAWER_FORM_ID = "category-drawer-form";

type AddCategoryDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  categories: AdminCategoryListItem[];
  category?: AdminCategoryListItem | null;
};

export function AddCategoryDrawer({
  locale,
  open,
  onClose,
  categories,
  category = null,
}: AddCategoryDrawerProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.categories.drawer;
  const common = dictionary.common;
  const router = useRouter();
  const isEdit = category != null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeLocale, setActiveLocale] = useState<Locale>(() =>
    resolveCategoryEditorLocale(locale, category?.translations),
  );
  const [drafts, setDrafts] = useState(() =>
    draftsFromCategoryTranslations(category?.translations),
  );
  const [parentId, setParentId] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [synced, setSynced] = useState({ open, category, locale });

  if (
    open !== synced.open ||
    category !== synced.category ||
    locale !== synced.locale
  ) {
    setSynced({ open, category, locale });

    if (!open) {
      setActiveLocale(resolveCategoryEditorLocale(locale, undefined));
      setDrafts(draftsFromCategoryTranslations(undefined));
      setParentId("");
      setStatus("ACTIVE");
      setImageFile(null);
      setImagePreview((current) => {
        if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
        return null;
      });
      setRemoveExistingImage(false);
      setError(null);
    } else {
      setActiveLocale(
        resolveCategoryEditorLocale(locale, category?.translations),
      );
      setDrafts(draftsFromCategoryTranslations(category?.translations));
      setParentId(category?.parentId ?? "");
      setStatus(category?.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE");
      setImageFile(null);
      setImagePreview(category?.imageUrl ?? null);
      setRemoveExistingImage(false);
      setError(null);
    }
  }

  const draft = drafts[activeLocale];
  const displaySlug = resolvedCategorySlug(draft);
  const parentOptions = categories.filter((item) => item.id !== category?.id);
  const drawerTitle = isEdit ? copy.editTitle : copy.addTitle;

  function updateDraft(patch: Partial<CategoryLocaleDraft>): void {
    setDrafts((current) => ({
      ...current,
      [activeLocale]: { ...current[activeLocale], ...patch },
    }));
  }

  function resetImagePreview(): string | null {
    setImagePreview((current) => {
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
      return null;
    });
    return null;
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
            form={CATEGORY_DRAWER_FORM_ID}
            disabled={isPending}
          >
            {isPending
              ? isEdit
                ? common.saving
                : common.creating
              : isEdit
                ? common.save
                : copy.createCategory}
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
        id={CATEGORY_DRAWER_FORM_ID}
        className={ADMIN_FORM_STACK}
        onSubmit={(event) => {
          event.preventDefault();
          const localeCopies = buildCategoryLocaleCopies(drafts);
          if (!hasCategoryLocaleCopy(localeCopies)) {
            setError(copy.titleRequired);
            return;
          }

          const formData = new FormData();
          formData.set(
            "data",
            JSON.stringify({
              localeCopies,
              parentId: parentId.trim() ? parentId.trim() : null,
              status,
            }),
          );
          if (imageFile) {
            formData.set("image", imageFile);
          }
          if (removeExistingImage) {
            formData.set("removeImage", "1");
          }

          startTransition(async () => {
            setError(null);
            const result =
              isEdit && category
                ? await updateCategoryFromDrawerAction(
                    locale,
                    category.id,
                    formData,
                  )
                : await createCategoryFromDrawerAction(locale, formData);

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
          filledLocales={filledCategoryLocales(drafts)}
        />

        <label className={ADMIN_FIELD}>
          <span className={ADMIN_LABEL}>
            {copy.categoryTitle} <span className="text-red-600">*</span>
          </span>
          <input
            value={draft.title}
            onChange={(event) => updateDraft({ title: event.target.value })}
            placeholder={copy.titlePlaceholder}
            className={ADMIN_INPUT}
            disabled={isPending}
          />
        </label>

        <label className={ADMIN_FIELD}>
          <span className={ADMIN_LABEL}>{copy.slug}</span>
          <input
            value={displaySlug === "category" && !draft.title.trim() ? "" : displaySlug}
            onChange={(event) => {
              updateDraft({
                slugTouched: true,
                slug: event.target.value,
              });
            }}
            placeholder={copy.slugPlaceholder}
            className={ADMIN_INPUT}
            disabled={isPending}
          />
          <span className="mt-1 block text-xs text-gray-500">
            {copy.slugHint}
          </span>
        </label>

        <AdminSelect
          label={copy.parent}
          placeholder={copy.rootOption}
          options={[
            { value: "", label: copy.rootOption },
            ...parentOptions.map((item) => ({
              value: item.id,
              label: item.title,
            })),
          ]}
          value={parentId}
          disabled={isPending}
          onChange={setParentId}
        />

        <AdminSelect
          label={copy.status}
          placeholder={copy.status}
          options={[
            { value: "ACTIVE", label: copy.published },
            { value: "ARCHIVED", label: copy.archived },
          ]}
          value={status}
          disabled={isPending}
          onChange={(value) => setStatus(value as "ACTIVE" | "ARCHIVED")}
        />

        <div>
          <span className={ADMIN_LABEL}>{copy.image}</span>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
              className={ADMIN_BTN_DASHED_CLASS}
            >
              {imagePreview ? copy.changeImage : copy.uploadImage}
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
                  resetImagePreview();
                  if (isEdit && category?.imageUrl) {
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
              className="mt-3 h-28 w-28 rounded-xl border border-gray-200 object-cover"
            />
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </form>
    </SideSheet>
  );
}
