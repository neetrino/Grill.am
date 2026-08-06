import { describe, expect, it } from "vitest";

import {
  computeIdramChecksum,
  verifyIdramChecksum,
} from "@/lib/payments/idram/checksum";
import { IdramChecksumError } from "@/lib/payments/idram/errors";

/** Fake test secret only — never a real merchant key. */
const TEST_SECRET = "test-idram-secret-key";

const base = {
  edpRecAccount: "100000114",
  edpAmount: "1900",
  secretKey: TEST_SECRET,
  edpBillNo: "1806",
  edpPayerAccount: "100000001",
  edpTransId: "12345678901234",
  edpTransDate: "06/08/2026",
};

describe("iDram checksum", () => {
  it("uses MD5 of colon-separated official field order", () => {
    const digest = computeIdramChecksum(base);
    expect(digest).toMatch(/^[0-9a-f]{32}$/);
    expect(
      verifyIdramChecksum(digest, {
        edpRecAccount: base.edpRecAccount,
        edpAmount: base.edpAmount,
        secretKey: TEST_SECRET,
        edpBillNo: base.edpBillNo,
        edpPayerAccount: base.edpPayerAccount,
        edpTransId: base.edpTransId,
        edpTransDate: base.edpTransDate,
      }),
    ).toBe(true);
  });

  it("accepts uppercase hex via case-normalized comparison", () => {
    const digest = computeIdramChecksum(base).toUpperCase();
    expect(
      verifyIdramChecksum(digest, {
        edpRecAccount: base.edpRecAccount,
        edpAmount: base.edpAmount,
        secretKey: TEST_SECRET,
        edpBillNo: base.edpBillNo,
        edpPayerAccount: base.edpPayerAccount,
        edpTransId: base.edpTransId,
        edpTransDate: base.edpTransDate,
      }),
    ).toBe(true);
  });

  it("rejects wrong amount or secret without leaking source", () => {
    const digest = computeIdramChecksum(base);
    expect(
      verifyIdramChecksum(digest, {
        ...base,
        edpAmount: "1901",
        secretKey: TEST_SECRET,
      }),
    ).toBe(false);
    expect(
      verifyIdramChecksum(digest, {
        ...base,
        secretKey: "other-secret",
      }),
    ).toBe(false);
  });

  it("rejects malformed checksum before comparison", () => {
    expect(() =>
      verifyIdramChecksum("not-hex", {
        ...base,
        secretKey: TEST_SECRET,
      }),
    ).toThrow(IdramChecksumError);
    expect(() =>
      verifyIdramChecksum("abcd", {
        ...base,
        secretKey: TEST_SECRET,
      }),
    ).toThrow(IdramChecksumError);
  });

  it("uses exact received amount string in checksum (no reformat)", () => {
    const withDecimals = { ...base, edpAmount: "1900.00" };
    const digest = computeIdramChecksum(withDecimals);
    expect(
      verifyIdramChecksum(digest, {
        ...withDecimals,
        secretKey: TEST_SECRET,
      }),
    ).toBe(true);
    expect(
      verifyIdramChecksum(digest, {
        ...base,
        edpAmount: "1900",
        secretKey: TEST_SECRET,
      }),
    ).toBe(false);
  });
});
