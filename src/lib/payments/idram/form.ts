import { formatIdramAmount } from "@/lib/payments/idram/amount";
import {
  idramFormFieldsSchema,
  type IdramFormFields,
} from "@/lib/payments/idram/schemas";
import type { IdramLanguage } from "@/lib/payments/idram/types";

export function mapLocaleToIdramLanguage(locale: string | undefined): IdramLanguage {
  switch (locale) {
    case "hy":
      return "AM";
    case "ru":
      return "RU";
    case "en":
    default:
      return "EN";
  }
}

/**
 * Builds the official GetPayment form fields (Merchant API §2).
 * Never includes SECRET_KEY.
 * Non-EDP_ fields are echoed by iDram to the merchant site after completion (§2).
 */
export function buildIdramFormFields(input: {
  language: IdramLanguage;
  recAccount: string;
  description: string;
  amountAmd: number;
  billNo: string;
  email?: string;
  /** Echoed back on SUCCESS/FAIL (non-EDP_ merchant field). */
  orderNumber?: string;
  locale?: string;
}): IdramFormFields {
  const fields = {
    EDP_LANGUAGE: input.language,
    EDP_REC_ACCOUNT: input.recAccount,
    EDP_DESCRIPTION: input.description.slice(0, 1024),
    EDP_AMOUNT: formatIdramAmount(input.amountAmd),
    EDP_BILL_NO: input.billNo,
    ...(input.email ? { EDP_EMAIL: input.email } : {}),
    ...(input.orderNumber ? { gm_order: input.orderNumber } : {}),
    ...(input.locale ? { gm_locale: input.locale } : {}),
  };
  return idramFormFieldsSchema.parse(fields);
}
