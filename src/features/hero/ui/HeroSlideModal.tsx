"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { SideSheet } from "@/components/drawer/SideSheet";
import { Button } from "@/components/ui/Button";
import type { HeroTranslationsJson } from "@/db/schema";
import {
  ADMIN_INPUT,
  ADMIN_LABEL,
} from "@/features/admin/ui/admin-form-classes";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { AdminLocaleTabs } from "@/features/admin/ui/AdminLocaleTabs";
import { ADMIN_BTN_DASHED_CLASS } from "@/features/admin/ui/admin-ui";
import {
  createHeroSlideAction,
  updateHeroSlideAction,
} from "@/features/hero/application/manage-hero";
import type { AdminHeroSlideListItem } from "@/features/hero/application/queries";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";

const HERO_SLIDE_FORM_ID = "hero-slide-form";

type LocaleDraft = {
  title: string;
  subtitle: string;
};

type HeroSlideModalProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  slide?: AdminHeroSlideListItem | null;
};

function emptyDraft(): LocaleDraft {
  return { title: "", subtitle: "" };
}

function draftsFromTranslations(
  translations: HeroTranslationsJson | undefined,
): Record<Locale, LocaleDraft> {
  const next = {
    hy: emptyDraft(),
    en: emptyDraft(),
    ru: emptyDraft(),
  } satisfies Record<Locale, LocaleDraft>;

  for (const loc of locales) {
    const copy = translations?.[loc];
    if (!copy) continue;
    next[loc] = {
      title: copy.title,
      subtitle: copy.subtitle ?? "",
    };
  }

  return next;
}

function resolveInitialLocale(
  pageLocale: string,
  translations: HeroTranslationsJson | undefined,
): Locale {
  if (isLocale(pageLocale)) {
    return pageLocale;
  }
  return (
    (locales.find((loc) => translations?.[loc]?.title) as Locale | undefined) ??
    "hy"
  );
}

export function HeroSlideModal({
  locale,
  open,
  onClose,
  slide = null,
}: HeroSlideModalProps) {
  return (
    <HeroSlideDrawerForm
      key={slide?.id ?? "create"}
      locale={locale}
      open={open}
      onClose={onClose}
      slide={slide}
    />
  );
}

type HeroSlideDrawerFormProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  slide: AdminHeroSlideListItem | null;
};

function HeroSlideDrawerForm({
  locale,
  open,
  onClose,
  slide,
}: HeroSlideDrawerFormProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.hero.modal;
  const common = dictionary.common;
  const router = useRouter();
  const isEdit = slide != null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeLocale, setActiveLocale] = useState<Locale>(() =>
    resolveInitialLocale(locale, slide?.translations),
  );
  const [drafts, setDrafts] = useState<Record<Locale, LocaleDraft>>(() =>
    draftsFromTranslations(slide?.translations),
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    slide?.imageUrl ?? null,
  );
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const draft = drafts[activeLocale];
  const modalTitle = isEdit ? copy.editTitle : copy.createTitle;

  function updateDraft(patch: Partial<LocaleDraft>): void {
    setDrafts((current) => ({
      ...current,
      [activeLocale]: { ...current[activeLocale], ...patch },
    }));
  }

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title={modalTitle}
      closeLabel={common.close}
      footer={
        <div className="flex items-center gap-4 border-t border-gray-100 px-5 py-4 lg:px-4">
          <Button
            type="submit"
            form={HERO_SLIDE_FORM_ID}
            disabled={isPending || !draft.title.trim()}
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
        id={HERO_SLIDE_FORM_ID}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const current = drafts[activeLocale];
          const formData = new FormData();
          formData.set("editingLocale", activeLocale);
          formData.set("title", current.title.trim());
          formData.set("subtitle", current.subtitle.trim());
          if (imageFile) {
            formData.set("image", imageFile);
          }
          if (removeExistingImage) {
            formData.set("removeImage", "1");
          }

          startTransition(async () => {
            setError(null);
            const result =
              isEdit && slide
                ? await updateHeroSlideAction(locale, slide.id, formData)
                : await createHeroSlideAction(locale, formData);

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

        <label className="block">
          <span className={ADMIN_LABEL}>{copy.title}</span>
          <input
            required
            value={draft.title}
            onChange={(event) => updateDraft({ title: event.target.value })}
            className={ADMIN_INPUT}
            disabled={isPending}
          />
        </label>

        <label className="block">
          <span className={ADMIN_LABEL}>{copy.subtitle}</span>
          <input
            value={draft.subtitle}
            onChange={(event) =>
              updateDraft({ subtitle: event.target.value })
            }
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
                  if (isEdit && slide?.imageUrl) {
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
