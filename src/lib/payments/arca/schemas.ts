import { z } from "zod";

import { ARCA_ORDER_STATUSES } from "@/lib/payments/arca/types";

const errorCodeSchema = z.union([z.number(), z.string()]);

/** Registration response — Merchant Manual §7.1.1. */
export const arcaRegisterResponseSchema = z
  .object({
    orderId: z.string().min(1).max(64).optional(),
    formUrl: z.string().min(1).max(512).optional(),
    errorCode: errorCodeSchema.optional(),
    errorCodeString: z.string().optional(),
    error: z.boolean().optional(),
    errorMessage: z.string().max(512).optional(),
  })
  .passthrough();

export type ArcaRegisterResponse = z.infer<typeof arcaRegisterResponseSchema>;

/** getOrderStatusExtended response — Merchant Manual §7.1.5 (v01+ core fields). */
export const arcaStatusResponseSchema = z
  .object({
    orderNumber: z.string().min(1).max(32).optional(),
    orderStatus: z.union([z.number(), z.string()]).optional(),
    actionCode: z.union([z.number(), z.string()]).optional(),
    actionCodeDescription: z.string().max(512).optional(),
    errorCode: errorCodeSchema.optional(),
    errorMessage: z.string().max(512).optional(),
    amount: z.union([z.number(), z.string()]).optional(),
    currency: z.union([z.number(), z.string()]).optional().nullable(),
    date: z.union([z.number(), z.string()]).optional(),
    orderDescription: z.string().max(512).optional(),
    ip: z.union([z.number(), z.string()]).optional(),
    attributes: z
      .array(
        z
          .object({
            name: z.string().optional(),
            value: z.string().optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

export type ArcaStatusResponse = z.infer<typeof arcaStatusResponseSchema>;

/**
 * Browser return query params.
 * Official manual does not document gateway-appended success flags.
 * We only accept our correlation `pid` plus optional gateway `orderId`/`mdOrder`.
 */
export const arcaReturnQuerySchema = z.object({
  pid: z.string().uuid(),
  orderId: z.string().min(1).max(64).optional(),
  mdOrder: z.string().min(1).max(64).optional(),
  locale: z.string().min(2).max(5).optional(),
});

export type ArcaReturnQuery = z.infer<typeof arcaReturnQuerySchema>;

export function normalizeErrorCode(
  value: number | string | undefined | null,
): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return String(value);
}

export function isArcaSystemOk(
  errorCode: number | string | undefined | null,
): boolean {
  const normalized = normalizeErrorCode(errorCode);
  return normalized === null || normalized === "0";
}

export function parseOrderStatusCode(
  value: number | string | undefined,
): (typeof ARCA_ORDER_STATUSES)[number] | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const asNumber = typeof value === "number" ? value : Number(value);
  if (
    !Number.isInteger(asNumber) ||
    !ARCA_ORDER_STATUSES.includes(
      asNumber as (typeof ARCA_ORDER_STATUSES)[number],
    )
  ) {
    return null;
  }
  return asNumber as (typeof ARCA_ORDER_STATUSES)[number];
}
