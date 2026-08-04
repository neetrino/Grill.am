"use client";

import type { RefObject } from "react";

import {
  ADMIN_FIELD,
  ADMIN_FORM_STACK,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_TEXTAREA,
} from "@/features/admin/ui/admin-form-classes";
import { AdminSelect } from "@/features/admin/ui/AdminSelect";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { AdminLocaleTabs } from "@/features/admin/ui/AdminLocaleTabs";
import { ADMIN_BTN_DASHED_CLASS } from "@/features/admin/ui/admin-ui";
import {
  normalizeJobSlug,
  type JobEmploymentType,
  type JobPostingStatus,
} from "@/features/careers/domain/job-rules";
import type { Locale } from "@/lib/i18n/config";
import { currencies, type Currency } from "@/lib/money/currency";

export type JobLocaleDraft = {
  title: string;
  summary: string;
  description: string;
  location: string;
};

type JobPostingDrawerFieldsProps = {
  activeLocale: Locale;
  onLocaleChange: (locale: Locale) => void;
  draft: JobLocaleDraft;
  onDraftChange: (patch: Partial<JobLocaleDraft>) => void;
  slug: string;
  slugTouched: boolean;
  onSlugChange: (slug: string) => void;
  status: JobPostingStatus;
  onStatusChange: (status: JobPostingStatus) => void;
  employmentType: JobEmploymentType;
  onEmploymentTypeChange: (type: JobEmploymentType) => void;
  salaryAmount: string;
  onSalaryAmountChange: (value: string) => void;
  salaryCurrency: Currency;
  onSalaryCurrencyChange: (currency: Currency) => void;
  sortOrder: string;
  onSortOrderChange: (value: string) => void;
  publishedAt: string;
  onPublishedAtChange: (value: string) => void;
  imagePreview: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onPickImage: () => void;
  onImageSelected: (file: File | null) => void;
  onRemoveImage: () => void;
  error: string | null;
  disabled: boolean;
};

