/**
 * Loyalty bonus math (AMD integer minor units).
 * Merchandise net = max(0, subtotal − coupon discount); delivery never earns or
 * counts toward the redeem cap percentage base.
 */

/** Merchandise amount after coupon, never negative. */
export function merchandiseNetAmount(
  subtotalAmount: number,
  discountAmount: number,
): number {
  return Math.max(0, subtotalAmount - discountAmount);
}

/** Bonus credit from a purchase at the admin earn rate. */
export function computeBonusEarnAmount(
  merchandiseNet: number,
  earnPercent: number,
): number {
  if (
    !Number.isInteger(merchandiseNet) ||
    merchandiseNet <= 0 ||
    !Number.isInteger(earnPercent) ||
    earnPercent <= 0
  ) {
    return 0;
  }
  return Math.floor((merchandiseNet * earnPercent) / 100);
}

export type ProductBonusRuleWindow = {
  amount: number;
  startsAt: Date | null;
  endsAt: Date | null;
};

/** Whether a product bonus rule applies at `now`. Null bounds are open-ended. */
export function isProductBonusRuleActive(
  rule: Pick<ProductBonusRuleWindow, "startsAt" | "endsAt">,
  now: Date,
): boolean {
  if (rule.startsAt != null && now.getTime() < rule.startsAt.getTime()) {
    return false;
  }
  if (rule.endsAt != null && now.getTime() > rule.endsAt.getTime()) {
    return false;
  }
  return true;
}

/**
 * Flat per-product bonus earn (AMD), independent of earn %.
 * Each line contributes `amount × quantity` when its rule is active.
 */
export function computeProductBonusEarnAmount(
  lines: ReadonlyArray<{ productId: string; quantity: number }>,
  rulesByProductId: ReadonlyMap<string, ProductBonusRuleWindow>,
  now: Date = new Date(),
): number {
  let total = 0;
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      continue;
    }
    const rule = rulesByProductId.get(line.productId);
    if (!rule || !Number.isInteger(rule.amount) || rule.amount <= 0) {
      continue;
    }
    if (!isProductBonusRuleActive(rule, now)) {
      continue;
    }
    total += rule.amount * line.quantity;
  }
  return total;
}

/**
 * Precedence: product amount > best (max) category amount.
 * Returns null when nothing applies.
 */
export function pickFlatBonusAmount(input: {
  productAmount?: number | null;
  categoryAmounts?: ReadonlyArray<number | null | undefined>;
}): number | null {
  const product = input.productAmount;
  if (product != null && Number.isInteger(product) && product > 0) {
    return product;
  }

  return (input.categoryAmounts ?? [])
    .filter(
      (value): value is number =>
        value != null && Number.isInteger(value) && value > 0,
    )
    .reduce<number | null>(
      (best, value) => (best == null || value > best ? value : best),
      null,
    );
}

/**
 * Earn from effective flat amounts (already resolved per product).
 * `amountByProductId` values are AMD per unit.
 */
export function computeFlatBonusEarnAmount(
  lines: ReadonlyArray<{ productId: string; quantity: number }>,
  amountByProductId: ReadonlyMap<string, number>,
): number {
  let total = 0;
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      continue;
    }
    const amount = amountByProductId.get(line.productId);
    if (amount == null || !Number.isInteger(amount) || amount <= 0) {
      continue;
    }
    total += amount * line.quantity;
  }
  return total;
}

/**
 * Max bonus a customer may apply on checkout.
 * Capped by wallet balance and payable total (goods + delivery) only —
 * no percent-of-merchandise limit and no minimum order to spend.
 */
export function computeMaxBonusRedeemAmount(input: {
  merchandiseNet: number;
  deliveryAmount: number;
  balanceAmount: number;
}): number {
  const { merchandiseNet, deliveryAmount, balanceAmount } = input;

  if (
    !Number.isInteger(merchandiseNet) ||
    merchandiseNet < 0 ||
    !Number.isInteger(deliveryAmount) ||
    deliveryAmount < 0 ||
    !Number.isInteger(balanceAmount) ||
    balanceAmount <= 0
  ) {
    return 0;
  }

  const payableCap = merchandiseNet + deliveryAmount;
  return Math.max(0, Math.min(balanceAmount, payableCap));
}

/**
 * Zeroes planned earn when merchandise net is below the admin earn floor.
 * `earnMinOrderAmount` null/≤0 means always eligible.
 */
export function applyEarnMinOrderGate(
  earnAmount: number,
  merchandiseNet: number,
  earnMinOrderAmount: number | null | undefined,
): number {
  if (
    !Number.isInteger(earnAmount) ||
    earnAmount <= 0 ||
    !Number.isInteger(merchandiseNet) ||
    merchandiseNet < 0
  ) {
    return 0;
  }
  if (
    earnMinOrderAmount != null &&
    Number.isInteger(earnMinOrderAmount) &&
    earnMinOrderAmount > 0 &&
    merchandiseNet < earnMinOrderAmount
  ) {
    return 0;
  }
  return earnAmount;
}

/**
 * Per-unit storefront preview: percent earn on AMD price + active flat bonus.
 */
export function computeProductCardBonusEarnAmount(input: {
  priceAmount: number;
  earnPercent: number;
  flatBonusAmount?: number | null;
}): number {
  const percentEarn = computeBonusEarnAmount(
    input.priceAmount,
    input.earnPercent,
  );
  const flat =
    input.flatBonusAmount != null &&
    Number.isInteger(input.flatBonusAmount) &&
    input.flatBonusAmount > 0
      ? input.flatBonusAmount
      : 0;
  return percentEarn + flat;
}

/** Clamp a requested redeem amount to the allowed max. */
export function clampBonusSpendAmount(
  requestedAmount: number | undefined,
  maxAllowed: number,
): number {
  if (
    requestedAmount == null ||
    !Number.isInteger(requestedAmount) ||
    requestedAmount <= 0 ||
    maxAllowed <= 0
  ) {
    return 0;
  }
  return Math.min(requestedAmount, maxAllowed);
}

/** Order total after coupon, bonus spend, and delivery. */
export function computeOrderTotalWithBonus(input: {
  merchandiseNet: number;
  deliveryAmount: number;
  bonusSpentAmount: number;
}): number {
  return Math.max(
    0,
    input.merchandiseNet - input.bonusSpentAmount + input.deliveryAmount,
  );
}
