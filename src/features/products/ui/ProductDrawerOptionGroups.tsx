"use client";

import { Plus, X } from "lucide-react";

import {
  ADMIN_INPUT,
  ADMIN_LABEL,
} from "@/features/admin/ui/admin-form-classes";
import type { ProductCustomization } from "@/features/products/domain/customization";
import { createId } from "@/lib/id";

type OptionGroupCopy = {
  variantsTitle: string;
  addGroup: string;
  removeGroup: string;
  groupLabelPlaceholder: string;
  choiceLabelPlaceholder: string;
  removeChoice: string;
  addChoice: string;
  defaultGroupLabel: string;
  defaultChoiceLabel: string;
  pricePlaceholder: string;
};

type ProductDrawerOptionGroupsProps = {
  optionGroups: ProductCustomization["optionGroups"];
  disabled: boolean;
  copy: OptionGroupCopy;
  onChange: (optionGroups: ProductCustomization["optionGroups"]) => void;
};

function localeTriple(label: string): { hy: string; en: string; ru: string } {
  const trimmed = label.trim();
  return { hy: trimmed, en: trimmed, ru: trimmed };
}

function displayLabel(label: { hy?: string; en?: string; ru?: string }): string {
  return label.hy ?? label.en ?? label.ru ?? "";
}

export function ProductDrawerOptionGroups({
  optionGroups,
  disabled,
  copy,
  onChange,
}: ProductDrawerOptionGroupsProps) {
  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <span className={ADMIN_LABEL}>{copy.variantsTitle}</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const choiceId = createId();
            onChange([
              ...optionGroups,
              {
                id: createId(),
                kind: "SIZE",
                required: true,
                label: localeTriple(copy.defaultGroupLabel),
                choices: [
                  {
                    id: choiceId,
                    label: localeTriple(copy.defaultChoiceLabel),
                    priceDeltaAmount: 0,
                    isDefault: true,
                  },
                ],
              },
            ]);
          }}
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {copy.addGroup}
        </button>
      </div>

      {optionGroups.map((group) => (
        <div
          key={group.id}
          className="space-y-2 rounded-md border border-gray-100 bg-gray-50 p-3"
        >
          <div className="flex items-center gap-2">
            <input
              value={displayLabel(group.label)}
              onChange={(event) =>
                onChange(
                  optionGroups.map((item) =>
                    item.id === group.id
                      ? { ...item, label: localeTriple(event.target.value) }
                      : item,
                  ),
                )
              }
              placeholder={copy.groupLabelPlaceholder}
              className={ADMIN_INPUT}
              disabled={disabled}
            />
            <button
              type="button"
              disabled={disabled}
              aria-label={copy.removeGroup}
              onClick={() =>
                onChange(optionGroups.filter((item) => item.id !== group.id))
              }
              className="rounded p-2 text-red-500 hover:bg-white hover:text-red-700"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {group.choices.map((choice) => (
            <div key={choice.id} className="flex items-center gap-2">
              <input
                value={displayLabel(choice.label)}
                onChange={(event) =>
                  onChange(
                    optionGroups.map((item) =>
                      item.id === group.id
                        ? {
                            ...item,
                            choices: item.choices.map((entry) =>
                              entry.id === choice.id
                                ? {
                                    ...entry,
                                    label: localeTriple(event.target.value),
                                  }
                                : entry,
                            ),
                          }
                        : item,
                    ),
                  )
                }
                placeholder={copy.choiceLabelPlaceholder}
                className={ADMIN_INPUT}
                disabled={disabled}
              />
              <input
                type="number"
                min={0}
                step={1}
                value={choice.priceDeltaAmount}
                onChange={(event) =>
                  onChange(
                    optionGroups.map((item) =>
                      item.id === group.id
                        ? {
                            ...item,
                            choices: item.choices.map((entry) =>
                              entry.id === choice.id
                                ? {
                                    ...entry,
                                    priceDeltaAmount: Math.max(
                                      0,
                                      Math.floor(
                                        Number(event.target.value) || 0,
                                      ),
                                    ),
                                  }
                                : entry,
                            ),
                          }
                        : item,
                    ),
                  )
                }
                placeholder={copy.pricePlaceholder}
                className={`${ADMIN_INPUT} w-28`}
                disabled={disabled}
              />
              <button
                type="button"
                disabled={disabled || group.choices.length <= 1}
                aria-label={copy.removeChoice}
                onClick={() =>
                  onChange(
                    optionGroups.map((item) =>
                      item.id === group.id
                        ? {
                            ...item,
                            choices: item.choices.filter(
                              (entry) => entry.id !== choice.id,
                            ),
                          }
                        : item,
                    ),
                  )
                }
                className="rounded p-2 text-red-500 hover:bg-white hover:text-red-700 disabled:opacity-40"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}

          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              onChange(
                optionGroups.map((item) =>
                  item.id === group.id
                    ? {
                        ...item,
                        choices: [
                          ...item.choices,
                          {
                            id: createId(),
                            label: localeTriple(copy.defaultChoiceLabel),
                            priceDeltaAmount: 0,
                          },
                        ],
                      }
                    : item,
                ),
              )
            }
            className="text-xs font-medium text-gray-700 hover:text-gray-900"
          >
            + {copy.addChoice}
          </button>
        </div>
      ))}
    </div>
  );
}
