"use client";

import { Plus, X } from "lucide-react";

import { ADMIN_INPUT } from "@/features/admin/ui/admin-form-classes";

type LocaleLabel = { hy?: string; en?: string; ru?: string };

type AdditionRow = {
  id: string;
  label: LocaleLabel;
  priceAmount: number;
};

type ExclusionRow = {
  id: string;
  label: LocaleLabel;
};

type PanelCopy = {
  additionsTitle: string;
  additionsHint: string;
  emptyAdditions: string;
  additionLabel: string;
  additionPrice: string;
  removeAddition: string;
  newAdditionPlaceholder: string;
  pricePlaceholder: string;
  addButton: string;
  exclusionsTitle: string;
  exclusionsHint: string;
  emptyExclusions: string;
  exclusionLabel: string;
  removeExclusion: string;
  newExclusionPlaceholder: string;
};

type ProductDrawerModifierPanelsProps = {
  addons: AdditionRow[];
  exclusions: ExclusionRow[];
  addonDraft: string;
  addonPriceDraft: string;
  exclusionDraft: string;
  disabled: boolean;
  copy: PanelCopy;
  onAddonDraftChange: (value: string) => void;
  onAddonPriceDraftChange: (value: string) => void;
  onExclusionDraftChange: (value: string) => void;
  onAddAddon: () => void;
  onAddExclusion: () => void;
  onUpdateAddon: (id: string, patch: { label?: string; priceAmount?: number }) => void;
  onRemoveAddon: (id: string) => void;
  onUpdateExclusion: (id: string, label: string) => void;
  onRemoveExclusion: (id: string) => void;
};

function displayLabel(label: LocaleLabel): string {
  return label.hy ?? label.en ?? label.ru ?? "";
}

export function ProductDrawerModifierPanels({
  addons,
  exclusions,
  addonDraft,
  addonPriceDraft,
  exclusionDraft,
  disabled,
  copy,
  onAddonDraftChange,
  onAddonPriceDraftChange,
  onExclusionDraftChange,
  onAddAddon,
  onAddExclusion,
  onUpdateAddon,
  onRemoveAddon,
  onUpdateExclusion,
  onRemoveExclusion,
}: ProductDrawerModifierPanelsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex min-h-[16rem] flex-col overflow-hidden rounded-lg border border-gray-200">
        <div className="border-b border-gray-100 px-3 py-2">
          <p className="text-sm font-semibold text-gray-900">
            {copy.additionsTitle}
          </p>
          <p className="text-xs text-gray-500">{copy.additionsHint}</p>
        </div>

        <ul className="max-h-56 flex-1 space-y-1 overflow-y-auto px-2 py-2">
          {addons.length === 0 ? (
            <li className="px-1 py-2 text-xs text-gray-400">
              {copy.emptyAdditions}
            </li>
          ) : (
            addons.map((addon) => (
              <li
                key={addon.id}
                className="flex items-center gap-2 rounded-md px-1 py-1.5 hover:bg-gray-50"
              >
                <input
                  value={displayLabel(addon.label)}
                  onChange={(event) =>
                    onUpdateAddon(addon.id, { label: event.target.value })
                  }
                  className={`${ADMIN_INPUT} min-w-0 flex-1`}
                  disabled={disabled}
                  aria-label={copy.additionLabel}
                />
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={addon.priceAmount}
                  onChange={(event) =>
                    onUpdateAddon(addon.id, {
                      priceAmount: Math.max(
                        0,
                        Math.floor(Number(event.target.value) || 0),
                      ),
                    })
                  }
                  placeholder={copy.pricePlaceholder}
                  className={`${ADMIN_INPUT} w-24 shrink-0`}
                  disabled={disabled}
                  aria-label={copy.additionPrice}
                />
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={copy.removeAddition}
                  onClick={() => onRemoveAddon(addon.id)}
                  className="rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="mt-auto flex items-center gap-2 border-t border-gray-100 bg-gray-50 p-2">
          <input
            value={addonDraft}
            onChange={(event) => onAddonDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onAddAddon();
              }
            }}
            placeholder={copy.newAdditionPlaceholder}
            className={`${ADMIN_INPUT} min-w-0 flex-1`}
            disabled={disabled}
          />
          <input
            type="number"
            min={0}
            step={1}
            value={addonPriceDraft}
            onChange={(event) => onAddonPriceDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onAddAddon();
              }
            }}
            placeholder={copy.pricePlaceholder}
            className={`${ADMIN_INPUT} w-24 shrink-0`}
            disabled={disabled}
            aria-label={copy.additionPrice}
          />
          <button
            type="button"
            disabled={disabled || !addonDraft.trim()}
            onClick={onAddAddon}
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gray-800 px-2.5 py-2 text-xs font-medium text-white hover:bg-gray-900 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {copy.addButton}
          </button>
        </div>
      </div>

      <div className="flex min-h-[16rem] flex-col overflow-hidden rounded-lg border border-gray-200">
        <div className="border-b border-gray-100 px-3 py-2">
          <p className="text-sm font-semibold text-gray-900">
            {copy.exclusionsTitle}
          </p>
          <p className="text-xs text-gray-500">{copy.exclusionsHint}</p>
        </div>

        <ul className="max-h-56 flex-1 space-y-1 overflow-y-auto px-2 py-2">
          {exclusions.length === 0 ? (
            <li className="px-1 py-2 text-xs text-gray-400">
              {copy.emptyExclusions}
            </li>
          ) : (
            exclusions.map((exclusion) => (
              <li
                key={exclusion.id}
                className="flex items-center gap-2 rounded-md px-1 py-1.5 hover:bg-gray-50"
              >
                <input
                  value={displayLabel(exclusion.label)}
                  onChange={(event) =>
                    onUpdateExclusion(exclusion.id, event.target.value)
                  }
                  className={`${ADMIN_INPUT} min-w-0 flex-1`}
                  disabled={disabled}
                  aria-label={copy.exclusionLabel}
                />
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={copy.removeExclusion}
                  onClick={() => onRemoveExclusion(exclusion.id)}
                  className="rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="mt-auto flex items-center gap-2 border-t border-gray-100 bg-gray-50 p-2">
          <input
            value={exclusionDraft}
            onChange={(event) => onExclusionDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onAddExclusion();
              }
            }}
            placeholder={copy.newExclusionPlaceholder}
            className={`${ADMIN_INPUT} min-w-0 flex-1`}
            disabled={disabled}
          />
          <button
            type="button"
            disabled={disabled || !exclusionDraft.trim()}
            onClick={onAddExclusion}
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gray-800 px-2.5 py-2 text-xs font-medium text-white hover:bg-gray-900 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {copy.addButton}
          </button>
        </div>
      </div>
    </div>
  );
}
