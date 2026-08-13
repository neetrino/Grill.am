import { z } from "zod";

import {
  COD_CASH_DENOMINATIONS,
  isCodCashDenomination,
} from "@/features/checkout/domain/cod-cash-change";
import { CUSTOMER_NOTE_MAX_LENGTH } from "@/features/checkout/domain/customer-note";
import { CHECKOUT_PAYMENT_METHODS } from "@/features/checkout/domain/payment-methods";
import { getStoreById } from "@/features/stores/yandex-map-embed";

export const checkoutSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    contactEmail: z.string().trim().email().max(254),
    contactPhone: z.string().trim().min(5).max(40),
    shippingMethod: z.enum(["pickup", "delivery"]),
    paymentMethod: z.enum(CHECKOUT_PAYMENT_METHODS),
    /** COD only: banknote the customer will tender for change. */
    cashTenderedAmount: z
      .number()
      .int()
      .refine(isCodCashDenomination, {
        message: `Must be one of: ${COD_CASH_DENOMINATIONS.join(", ")}`,
      })
      .optional(),
    deliveryRuleId: z.string().uuid().optional(),
    pickupStoreId: z.string().trim().max(80).optional(),
    city: z.string().trim().max(80).optional(),
    line1: z.string().trim().max(160).optional(),
    line2: z.string().trim().max(160).optional(),
    region: z.string().trim().max(80).optional(),
    postalCode: z.string().trim().max(32).optional(),
    /** Optional customer note for kitchen/courier (plain text). */
    customerNote: z.string().max(CUSTOMER_NOTE_MAX_LENGTH).optional(),
    idempotencyKey: z.string().trim().min(8).max(128),
    locale: z.enum(["hy", "en", "ru"]),
    couponCode: z.string().trim().max(64).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.shippingMethod === "delivery") {
      if (!value.deliveryRuleId) {
        ctx.addIssue({
          code: "custom",
          path: ["deliveryRuleId"],
          message: "Delivery location is required.",
        });
      }
      if (!value.line1?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["line1"],
          message: "Address is required for delivery.",
        });
      }
    }

    if (value.shippingMethod === "pickup" && !getStoreById(value.pickupStoreId)) {
      ctx.addIssue({
        code: "custom",
        path: ["pickupStoreId"],
        message: "Pickup branch is required.",
      });
    }

    if (
      value.paymentMethod !== "cash_on_delivery" &&
      value.cashTenderedAmount != null
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["cashTenderedAmount"],
        message: "Cash tender amount applies only to cash on delivery.",
      });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
