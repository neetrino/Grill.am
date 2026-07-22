import { z } from "zod";

import type { Locale } from "@/lib/i18n/config";

const localeLabelSchema = z
  .object({
    hy: z.string().trim().min(1).max(200).optional(),
    en: z.string().trim().min(1).max(200).optional(),
    ru: z.string().trim().min(1).max(200).optional(),
  })
  .refine((value) => Boolean(value.hy || value.en || value.ru), {
    message: "At least one locale label is required.",
  });

const choiceSchema = z.object({
  id: z.string().uuid(),
  label: localeLabelSchema,
  priceDeltaAmount: z.number().int().nonnegative(),
  isDefault: z.boolean().optional(),
});

const optionGroupSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(["SIZE", "TYPE", "PORTION"]),
  required: z.boolean(),
  label: localeLabelSchema,
  choices: z.array(choiceSchema).min(1).max(20),
});

const addonSchema = z.object({
  id: z.string().uuid(),
  label: localeLabelSchema,
  priceAmount: z.number().int().nonnegative(),
});

const exclusionSchema = z.object({
  id: z.string().uuid(),
  label: localeLabelSchema,
});

export const productCustomizationSchema = z.object({
  optionGroups: z.array(optionGroupSchema).max(10).default([]),
  addons: z.array(addonSchema).max(30).default([]),
  exclusions: z.array(exclusionSchema).max(30).default([]),
});

export type ProductCustomization = z.infer<typeof productCustomizationSchema>;

export const cartModifiersSchema = z.object({
  optionChoices: z.record(z.string().uuid(), z.string().uuid()).default({}),
  addonIds: z.array(z.string().uuid()).max(30).default([]),
  exclusionIds: z.array(z.string().uuid()).max(30).default([]),
});

export type CartModifiers = z.infer<typeof cartModifiersSchema>;

export type StorefrontOptionChoice = {
  id: string;
  label: string;
  priceDeltaAmount: number;
  isDefault: boolean;
};

export type StorefrontOptionGroup = {
  id: string;
  kind: "SIZE" | "TYPE" | "PORTION";
  required: boolean;
  label: string;
  choices: StorefrontOptionChoice[];
};

export type StorefrontAddon = {
  id: string;
  label: string;
  priceAmount: number;
};

export type StorefrontExclusion = {
  id: string;
  label: string;
};

export type StorefrontCustomization = {
  optionGroups: StorefrontOptionGroup[];
  addons: StorefrontAddon[];
  exclusions: StorefrontExclusion[];
};

export const EMPTY_CART_MODIFIERS: CartModifiers = {
  optionChoices: {},
  addonIds: [],
  exclusionIds: [],
};

/** Resolves a localized label with hy → en → ru fallback. */
export function resolveLocaleLabel(
  label: Partial<Record<Locale, string>> | undefined,
  locale: Locale,
): string {
  if (!label) return "";
  return label[locale] ?? label.hy ?? label.en ?? label.ru ?? "";
}

