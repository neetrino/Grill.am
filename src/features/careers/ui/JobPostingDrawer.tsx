"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { SideSheet } from "@/components/drawer/SideSheet";
import { Button } from "@/components/ui/Button";
import { ADMIN_FORM_STACK } from "@/features/admin/ui/admin-form-classes";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import {
  createJobPostingAction,
  updateJobPostingAction,
} from "@/features/careers/application/manage-job";
import type { AdminJobListItem } from "@/features/careers/application/queries";
import {
  normalizeJobSlug,
  resolveSharedJobSlug,
  type JobEmploymentType,
  type JobPostingStatus,
  type JobTranslations,
} from "@/features/careers/domain/job-rules";
import {
  JobPostingDrawerFields,
  type JobLocaleDraft,
} from "@/features/careers/ui/JobPostingDrawerFields";
import { locales, type Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

const JOB_POSTING_DRAWER_FORM_ID = "job-posting-drawer-form";

type JobPostingDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  posting?: AdminJobListItem | null;
};

function emptyDraft(): JobLocaleDraft {
  return {
    title: "",
    summary: "",
    description: "",
    location: "",
  };
}

function draftsFromTranslations(
  translations: JobTranslations | undefined,
): Record<Locale, JobLocaleDraft> {
  const next = {
    hy: emptyDraft(),
    en: emptyDraft(),
    ru: emptyDraft(),
  } satisfies Record<Locale, JobLocaleDraft>;

  for (const loc of locales) {
    const copy = translations?.[loc];
    if (!copy) continue;
    next[loc] = {
      title: copy.title,
      summary: copy.summary ?? "",
      description: copy.description,
      location: copy.location ?? "",
    };
  }

  return next;
}

function resolvedSlug(
  slug: string,
  slugTouched: boolean,
  title: string,
): string {
  if (slugTouched && slug.trim()) {
    return normalizeJobSlug(slug);
  }
  const fromTitle = normalizeJobSlug(title);
  return fromTitle || `job-${Date.now().toString(36)}`;
}

export function JobPostingDrawer({
  locale,
  open,
  onClose,
  posting = null,
}: JobPostingDrawerProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.careers.drawer;
  const common = dictionary.common;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = posting != null;
  const [activeLocale, setActiveLocale] = useState<Locale>(() => {
    if (!posting) return "en";
    return (
      (locales.find((loc) => posting.translations[loc]?.title) as
        | Locale
        | undefined) ?? "en"
    );
  });
  const [drafts, setDrafts] = useState<Record<Locale, JobLocaleDraft>>(() =>
    draftsFromTranslations(posting?.translations),
  );
  const [slug, setSlug] = useState(
    () => resolveSharedJobSlug(posting?.translations),
  );
  const [slugTouched, setSlugTouched] = useState(() =>
    Boolean(resolveSharedJobSlug(posting?.translations)),
  );
  const [status, setStatus] = useState<JobPostingStatus>(
    () => posting?.status ?? "DRAFT",
  );
  const [employmentType, setEmploymentType] = useState<JobEmploymentType>(
    () => posting?.employmentType ?? "FULL_TIME",
  );
  const [salaryAmount, setSalaryAmount] = useState(
    () => (posting?.salaryAmount != null ? String(posting.salaryAmount) : ""),
  );
  const [salaryCurrency, setSalaryCurrency] = useState<Currency>(
    () => posting?.salaryCurrency ?? "AMD",
  );
  const [sortOrder, setSortOrder] = useState(
    () => String(posting?.sortOrder ?? 0),
  );
  const [publishedAt, setPublishedAt] = useState(
    () => posting?.publishedAt ?? "",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    () => posting?.coverUrl ?? null,
  );
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const draft = drafts[activeLocale];
  const drawerTitle = isEdit ? copy.editShort : copy.addShort;

  function updateDraft(patch: Partial<JobLocaleDraft>): void {
    setDrafts((current) => ({
      ...current,
      [activeLocale]: { ...current[activeLocale], ...patch },
    }));
  }

  function handleSlugChange(value: string): void {
    setSlug(value);
    setSlugTouched(true);
  }

  function handleImageSelected(file: File | null): void {
    setImagePreview((current) => {
      if (current?.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return file ? URL.createObjectURL(file) : null;
    });
    setImageFile(file);
    setRemoveExistingImage(false);
  }

  function handleRemoveImage(): void {
    setImageFile(null);
    setImagePreview((current) => {
      if (current?.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
    if (isEdit && posting?.coverUrl) {
      setRemoveExistingImage(true);
    }
  }

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title={drawerTitle}
      closeLabel={common.close}
      footer={
        <div className="border-t border-gray-100 px-5 py-4 lg:px-4">
          <Button
            type="submit"
            form={JOB_POSTING_DRAWER_FORM_ID}
            className="w-full"
            disabled={isPending}
          >
            {isPending ? common.saving : common.save}
          </Button>
        </div>
      }
    >
      <form
        id={JOB_POSTING_DRAWER_FORM_ID}
        className={`${ADMIN_FORM_STACK} gap-6`}
        onSubmit={(event) => {
            event.preventDefault();
            const current = drafts[activeLocale];
            const nextSlug = resolvedSlug(slug, slugTouched, current.title);
            if (!current.title.trim() || !current.description.trim()) {
              setError(copy.titleRequired);
              return;
            }

            startTransition(async () => {
              setError(null);
              const payload = {
                editingLocale: activeLocale,
                title: current.title,
                slug: nextSlug,
                summary: current.summary || undefined,
                description: current.description,
                location: current.location || undefined,
                status,
                employmentType,
                salaryAmount: salaryAmount === "" ? null : salaryAmount,
                salaryCurrency,
                sortOrder,
                publishedAt: publishedAt || null,
              };
              const mediaForm = new FormData();
              if (imageFile) {
                mediaForm.set("image", imageFile);
              }
              if (removeExistingImage) {
                mediaForm.set("removeImage", "1");
              }

              const result =
                isEdit && posting
                  ? await updateJobPostingAction(
                      locale,
                      posting.id,
                      payload,
                      mediaForm,
                    )
                  : await createJobPostingAction(locale, payload, mediaForm);

              if (!result.ok) {
                setError(result.error.message);
                return;
              }

              onClose();
              router.refresh();
            });
          }}
        >
          <JobPostingDrawerFields
            activeLocale={activeLocale}
            onLocaleChange={setActiveLocale}
            draft={draft}
            onDraftChange={updateDraft}
            slug={slug}
            slugTouched={slugTouched}
            onSlugChange={handleSlugChange}
            status={status}
            onStatusChange={setStatus}
            employmentType={employmentType}
            onEmploymentTypeChange={setEmploymentType}
            salaryAmount={salaryAmount}
            onSalaryAmountChange={setSalaryAmount}
            salaryCurrency={salaryCurrency}
            onSalaryCurrencyChange={setSalaryCurrency}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            publishedAt={publishedAt}
            onPublishedAtChange={setPublishedAt}
            imagePreview={imagePreview}
            fileInputRef={fileInputRef}
            onPickImage={() => fileInputRef.current?.click()}
            onImageSelected={handleImageSelected}
            onRemoveImage={handleRemoveImage}
            error={error}
            disabled={isPending}
          />

      </form>
    </SideSheet>
  );
}
