import { z } from "zod";

export const addressFormSchema = z.object({
  line1: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(5).max(40),
  isDefault: z.boolean().default(false),
});

export type AddressFormInput = z.infer<typeof addressFormSchema>;

export const addressIdSchema = z.object({
  addressId: z.string().uuid(),
});
