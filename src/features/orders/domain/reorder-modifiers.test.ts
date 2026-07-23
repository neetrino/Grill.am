import { describe, expect, it } from "vitest";

import { cartModifiersFromOrderSnapshot } from "@/features/orders/domain/reorder-modifiers";

const OPTION_GROUP_ID = "11111111-1111-4111-8111-111111111111";
const OPTION_CHOICE_ID = "22222222-2222-4222-8222-222222222222";
const ADDON_ID = "33333333-3333-4333-8333-333333333333";
const EXCLUSION_ID = "44444444-4444-4444-8444-444444444444";

describe("cartModifiersFromOrderSnapshot", () => {
  it("returns empty modifiers when snapshot is missing", () => {
    expect(cartModifiersFromOrderSnapshot(null)).toEqual({
      optionChoices: {},
      addonIds: [],
      exclusionIds: [],
    });
    expect(cartModifiersFromOrderSnapshot(undefined)).toEqual({
      optionChoices: {},
      addonIds: [],
      exclusionIds: [],
    });
  });

  it("maps snapshot fields and drops labels", () => {
    expect(
      cartModifiersFromOrderSnapshot({
        optionChoices: { [OPTION_GROUP_ID]: OPTION_CHOICE_ID },
        addonIds: [ADDON_ID],
        exclusionIds: [EXCLUSION_ID],
        labels: ["Extra cheese", "No onion"],
      }),
    ).toEqual({
      optionChoices: { [OPTION_GROUP_ID]: OPTION_CHOICE_ID },
      addonIds: [ADDON_ID],
      exclusionIds: [EXCLUSION_ID],
    });
  });
});
