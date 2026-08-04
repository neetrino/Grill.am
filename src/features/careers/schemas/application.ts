import { z } from "zod";

import { JOB_APPLICATION_STATUSES } from "@/features/careers/domain/application-rules";

export const submitJobApplicationFieldsSchema = z.object({
  jobPostingId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(1).max(40),
  message: z.string().trim().min(10).max(5000),
  /** Honeypot — must stay empty for humans. */
  companyWebsite: z.string().max(200).optional(),
});

export type SubmitJobApplicationFields = z.infer<
  typeof submitJobApplicationFieldsSchema
>;

export const adminJobApplicationFilterSchema = z.object({
  status: z.enum(JOB_APPLICATION_STATUSES).optional(),
  jobPostingId: z.string().uuid().optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
});

export type AdminJobApplicationFilter = z.infer<
  typeof adminJobApplicationFilterSchema
>;

export const updateJobApplicationStatusSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(JOB_APPLICATION_STATUSES),
});

export type UpdateJobApplicationStatusInput = z.infer<
  typeof updateJobApplicationStatusSchema
>;
