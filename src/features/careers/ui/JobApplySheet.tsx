"use client";

import { FileUp, Send, X } from "lucide-react";
import { useId, useRef, useState, useTransition, type FormEvent } from "react";

import { SideSheet } from "@/components/drawer/SideSheet";
import { submitJobApplicationAction } from "@/features/careers/application/submit-application";
import {
  CV_MAX_BYTES,
  isAllowedCvFile,
} from "@/features/careers/domain/application-rules";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

const APPLY_FORM_ID = "job-apply-form";
const CV_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const FIELD_CLASS =
  "h-11 w-full rounded-[15px] border border-gray-200 bg-white px-3 text-gray-900 outline-none transition focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/15 disabled:bg-gray-50 disabled:opacity-60";
const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-gray-700";

type JobApplySheetProps = {
  open: boolean;
  onClose: () => void;
  jobPostingId: string;
  jobTitle: string;
  closeLabel: string;
  cancelLabel: string;
  copy: Dictionary["careers"]["applyForm"];
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Job application side sheet — submits to server action with CV upload. */
export function JobApplySheet({
  open,
  onClose,
  jobPostingId,
  jobTitle,
  closeLabel,
  cancelLabel,
  copy,
}: JobApplySheetProps) {
  const cvInputId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function resetFormState(): void {
    setCvFile(null);
    setError(null);
    setSuccess(false);
    formRef.current?.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleClose(): void {
    resetFormState();
    onClose();
  }

  function handleCvChange(file: File | null): void {
    setError(null);
    if (!file) {
      setCvFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    if (!isAllowedCvFile(file)) {
      setCvFile(null);
      setError(copy.cvInvalidType);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    if (file.size > CV_MAX_BYTES) {
      setCvFile(null);
      setError(copy.cvTooLarge);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    setCvFile(file);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError(null);

    if (!cvFile) {
      setError(copy.cvRequired);
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("jobPostingId", jobPostingId);
    formData.set("cv", cvFile);

    startTransition(async () => {
      const result = await submitJobApplicationAction(formData);
      if (!result.ok) {
        switch (result.error.code) {
          case "CV_REQUIRED":
            setError(copy.cvRequired);
            break;
          case "CV_INVALID_TYPE":
            setError(copy.cvInvalidType);
            break;
          case "CV_TOO_LARGE":
            setError(copy.cvTooLarge);
            break;
          case "RATE_LIMITED":
            setError(copy.rateLimited);
            break;
          case "JOB_NOT_AVAILABLE":
            setError(copy.jobUnavailable);
            break;
          default:
            setError(result.error.message || copy.error);
            break;
        }
        return;
      }
      setSuccess(true);
    });
  }

  return (
    <SideSheet
      open={open}
      onClose={handleClose}
      title={copy.title}
      subtitle={jobTitle}
      closeLabel={closeLabel}
      footer={
        success ? null : (
          <div className="flex items-center gap-4 border-t border-gray-100 px-5 py-4 lg:px-4">
            <button
              type="submit"
              form={APPLY_FORM_ID}
              disabled={isPending}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[15px] bg-brand-red px-4 text-sm font-semibold text-white transition hover:bg-brand-red-hot focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:opacity-60"
            >
              {isPending ? copy.submitting : copy.submit}
              <Send className="size-4 shrink-0" aria-hidden />
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-60"
            >
              {cancelLabel}
            </button>
          </div>
        )
      }
    >
      {success ? (
        <div className="flex flex-col gap-4">
          <p
            role="status"
            className="rounded-[15px] border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            {copy.success}
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-11 w-full items-center justify-center rounded-[15px] bg-brand-red px-4 text-sm font-semibold text-white transition hover:bg-brand-red-hot"
          >
            {closeLabel}
          </button>
        </div>
      ) : (
        <form
          id={APPLY_FORM_ID}
          ref={formRef}
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
          <input type="hidden" name="jobPostingId" value={jobPostingId} />

          <label className="block">
            <span className={LABEL_CLASS}>{copy.name}</span>
            <input
              name="name"
              required
              maxLength={120}
              autoComplete="name"
              disabled={isPending}
              className={FIELD_CLASS}
            />
          </label>

          <label className="block">
            <span className={LABEL_CLASS}>{copy.email}</span>
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              disabled={isPending}
              className={FIELD_CLASS}
            />
          </label>

          <label className="block">
            <span className={LABEL_CLASS}>{copy.phone}</span>
            <input
              name="phone"
              type="tel"
              required
              maxLength={40}
              autoComplete="tel"
              disabled={isPending}
              className={FIELD_CLASS}
            />
          </label>

          <label className="block">
            <span className={LABEL_CLASS}>{copy.message}</span>
            <textarea
              name="message"
              required
              minLength={10}
              maxLength={5000}
              rows={4}
              disabled={isPending}
              className="min-h-[6.5rem] w-full resize-y rounded-[15px] border border-gray-200 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/15 disabled:bg-gray-50 disabled:opacity-60"
            />
          </label>

          {/* Honeypot — leave empty */}
          <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
            <label>
              Company website
              <input
                name="companyWebsite"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </label>
          </div>

          <div className="block">
            <span className={LABEL_CLASS} id={`${cvInputId}-label`}>
              {copy.cv}
            </span>
            <p className="mb-2 text-xs text-gray-500">{copy.cvHint}</p>

            {cvFile ? (
              <div className="flex items-center gap-3 rounded-[15px] border border-gray-200 bg-gray-50 px-3 py-2.5">
                <FileUp className="size-4 shrink-0 text-brand-red" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {cvFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(cvFile.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCvChange(null)}
                  disabled={isPending}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-white hover:text-gray-900 disabled:opacity-60"
                  aria-label={copy.cvRemove}
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            ) : (
              <label
                htmlFor={cvInputId}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[15px] border border-dashed border-gray-300 bg-white px-4 py-6 text-center transition hover:border-brand-red/40 hover:bg-brand-red/[0.02]"
              >
                <FileUp className="size-6 text-brand-red" aria-hidden />
                <span className="text-sm font-medium text-gray-900">
                  {copy.cvChoose}
                </span>
              </label>
            )}

            <input
              ref={fileInputRef}
              id={cvInputId}
              name="cv"
              type="file"
              accept={CV_ACCEPT}
              required
              disabled={isPending}
              className="sr-only"
              aria-labelledby={`${cvInputId}-label`}
              onChange={(event) => {
                handleCvChange(event.target.files?.[0] ?? null);
              }}
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-[15px] border border-red-200 bg-red-50 p-3 text-sm text-red-600"
            >
              {error}
            </p>
          ) : null}
        </form>
      )}
    </SideSheet>
  );
}