export function JobPostingDrawerFields({
  activeLocale,
  onLocaleChange,
  draft,
  onDraftChange,
  slug,
  slugTouched,
  onSlugChange,
  status,
  onStatusChange,
  employmentType,
  onEmploymentTypeChange,
  salaryAmount,
  onSalaryAmountChange,
  salaryCurrency,
  onSalaryCurrencyChange,
  sortOrder,
  onSortOrderChange,
  publishedAt,
  onPublishedAtChange,
  imagePreview,
  fileInputRef,
  onPickImage,
  onImageSelected,
  onRemoveImage,
  error,
  disabled,
}: JobPostingDrawerFieldsProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.careers.drawer;
  const statusCopy = dictionary.careers.status;
  const employment = dictionary.careers.employment;
  const common = dictionary.common;

  return (
    <>
      <AdminLocaleTabs
        activeLocale={activeLocale}
        onChange={onLocaleChange}
        disabled={disabled}
      />

      <label className={ADMIN_FIELD}>
        <span className={ADMIN_LABEL}>
          {copy.title} <span className="text-red-600">*</span>
        </span>
        <input
          required
          value={draft.title}
          onChange={(event) => onDraftChange({ title: event.target.value })}
          className={ADMIN_INPUT}
          disabled={disabled}
        />
      </label>

      <label className={ADMIN_FIELD}>
        <span className={ADMIN_LABEL}>{copy.location}</span>
        <input
          value={draft.location}
          onChange={(event) => onDraftChange({ location: event.target.value })}
          className={ADMIN_INPUT}
          disabled={disabled}
          placeholder={copy.locationPlaceholder}
        />
      </label>

      <label className={ADMIN_FIELD}>
        <span className={ADMIN_LABEL}>{copy.summary}</span>
        <input
          value={draft.summary}
          onChange={(event) => onDraftChange({ summary: event.target.value })}
          className={ADMIN_INPUT}
          disabled={disabled}
        />
      </label>

      <label className={ADMIN_FIELD}>
        <span className={ADMIN_LABEL}>
          {copy.description} <span className="text-red-600">*</span>
        </span>
        <textarea
          required
          rows={8}
          value={draft.description}
          onChange={(event) =>
            onDraftChange({ description: event.target.value })
          }
          className={ADMIN_TEXTAREA}
          disabled={disabled}
        />
        <span className="mt-1 block text-xs text-gray-500">
          {copy.descriptionHint}
        </span>
      </label>

      <div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
          {copy.common}
        </p>
        <div className={ADMIN_FORM_STACK}>
          <label className={ADMIN_FIELD}>
            <span className={ADMIN_LABEL}>{copy.slug}</span>
            <input
              value={slugTouched ? slug : normalizeJobSlug(draft.title)}
              onChange={(event) => onSlugChange(event.target.value)}
              className={ADMIN_INPUT}
              disabled={disabled}
            />
            <span className="mt-1 block text-xs text-gray-500">
              {copy.slugHint}
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <AdminSelect
              label={copy.employmentType}
              placeholder={copy.employmentType}
              options={[
                { value: "FULL_TIME", label: employment.fullTime },
                { value: "PART_TIME", label: employment.partTime },
                { value: "CONTRACT", label: employment.contract },
                { value: "INTERNSHIP", label: employment.internship },
              ]}
              value={employmentType}
              disabled={disabled}
              onChange={(value) =>
                onEmploymentTypeChange(value as JobEmploymentType)
              }
            />
            <AdminSelect
              label={copy.status}
              placeholder={copy.status}
              options={[
                { value: "DRAFT", label: statusCopy.draft },
                { value: "ACTIVE", label: statusCopy.active },
                { value: "ARCHIVED", label: statusCopy.archived },
              ]}
              value={status}
              disabled={disabled}
              onChange={(value) => onStatusChange(value as JobPostingStatus)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={ADMIN_FIELD}>
              <span className={ADMIN_LABEL}>{copy.salary}</span>
              <input
                type="number"
                min={0}
                step={1}
                value={salaryAmount}
                onChange={(event) => onSalaryAmountChange(event.target.value)}
                className={ADMIN_INPUT}
                disabled={disabled}
                placeholder={copy.salaryOptional}
              />
            </label>
            <AdminSelect
              label={copy.salaryCurrency}
              placeholder={copy.salaryCurrency}
              options={currencies.map((currency) => ({
                value: currency,
                label: currency,
              }))}
              value={salaryCurrency}
              disabled={disabled}
              onChange={(value) =>
                onSalaryCurrencyChange(value as Currency)
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={ADMIN_FIELD}>
              <span className={ADMIN_LABEL}>{copy.sortOrder}</span>
              <input
                type="number"
                step={1}
                value={sortOrder}
                onChange={(event) => onSortOrderChange(event.target.value)}
                className={ADMIN_INPUT}
                disabled={disabled}
              />
            </label>
            <label className={ADMIN_FIELD}>
              <span className={ADMIN_LABEL}>{copy.publishedDate}</span>
              <input
                type="date"
                value={publishedAt}
                onChange={(event) => onPublishedAtChange(event.target.value)}
                className={ADMIN_INPUT}
                disabled={disabled}
              />
              <span className="mt-1 block text-xs text-gray-500">
                {copy.publishedHint}
              </span>
            </label>
          </div>
        </div>
      </div>

      <div>
        <span className={ADMIN_LABEL}>{copy.coverImage}</span>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={disabled}
            onClick={onPickImage}
            className={ADMIN_BTN_DASHED_CLASS}
          >
            {imagePreview ? copy.changeImage : common.upload}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              event.target.value = "";
              onImageSelected(file);
            }}
          />
          {imagePreview ? (
            <button
              type="button"
              disabled={disabled}
              onClick={onRemoveImage}
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
        <p className="mt-1 text-xs text-gray-500">{copy.imageHint}</p>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </>
  );
}
