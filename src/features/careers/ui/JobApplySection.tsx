"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { JobApplySheet } from "@/features/careers/ui/JobApplySheet";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type JobApplySectionProps = {
  jobTitle: string;
  applyLabel: string;
  applyHint: string;
  closeLabel: string;
  cancelLabel: string;
  copy: Dictionary["careers"]["applyForm"];
};

/** Storefront apply CTA: opens application sheet (frontend-only until backend lands). */
export function JobApplySection({
  jobTitle,
  applyLabel,
  applyHint,
  closeLabel,
  cancelLabel,
  copy,
}: JobApplySectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-4 rounded-[20px] bg-brand-yellow py-5 pr-5 pl-7 shadow-[0_8px_28px_rgba(0,0,0,0.08)] sm:flex-row sm:items-center sm:justify-between sm:py-6 sm:pr-6 sm:pl-8">
        <p className="text-base leading-relaxed font-bold text-black sm:text-lg">
          {applyHint}
        </p>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 self-end rounded-full bg-brand-red px-7 text-sm font-semibold text-white transition hover:bg-brand-red-hot focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red sm:self-auto"
        >
          {applyLabel}
          <ChevronRight className="size-4" strokeWidth={2.5} aria-hidden />
        </button>
      </div>

      <JobApplySheet
        open={open}
        onClose={() => setOpen(false)}
        jobTitle={jobTitle}
        closeLabel={closeLabel}
        cancelLabel={cancelLabel}
        copy={copy}
      />
    </>
  );
}
