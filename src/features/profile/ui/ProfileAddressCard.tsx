"use client";

import { Button } from "@/components/ui/Button";
import type { CustomerAddressListItem } from "@/features/profile/application/address-queries";

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
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {address.isDefaultShipping ? (
              <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                {labels.defaultBadge}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-gray-800 sm:text-base">{address.line1}</p>
          <p className="text-sm text-gray-800 sm:text-base">{address.city}</p>
          {address.phone ? (
            <p className="text-sm text-gray-600 sm:text-base">{address.phone}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4 lg:border-0 lg:pt-0">
          {!address.isDefaultShipping ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-9 flex-1 sm:flex-initial"
              onClick={() => onSetDefault(address.id)}
              disabled={disabled}
            >
              {labels.setDefault}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-9 flex-1 sm:flex-initial"
            onClick={() => onEdit(address)}
            disabled={disabled}
          >
            {labels.edit}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-9 flex-1 text-red-600 hover:border-red-300 hover:text-red-700 sm:flex-initial"
            onClick={() => onDelete(address.id)}
            disabled={disabled}
          >
            {labels.delete}
          </Button>
        </div>
      </div>
    </div>
  );
}
