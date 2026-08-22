"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import {
  CHECKOUT_PICKUP_BRANCH_LIST_CLASS,
  CHECKOUT_PICKUP_BRANCH_ROW_CLASS,
  CHECKOUT_PICKUP_BRANCH_ROW_DEFAULT_CLASS,
  CHECKOUT_PICKUP_BRANCH_ROW_SELECTED_CLASS,
  CHECKOUT_PICKUP_TRIGGER_CLASS,
} from "@/features/checkout/ui/checkout-ui";
import type { StorePickupOption } from "@/features/stores/yandex-map-embed";

type CheckoutPickupBranchListProps = {
  labels: {
    pickupBranch: string;
    selectPickupBranch: string;
  };
  pending: boolean;
  pickupStores: StorePickupOption[];
  pickupStoreId: string;
  onPickupStoreChange: (storeId: string) => void;
};

function pickupBranchRowClass(selected: boolean): string {
  return `${CHECKOUT_PICKUP_BRANCH_ROW_CLASS} ${
    selected
      ? CHECKOUT_PICKUP_BRANCH_ROW_SELECTED_CLASS
      : CHECKOUT_PICKUP_BRANCH_ROW_DEFAULT_CLASS
  }`;
}

export function CheckoutPickupBranchList({
  labels,
  pending,
  pickupStores,
  pickupStoreId,
  onPickupStoreChange,
}: CheckoutPickupBranchListProps) {
  const selectedStore = pickupStores.find((store) => store.id === pickupStoreId);
  const [isOpen, setIsOpen] = useState(selectedStore == null);
  const showList = isOpen || selectedStore == null;

  function selectStore(storeId: string): void {
    onPickupStoreChange(storeId);
    setIsOpen(false);
  }

  return (
    <div className="mt-4">
      <p className="sr-only">{labels.pickupBranch}</p>
      {selectedStore && !showList ? (
        <CollapsedPickupBranch
          branchLabel={labels.pickupBranch}
          store={selectedStore}
          disabled={pending}
          onOpen={() => setIsOpen(true)}
        />
      ) : (
        <ExpandedPickupBranchList
          labels={labels}
          pending={pending}
          pickupStores={pickupStores}
          pickupStoreId={pickupStoreId}
          onSelect={selectStore}
          onCollapse={selectedStore ? () => setIsOpen(false) : undefined}
        />
      )}
    </div>
  );
}

function CollapsedPickupBranch({
  branchLabel,
  store,
  disabled,
  onOpen,
}: {
  branchLabel: string;
  store: StorePickupOption;
  disabled: boolean;
  onOpen: () => void;
}) {
  return (
    <>
      <input
        type="hidden"
        name="pickupStoreId"
        value={store.id}
        required
        suppressHydrationWarning
      />
      <button
        type="button"
        className={CHECKOUT_PICKUP_TRIGGER_CLASS}
        disabled={disabled}
        aria-expanded={false}
        aria-haspopup="listbox"
        aria-label={branchLabel}
        onClick={onOpen}
      >
        <span className="min-w-0 flex-1 truncate text-sm">{store.label}</span>
        <span className="flex shrink-0 items-center gap-1.5">
          <Check className="size-4 text-brand-red" aria-hidden />
          <ChevronDown className="size-4 text-gray-400" aria-hidden />
        </span>
      </button>
    </>
  );
}

function ExpandedPickupBranchList({
  labels,
  pending,
  pickupStores,
  pickupStoreId,
  onSelect,
  onCollapse,
}: {
  labels: { pickupBranch: string; selectPickupBranch: string };
  pending: boolean;
  pickupStores: StorePickupOption[];
  pickupStoreId: string;
  onSelect: (storeId: string) => void;
  onCollapse?: () => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={labels.pickupBranch}
      className={CHECKOUT_PICKUP_BRANCH_LIST_CLASS}
    >
      {pickupStores.length === 0 ? (
        <p className="px-3 py-2.5 text-sm text-gray-500">
          {labels.selectPickupBranch}
        </p>
      ) : (
        pickupStores.map((store) => {
          const selected = pickupStoreId === store.id;
          return (
            <label
              key={store.id}
              className={pickupBranchRowClass(selected)}
              onClick={() => {
                if (selected) {
                  onCollapse?.();
                }
              }}
            >
              <input
                type="radio"
                name="pickupStoreId"
                value={store.id}
                checked={selected}
                onChange={() => onSelect(store.id)}
                className="mr-2.5 shrink-0 accent-brand-red"
                disabled={pending}
                required
                suppressHydrationWarning
              />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-900">
                {store.label}
              </span>
              {selected ? (
                <span className="flex shrink-0 items-center gap-1.5">
                  <Check className="size-4 text-brand-red" aria-hidden />
                  <ChevronDown
                    className="size-4 rotate-180 text-gray-400"
                    aria-hidden
                  />
                </span>
              ) : null}
            </label>
          );
        })
      )}
    </div>
  );
}
