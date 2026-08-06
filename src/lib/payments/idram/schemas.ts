import { z } from "zod";

const nonEmptyString = z.string().min(1).max(512);

/** Official form fields — Merchant API §2 (+ optional non-EDP_ echo fields). */
export const idramFormFieldsSchema = z.object({
  EDP_LANGUAGE: z.enum(["EN", "AM", "RU"]),
  EDP_REC_ACCOUNT: nonEmptyString,
  EDP_DESCRIPTION: z.string().min(1).max(1024),
  EDP_AMOUNT: z.string().min(1).max(32),
  EDP_BILL_NO: z.string().min(1).max(64),
  EDP_EMAIL: z.string().email().optional(),
  /** Echoed after completion (Merchant API §2 additional merchant fields). */
  gm_order: z.string().min(1).max(64).optional(),
  gm_locale: z.string().min(2).max(5).optional(),
});

export type IdramFormFields = z.infer<typeof idramFormFieldsSchema>;

/** Precheck callback — Merchant API §4(a). */
export const idramPrecheckSchema = z.object({
  EDP_PRECHECK: z.literal("YES"),
  EDP_BILL_NO: z.string().min(1).max(64),
  EDP_REC_ACCOUNT: nonEmptyString,
  EDP_AMOUNT: z.string().min(1).max(32),
});

export type IdramPrecheckPayload = z.infer<typeof idramPrecheckSchema>;

/** Payment confirmation — Merchant API §4(b). */
export const idramConfirmationSchema = z.object({
  EDP_BILL_NO: z.string().min(1).max(64),
  EDP_REC_ACCOUNT: nonEmptyString,
  EDP_PAYER_ACCOUNT: nonEmptyString,
  EDP_AMOUNT: z.string().min(1).max(32),
  EDP_TRANS_ID: z.string().min(1).max(14),
  EDP_TRANS_DATE: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
  EDP_CHECKSUM: z.string().regex(/^[0-9a-fA-F]{32}$/),
});

export type IdramConfirmationPayload = z.infer<typeof idramConfirmationSchema>;

/** Browser success/fail correlation (non-authoritative). */
export const idramBrowserReturnSchema = z.object({
  EDP_BILL_NO: z.string().min(1).max(64).optional(),
  bill: z.string().min(1).max(64).optional(),
  gm_order: z.string().min(1).max(64).optional(),
  gm_locale: z.string().min(2).max(5).optional(),
  locale: z.string().min(2).max(5).optional(),
});

export function firstFormValue(
  form: FormData,
  key: string,
): string | undefined {
  const values = form.getAll(key);
  if (values.length === 0) {
    return undefined;
  }
  if (values.length > 1) {
    throw new Error(`Duplicate form field: ${key}`);
  }
  const value = values[0];
  if (typeof value !== "string") {
    throw new Error(`Invalid form field type: ${key}`);
  }
  return value;
}

export function formDataToRecord(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of new Set([...form.keys()])) {
    const value = firstFormValue(form, key);
    if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}
