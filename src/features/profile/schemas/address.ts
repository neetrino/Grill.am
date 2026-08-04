import { z } from "zod";

import { isCheckoutDeliveryCity } from "@/features/checkout/domain/checkout-delivery-cities";

export const addressFormSchema = z.object({
  line1: z.string().trim().min(1).max(200),
  city: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .refine(isCheckoutDeliveryCity, { message: "Invalid city." }),
  isDefault: z.boolean().default(false),
});

export type AddressFormInput = z.infer<typeof addressFormSchema>;

export const addressIdSchema = z.object({
  addressId: z.string().uuid(),
});
