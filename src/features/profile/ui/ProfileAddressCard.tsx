"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { CustomerAddressListItem } from "@/features/profile/application/address-queries";
import {
  PROFILE_BTN_SECONDARY_CLASS,
  PROFILE_CARD_CLASS,
} from "@/features/profile/ui/profile-ui";

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
  return (
    <div
      className={`relative flex h-full flex-col p-4 pr-16 sm:p-5 sm:pr-16 lg:p-6 lg:pr-16 ${PROFILE_CARD_CLASS}`}
    >
      <div className="absolute top-3 right-3 flex items-center gap-1 sm:top-4 sm:right-4">
        <button
          type="button"
          onClick={() => onEdit(address)}
          disabled={disabled}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-[#fff4d6] hover:text-brand-yellow disabled:opacity-50"
          aria-label={labels.edit}
          title={labels.edit}
        >
          <Pencil className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onDelete(address.id)}
          disabled={disabled}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          aria-label={labels.delete}
          title={labels.delete}
        >
          <Trash2 className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        {address.isDefaultShipping ? (
          <span className="inline-flex rounded-full bg-[#e8f4fd] px-3 py-1 text-xs font-medium text-[#5281e1]">
            {labels.defaultBadge}
          </span>
        ) : null}
        <p className="text-sm leading-snug font-medium break-words text-gray-900 sm:text-base">
          {address.line1}
        </p>
        <p className="text-sm leading-snug break-words text-gray-700 sm:text-base">
          {address.city}
        </p>
        {address.phone ? (
          <p className="text-sm leading-snug break-words text-gray-600 sm:text-base">
            {address.phone}
          </p>
        ) : null}
      </div>

      {!address.isDefaultShipping ? (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            className={`${PROFILE_BTN_SECONDARY_CLASS} w-full sm:w-auto`}
            onClick={() => onSetDefault(address.id)}
            disabled={disabled}
          >
            {labels.setDefault}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
