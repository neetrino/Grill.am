import { describe, expect, it } from "vitest";

import { buildIdramFormFields } from "@/lib/payments/idram/form";
import {
  idramConfirmationSchema,
  idramFormFieldsSchema,
  idramPrecheckSchema,
} from "@/lib/payments/idram/schemas";
import { IDRAM_OFFICIAL_PAYMENT_URL } from "@/lib/payments/idram/types";

describe("iDram protocol schemas / form", () => {
  it("builds official GetPayment fields without secret", () => {
    const fields = buildIdramFormFields({
      language: "EN",
      recAccount: "100000114",
      description: "Order p123",
      amountAmd: 1900,
      billNo: "i1-abc",
      email: "buyer@example.com",
      orderNumber: "p123",
      locale: "en",
    });
    expect(fields).toMatchObject({
      EDP_LANGUAGE: "EN",
      EDP_REC_ACCOUNT: "100000114",
      EDP_AMOUNT: "1900",
      EDP_BILL_NO: "i1-abc",
      EDP_EMAIL: "buyer@example.com",
      gm_order: "p123",
      gm_locale: "en",
    });
    expect(JSON.stringify(fields)).not.toMatch(/SECRET|secret/i);
    expect(idramFormFieldsSchema.safeParse(fields).success).toBe(true);
  });

  it("documents official payment URL", () => {
    expect(IDRAM_OFFICIAL_PAYMENT_URL).toBe(
      "https://banking.idram.am/Payment/GetPayment",
    );
  });

  it("accepts official precheck shape", () => {
    const parsed = idramPrecheckSchema.safeParse({
      EDP_PRECHECK: "YES",
      EDP_BILL_NO: "1806",
      EDP_REC_ACCOUNT: "100000114",
      EDP_AMOUNT: "1900",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects wrong precheck flag", () => {
    expect(
      idramPrecheckSchema.safeParse({
        EDP_PRECHECK: "NO",
        EDP_BILL_NO: "1806",
        EDP_REC_ACCOUNT: "100000114",
        EDP_AMOUNT: "1900",
      }).success,
    ).toBe(false);
  });

  it("accepts confirmation with char(14) trans id and dd/mm/yyyy date", () => {
    const parsed = idramConfirmationSchema.safeParse({
      EDP_BILL_NO: "1806",
      EDP_REC_ACCOUNT: "100000114",
      EDP_PAYER_ACCOUNT: "100000001",
      EDP_AMOUNT: "1900.00",
      EDP_TRANS_ID: "12345678901234",
      EDP_TRANS_DATE: "06/08/2026",
      EDP_CHECKSUM: "a".repeat(32),
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid confirmation date / checksum / trans id", () => {
    const base = {
      EDP_BILL_NO: "1806",
      EDP_REC_ACCOUNT: "100000114",
      EDP_PAYER_ACCOUNT: "100000001",
      EDP_AMOUNT: "1900",
      EDP_TRANS_ID: "12345678901234",
      EDP_TRANS_DATE: "06/08/2026",
      EDP_CHECKSUM: "a".repeat(32),
    };
    expect(
      idramConfirmationSchema.safeParse({
        ...base,
        EDP_TRANS_DATE: "2026-08-06",
      }).success,
    ).toBe(false);
    expect(
      idramConfirmationSchema.safeParse({
        ...base,
        EDP_TRANS_ID: "too-long-trans-id-xx",
      }).success,
    ).toBe(false);
    expect(
      idramConfirmationSchema.safeParse({
        ...base,
        EDP_CHECKSUM: "zz",
      }).success,
    ).toBe(false);
  });
});
