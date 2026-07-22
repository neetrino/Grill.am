"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/Button";
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

  const draft = drafts[activeLocale];

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
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? "Edit job position" : "Add job position"}
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-none flex-col bg-white shadow-2xl md:w-1/2"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit position" : "Add position"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            const current = drafts[activeLocale];
            const nextSlug = resolvedSlug(slug, slugTouched, current.title);
            if (!current.title.trim() || !current.description.trim()) {
              setError("Title and description are required.");
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

          <div className="border-t border-gray-200 px-5 py-4">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
