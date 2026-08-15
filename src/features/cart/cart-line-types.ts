import type { CartModifiers } from "@/features/products/domain/customization";

export type SetCartLineQuantityInput = {
  productId: string;
  selectionKey: string;
  quantity: number;
  modifiers?: CartModifiers;
};
