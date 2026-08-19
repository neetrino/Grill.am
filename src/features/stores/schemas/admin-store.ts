import { z } from "zod";

import { locales } from "@/lib/i18n/config";

/** Drawer create/edit payload — image handled separately from FormData. */
export const upsertStoreSchema = z.object({
  editingLocale: z.enum(locales),
  title: z.string().trim().min(1).max(120),
  address: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(40).optional(),
});

export type UpsertStoreInput = z.infer<typeof upsertStoreSchema>;

export const toggleStoreSchema = z.object({
  storeId: z.string().uuid(),
  isActive: z.boolean(),
});

export type ToggleStoreInput = z.infer<typeof toggleStoreSchema>;

export const deleteStoreSchema = z.object({
  storeId: z.string().uuid(),
});

export type DeleteStoreInput = z.infer<typeof deleteStoreSchema>;
