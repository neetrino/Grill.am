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

type LibraryAddon = {
  id: string;
  label: string;
  priceAmount: number;
};

type LibraryExclusion = {
  id: string;
  label: string;
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
  libraryTitle: string;
  attachFromLibrary: string;
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
  libraryAddons: LibraryAddon[];
  libraryExclusions: LibraryExclusion[];
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
  onAttachLibraryAddon: (id: string) => void;
  onAttachLibraryExclusion: (id: string) => void;
  onUpdateAddon: (
    id: string,
    patch: { label?: string; priceAmount?: number },
  ) => void;
  onRemoveAddon: (id: string) => void;
  onUpdateExclusion: (id: string, label: string) => void;
  onRemoveExclusion: (id: string) => void;
};

function displayLabel(label: LocaleLabel): string {
  return label.hy ?? label.en ?? label.ru ?? "";
}

const panelClassName =
  "flex min-h-[16rem] min-w-0 flex-col rounded-lg border border-gray-200 bg-white";

const footerClassName = "mt-auto border-t border-gray-100 bg-gray-50 p-3";

const addButtonClassName =
  "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md bg-gray-800 px-3 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-40";

const libraryChipClassName =
  "inline-flex max-w-full items-center truncate rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-40";

function LibraryPicker({
  title,
  attachLabel,
  items,
  disabled,
  onAttach,
}: {
  title: string;
  attachLabel: string;
  items: Array<{ id: string; label: string; priceLabel?: string }>;
  disabled: boolean;
  onAttach: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="border-b border-gray-100 px-3 py-2">
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onAttach(item.id)}
            className={libraryChipClassName}
            aria-label={`${attachLabel}: ${item.label}`}
            title={item.priceLabel ? `${item.label} · ${item.priceLabel}` : item.label}
          >
            {item.label}
            {item.priceLabel ? (
              <span className="ml-1 text-gray-400">{item.priceLabel}</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProductDrawerModifierPanels({
  addons,
  exclusions,
  libraryAddons,
  libraryExclusions,
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
  onAttachLibraryAddon,
  onAttachLibraryExclusion,
  onUpdateAddon,
  onRemoveAddon,
  onUpdateExclusion,
  onRemoveExclusion,
}: ProductDrawerModifierPanelsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className={panelClassName}>
        <div className="border-b border-gray-100 px-3 py-2.5">
          <p className="text-sm font-semibold text-gray-900">
            {copy.additionsTitle}
          </p>
          <p className="text-xs text-gray-500">{copy.additionsHint}</p>
        </div>

        <LibraryPicker
          title={copy.libraryTitle}
          attachLabel={copy.attachFromLibrary}
          items={libraryAddons.map((item) => ({
            id: item.id,
            label: item.label,
            priceLabel: `${item.priceAmount}`,
          }))}
          disabled={disabled}
          onAttach={onAttachLibraryAddon}
        />

        <ul className="max-h-56 flex-1 space-y-2 overflow-y-auto px-3 py-3">
          {addons.length === 0 ? (
            <li className="py-2 text-xs text-gray-400">{copy.emptyAdditions}</li>
          ) : (
            addons.map((addon) => (
              <li
                key={addon.id}
                className="grid grid-cols-[minmax(0,1fr)_4.5rem_auto] items-center gap-2"
              >
                <input
                  value={displayLabel(addon.label)}
                  onChange={(event) =>
                    onUpdateAddon(addon.id, { label: event.target.value })
                  }
                  className={ADMIN_INPUT}
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
                  className={`${ADMIN_INPUT} px-2 text-center`}
                  disabled={disabled}
                  aria-label={copy.additionPrice}
                />
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={copy.removeAddition}
                  onClick={() => onRemoveAddon(addon.id)}
                  className="rounded p-2 text-red-500 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))
          )}
        </ul>

        <div className={footerClassName}>
          <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_auto] items-center gap-2">
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
              className={ADMIN_INPUT}
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
              className={`${ADMIN_INPUT} px-2 text-center`}
              disabled={disabled}
              aria-label={copy.additionPrice}
            />
            <button
              type="button"
              disabled={disabled || !addonDraft.trim()}
              onClick={onAddAddon}
              className={addButtonClassName}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {copy.addButton}
            </button>
          </div>
        </div>
      </div>

      <div className={panelClassName}>
        <div className="border-b border-gray-100 px-3 py-2.5">
          <p className="text-sm font-semibold text-gray-900">
            {copy.exclusionsTitle}
          </p>
          <p className="text-xs text-gray-500">{copy.exclusionsHint}</p>
        </div>

        <LibraryPicker
          title={copy.libraryTitle}
          attachLabel={copy.attachFromLibrary}
          items={libraryExclusions.map((item) => ({
            id: item.id,
            label: item.label,
          }))}
          disabled={disabled}
          onAttach={onAttachLibraryExclusion}
        />

        <ul className="max-h-56 flex-1 space-y-2 overflow-y-auto px-3 py-3">
          {exclusions.length === 0 ? (
            <li className="py-2 text-xs text-gray-400">
              {copy.emptyExclusions}
            </li>
          ) : (
            exclusions.map((exclusion) => (
              <li
                key={exclusion.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
              >
                <input
                  value={displayLabel(exclusion.label)}
                  onChange={(event) =>
                    onUpdateExclusion(exclusion.id, event.target.value)
                  }
                  className={ADMIN_INPUT}
                  disabled={disabled}
                  aria-label={copy.exclusionLabel}
                />
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={copy.removeExclusion}
                  onClick={() => onRemoveExclusion(exclusion.id)}
                  className="rounded p-2 text-red-500 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))
          )}
        </ul>

        <div className={footerClassName}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
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
              className={ADMIN_INPUT}
              disabled={disabled}
            />
            <button
              type="button"
              disabled={disabled || !exclusionDraft.trim()}
              onClick={onAddExclusion}
              className={addButtonClassName}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {copy.addButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
