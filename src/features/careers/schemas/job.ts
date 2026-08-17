import { z } from "zod";

import {
  JOB_EMPLOYMENT_TYPES,
  JOB_POSTING_STATUSES,
} from "@/features/careers/domain/job-rules";
import { locales } from "@/lib/i18n/config";
import { currencies } from "@/lib/money/currency";

function emptyToNull(value: unknown): unknown {
  if (value === "" || value === undefined) {
    return null;
  }
  return value;
}

export const upsertJobPostingSchema = z.object({
  editingLocale: z.enum(locales).default("en"),
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(500).optional(),
  description: z.string().trim().min(1).max(100_000),
  location: z.string().trim().max(200).optional(),
  status: z.enum(JOB_POSTING_STATUSES).default("DRAFT"),
  employmentType: z.enum(JOB_EMPLOYMENT_TYPES).default("FULL_TIME"),
  /**
   * Optional salary. Zod 4 treats a bare union-with-undefined as required at the
   * object key level, so missing keys must use preprocess + nullable.
   */
  salaryAmount: z.preprocess(
    emptyToNull,
    z.coerce.number().int().nonnegative().nullable(),
  ),
  salaryCurrency: z.enum(currencies).default("AMD"),
  sortOrder: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => {
      if (value == null || value === "") {
        return 0;
      }
      const parsed = typeof value === "number" ? value : Number(value);
      return Number.isInteger(parsed) ? parsed : Number.NaN;
    })
    .refine((value) => Number.isInteger(value), {
      message: "Sort order must be an integer.",
    }),
  publishedAt: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => {
      if (!value) return null;
      return value;
    }),
});

export type UpsertJobPostingFormInput = z.input<typeof upsertJobPostingSchema>;
export type UpsertJobPostingInput = z.output<typeof upsertJobPostingSchema>;

export const jobPostingIdSchema = z.object({
  postingId: z.string().uuid(),
});

export type JobPostingIdInput = z.infer<typeof jobPostingIdSchema>;
