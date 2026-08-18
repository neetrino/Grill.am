import type { CustomerAssignedPromoCodesLabels } from "@/features/promotions/ui/CustomerAssignedPromoCodesView";
import type { CustomerPromoCodesLabels } from "@/features/promotions/ui/CustomerPromoCodesView";
import type { ProfileDictionary } from "@/lib/i18n/get-dictionary";

type PromoCopy = ProfileDictionary["promoCodes"];

export function toCustomerPromoCodesLabels(
  copy: PromoCopy,
): CustomerPromoCodesLabels {
  return {
    usedTitle: copy.usedTitle,
    code: copy.code,
    offer: copy.offer,
    saved: copy.saved,
    order: copy.order,
    status: copy.status,
    date: copy.date,
    empty: copy.empty,
    emptyHint: copy.emptyHint,
    pageCount: copy.pageCount,
  };
}

export function toAssignedPromoCodesLabels(
  copy: PromoCopy,
): CustomerAssignedPromoCodesLabels {
  return {
    title: copy.mineTitle,
    description: copy.mineDescription,
    empty: copy.mineEmpty,
    emptyHint: copy.mineEmptyHint,
    copy: copy.copy,
    copied: copy.copied,
    validUntil: copy.validUntil,
    noExpiry: copy.noExpiry,
    minOrder: copy.minOrder,
  };
}