export function parseProductCustomization(
  value: unknown,
): ProductCustomization | null {
  if (value == null) return null;
  const parsed = productCustomizationSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseCartModifiers(value: unknown): CartModifiers {
  const parsed = cartModifiersSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : { ...EMPTY_CART_MODIFIERS };
}

export function canonicalizeModifiers(modifiers: CartModifiers): CartModifiers {
  const optionChoices = Object.fromEntries(
    Object.entries(modifiers.optionChoices).sort(([a], [b]) =>
      a.localeCompare(b),
    ),
  );
  return {
    optionChoices,
    addonIds: [...new Set(modifiers.addonIds)].sort(),
    exclusionIds: [...new Set(modifiers.exclusionIds)].sort(),
  };
}

export function isEmptyModifiers(modifiers: CartModifiers): boolean {
  const canonical = canonicalizeModifiers(modifiers);
  return (
    Object.keys(canonical.optionChoices).length === 0 &&
    canonical.addonIds.length === 0 &&
    canonical.exclusionIds.length === 0
  );
}

/** Stable cart-line identity key for identical product + modifier sets. */
export function selectionKeyFromModifiers(modifiers: CartModifiers): string {
  const canonical = canonicalizeModifiers(modifiers);
  if (isEmptyModifiers(canonical)) {
    return "";
  }
  return JSON.stringify(canonical);
}

export type ModifiersValidationResult =
  | { ok: true; modifiers: CartModifiers }
  | { ok: false; error: string };

/** Validates customer selection against the product's customization catalog. */
export function validateModifiers(
  customization: ProductCustomization | null,
  raw: CartModifiers,
): ModifiersValidationResult {
  const modifiers = canonicalizeModifiers(parseCartModifiers(raw));
  const config = customization ?? {
    optionGroups: [],
    addons: [],
    exclusions: [],
  };

  for (const group of config.optionGroups) {
    const choiceId = modifiers.optionChoices[group.id];
    if (group.required && !choiceId) {
      return { ok: false, error: "Required option is missing." };
    }
    if (choiceId && !group.choices.some((choice) => choice.id === choiceId)) {
      return { ok: false, error: "Invalid option choice." };
    }
  }

  for (const groupId of Object.keys(modifiers.optionChoices)) {
    if (!config.optionGroups.some((group) => group.id === groupId)) {
      return { ok: false, error: "Unknown option group." };
    }
  }

  const addonIds = new Set(config.addons.map((addon) => addon.id));
  for (const addonId of modifiers.addonIds) {
    if (!addonIds.has(addonId)) {
      return { ok: false, error: "Invalid addon." };
    }
  }

  const exclusionIds = new Set(
    config.exclusions.map((exclusion) => exclusion.id),
  );
  for (const exclusionId of modifiers.exclusionIds) {
    if (!exclusionIds.has(exclusionId)) {
      return { ok: false, error: "Invalid exclusion." };
    }
  }

  return { ok: true, modifiers };
}

/** Extra AMD minor units from selected options and addons (exclusions are free). */
export function computeModifiersDelta(
  customization: ProductCustomization | null,
  modifiers: CartModifiers,
): number {
  if (!customization) return 0;

  let delta = 0;
  for (const group of customization.optionGroups) {
    const choiceId = modifiers.optionChoices[group.id];
    if (!choiceId) continue;
    const choice = group.choices.find((item) => item.id === choiceId);
    if (choice) {
      delta += choice.priceDeltaAmount;
    }
  }

  for (const addonId of modifiers.addonIds) {
    const addon = customization.addons.find((item) => item.id === addonId);
    if (addon) {
      delta += addon.priceAmount;
    }
  }

  return delta;
}

export function unitAmountWithModifiers(
  baseUnitAmount: number,
  customization: ProductCustomization | null,
  modifiers: CartModifiers,
): number {
  return baseUnitAmount + computeModifiersDelta(customization, modifiers);
}

/** Locale-resolved customization for PDP controls. */
export function toStorefrontCustomization(
  customization: ProductCustomization | null,
  locale: Locale,
): StorefrontCustomization {
  if (!customization) {
    return { optionGroups: [], addons: [], exclusions: [] };
  }

  return {
    optionGroups: customization.optionGroups.map((group) => ({
      id: group.id,
      kind: group.kind,
      required: group.required,
      label: resolveLocaleLabel(group.label, locale),
      choices: group.choices.map((choice) => ({
        id: choice.id,
        label: resolveLocaleLabel(choice.label, locale),
        priceDeltaAmount: choice.priceDeltaAmount,
        isDefault: choice.isDefault === true,
      })),
    })),
    addons: customization.addons.map((addon) => ({
      id: addon.id,
      label: resolveLocaleLabel(addon.label, locale),
      priceAmount: addon.priceAmount,
    })),
    exclusions: customization.exclusions.map((exclusion) => ({
      id: exclusion.id,
      label: resolveLocaleLabel(exclusion.label, locale),
    })),
  };
}

/** Human-readable modifier summary lines for cart/checkout. */
export function describeModifiers(
  customization: ProductCustomization | null,
  modifiers: CartModifiers,
  locale: Locale,
): string[] {
  if (!customization || isEmptyModifiers(modifiers)) {
    return [];
  }

  const lines: string[] = [];

  for (const group of customization.optionGroups) {
    const choiceId = modifiers.optionChoices[group.id];
    if (!choiceId) continue;
    const choice = group.choices.find((item) => item.id === choiceId);
    if (!choice) continue;
    lines.push(
      `${resolveLocaleLabel(group.label, locale)}: ${resolveLocaleLabel(choice.label, locale)}`,
    );
  }

  for (const addonId of modifiers.addonIds) {
    const addon = customization.addons.find((item) => item.id === addonId);
    if (addon) {
      lines.push(resolveLocaleLabel(addon.label, locale));
    }
  }

  for (const exclusionId of modifiers.exclusionIds) {
    const exclusion = customization.exclusions.find(
      (item) => item.id === exclusionId,
    );
    if (exclusion) {
      lines.push(`− ${resolveLocaleLabel(exclusion.label, locale)}`);
    }
  }

  return lines;
}

/** Default selection: required groups pick default/first choice. */
export function defaultModifiers(
  customization: ProductCustomization | null,
): CartModifiers {
  if (!customization) {
    return { ...EMPTY_CART_MODIFIERS };
  }

  const optionChoices: Record<string, string> = {};
  for (const group of customization.optionGroups) {
    if (!group.required) continue;
    const preferred =
      group.choices.find((choice) => choice.isDefault) ?? group.choices[0];
    if (preferred) {
      optionChoices[group.id] = preferred.id;
    }
  }

  return canonicalizeModifiers({
    optionChoices,
    addonIds: [],
    exclusionIds: [],
  });
}
