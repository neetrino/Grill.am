import { describe, expect, it } from "vitest";

import {
  canonicalizeModifiers,
  computeModifiersDelta,
  defaultModifiers,
  hasRequiredModifiersSelected,
  productRequiresConfiguration,
  selectionKeyFromModifiers,
  unitAmountWithModifiers,
  validateModifiers,
  type ProductCustomization,
} from "@/features/products/domain/customization";

const GROUP_ID = "11111111-1111-4111-8111-111111111111";
const CHOICE_A = "22222222-2222-4222-8222-222222222222";
const CHOICE_B = "33333333-3333-4333-8333-333333333333";
const ADDON_ID = "44444444-4444-4444-8444-444444444444";
const EXCLUSION_ID = "55555555-5555-4555-8555-555555555555";

const sample: ProductCustomization = {
  optionGroups: [
    {
      id: GROUP_ID,
      kind: "SIZE",
      required: true,
      label: { hy: "Չափ", en: "Size" },
      choices: [
        {
          id: CHOICE_A,
          label: { hy: "Փոքր", en: "Small" },
          priceDeltaAmount: 0,
          isDefault: true,
        },
        {
          id: CHOICE_B,
          label: { hy: "Մեծ", en: "Large" },
          priceDeltaAmount: 500,
        },
      ],
    },
  ],
  addons: [
    {
      id: ADDON_ID,
      label: { hy: "Պանիր", en: "Cheese" },
      priceAmount: 200,
    },
  ],
  exclusions: [
    {
      id: EXCLUSION_ID,
      label: { hy: "Սոխ", en: "Onion" },
    },
  ],
};

describe("product customization domain", () => {
  it("flags products with option groups, addons, or exclusions for PDP", () => {
    expect(productRequiresConfiguration(sample)).toBe(true);
    expect(productRequiresConfiguration(null)).toBe(false);
    expect(
      productRequiresConfiguration({
        optionGroups: [],
        addons: sample.addons,
        exclusions: [],
      }),
    ).toBe(true);
    expect(
      productRequiresConfiguration({
        optionGroups: [],
        addons: [],
        exclusions: [],
      }),
    ).toBe(false);
  });

  it("blocks add-to-cart until option groups are selected", () => {
    expect(
      hasRequiredModifiersSelected(sample, {
        optionChoices: {},
        addonIds: [],
        exclusionIds: [],
      }),
    ).toBe(false);
    expect(
      hasRequiredModifiersSelected(sample, {
        optionChoices: { [GROUP_ID]: CHOICE_A },
        addonIds: [],
        exclusionIds: [],
      }),
    ).toBe(true);
    expect(
      hasRequiredModifiersSelected(
        {
          ...sample,
          optionGroups: sample.optionGroups.map((group) => ({
            ...group,
            required: false,
          })),
        },
        {
          optionChoices: {},
          addonIds: [],
          exclusionIds: [],
        },
      ),
    ).toBe(false);
  });

  it("defaults required option to the marked default choice", () => {
    expect(defaultModifiers(sample)).toEqual({
      optionChoices: { [GROUP_ID]: CHOICE_A },
      addonIds: [],
      exclusionIds: [],
    });
  });

  it("computes option + addon deltas", () => {
    const modifiers = {
      optionChoices: { [GROUP_ID]: CHOICE_B },
      addonIds: [ADDON_ID],
      exclusionIds: [EXCLUSION_ID],
    };
    expect(computeModifiersDelta(sample, modifiers)).toBe(700);
    expect(unitAmountWithModifiers(1000, sample, modifiers)).toBe(1700);
  });

  it("rejects unknown addons", () => {
    const result = validateModifiers(sample, {
      optionChoices: { [GROUP_ID]: CHOICE_A },
      addonIds: ["66666666-6666-4666-8666-666666666666"],
      exclusionIds: [],
    });
    expect(result.ok).toBe(false);
  });

  it("builds a stable selection key", () => {
    const a = selectionKeyFromModifiers(
      canonicalizeModifiers({
        optionChoices: { [GROUP_ID]: CHOICE_B },
        addonIds: [ADDON_ID],
        exclusionIds: [],
      }),
    );
    const b = selectionKeyFromModifiers({
      optionChoices: { [GROUP_ID]: CHOICE_B },
      addonIds: [ADDON_ID],
      exclusionIds: [],
    });
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(0);
  });
});
