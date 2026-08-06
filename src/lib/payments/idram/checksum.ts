import { createHash, timingSafeEqual } from "node:crypto";

import { IdramChecksumError } from "@/lib/payments/idram/errors";

/**
 * Official Merchant API §4(b):
 * Concatenate with colon:
 * EDP_REC_ACCOUNT:EDP_AMOUNT:SECRET_KEY:EDP_BILL_NO:EDP_PAYER_ACCOUNT:EDP_TRANS_ID:EDP_TRANS_DATE
 * Then MD5 → EDP_CHECKSUM.
 *
 * Never log the canonical source string (contains SECRET_KEY).
 */
export type IdramChecksumFields = {
  edpRecAccount: string;
  edpAmount: string;
  secretKey: string;
  edpBillNo: string;
  edpPayerAccount: string;
  edpTransId: string;
  edpTransDate: string;
};

export function buildIdramChecksumSource(fields: IdramChecksumFields): string {
  return [
    fields.edpRecAccount,
    fields.edpAmount,
    fields.secretKey,
    fields.edpBillNo,
    fields.edpPayerAccount,
    fields.edpTransId,
    fields.edpTransDate,
  ].join(":");
}

/** Computes official MD5 hex digest (Node default lowercase hex). */
export function computeIdramChecksum(fields: IdramChecksumFields): string {
  const source = buildIdramChecksumSource(fields);
  return createHash("md5").update(source, "utf8").digest("hex");
}

/**
 * Timing-safe checksum comparison.
 * Official docs do not fix hex casing — normalize both sides to lowercase hex.
 */
export function verifyIdramChecksum(
  provided: string,
  fields: Omit<IdramChecksumFields, "secretKey"> & { secretKey: string },
): boolean {
  if (typeof provided !== "string" || !/^[0-9a-fA-F]{32}$/.test(provided)) {
    throw new IdramChecksumError("EDP_CHECKSUM format is invalid.");
  }
  const expected = computeIdramChecksum(fields);
  const a = Buffer.from(provided.toLowerCase(), "utf8");
  const b = Buffer.from(expected.toLowerCase(), "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
