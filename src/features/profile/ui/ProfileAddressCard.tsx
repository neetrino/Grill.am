"use client";

import { Pencil, Star, Trash2 } from "lucide-react";

import type { CustomerAddressListItem } from "@/features/profile/application/address-queries";
import { PROFILE_CARD_CLASS } from "@/features/profile/ui/profile-ui";

type ProfileAddressCardProps = {
  address: CustomerAddressListItem;
  disabled: boolean;
  labels: {
    defaultBadge: string;
    setDefault: string;
    edit: string;
    delete: string;
  };
  onSetDefault: (addressId: string) => void;
  onEdit: (address: CustomerAddressListItem) => void;
  onDelete: (addressId: string) => void;
};

export function ProfileAddressCard({
  address,
  disabled,
  labels,
  onSetDefault,
  onEdit,
  onDelete,
}: ProfileAddressCardProps) {
  const isDefault = address.isDefaultShipping;

  return (
    <div className={`flex h-full flex-col p-3 sm:p-3.5 ${PROFILE_CARD_CLASS}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          {isDefault ? (
            <span className="inline-flex rounded-full bg-[#e8f4fd] px-2 py-0.5 text-[11px] font-medium text-[#5281e1]">
              {labels.defaultBadge}
            </span>
          ) : (
            <p className="truncate text-sm leading-snug font-medium text-gray-900">
              {address.line1}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {!isDefault ? (
            <button
              type="button"
              onClick={() => onSetDefault(address.id)}
              disabled={disabled}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-[#fff4d6] hover:text-brand-yellow disabled:opacity-50"
              aria-label={labels.setDefault}
              title={labels.setDefault}
            >
              <Star className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onEdit(address)}
            disabled={disabled}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-[#fff4d6] hover:text-brand-yellow disabled:opacity-50"
            aria-label={labels.edit}
            title={labels.edit}
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onDelete(address.id)}
            disabled={disabled}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            aria-label={labels.delete}
            title={labels.delete}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-1.5 min-w-0 space-y-1">
        {isDefault ? (
          <p className="text-sm leading-snug font-medium break-words text-gray-900">
            {address.line1}
          </p>
        ) : null}
        <p className="text-xs leading-snug break-words text-gray-700 sm:text-sm">
          {address.city}
        </p>
        {address.phone ? (
          <p className="text-xs leading-snug break-words text-gray-600 sm:text-sm">
            {address.phone}
          </p>
        ) : null}
      </div>
    </div>
  );
}
