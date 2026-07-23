import { z } from "zod";

export const togglePopupSchema = z.object({
  popupId: z.string().uuid(),
  isActive: z.boolean(),
});

export type TogglePopupInput = z.infer<typeof togglePopupSchema>;

export const deletePopupSchema = z.object({
  popupId: z.string().uuid(),
});

export type DeletePopupInput = z.infer<typeof deletePopupSchema>;
