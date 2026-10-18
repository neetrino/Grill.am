import { ORDER_STATUSES, type OrderStatus } from "@/features/orders/domain/order-status";
import { DEFAULT_RATES_FROM_AMD } from "@/lib/fx/default-rates";
import {
  normalizeRateDecimalString,
  parseRateToFixed,
} from "@/lib/money/convert";
import {
  currencies,
  defaultCurrency,
  type Currency,
} from "@/lib/money/currency";

export const STORE_SETTING_KEYS = [
  "store.identity",
  "store.branding",
  "store.social",
  "store.maintenance",
  "store.stacking",
  "store.revenue",
  "store.globalDiscount",
  "store.fxRates",
  "store.enabledCurrencies",
  "store.minimumOrder",
  "store.loyalty",
] as const;

export type StoreSettingKey = (typeof STORE_SETTING_KEYS)[number];

export type StoreIdentity = {
  name: string;
  supportEmail: string;
  phone?: string;
};

export type StoreBranding = {
  primaryColor?: string;
  logoObjectKey?: string;
};

export type StoreSocial = {
  instagram?: string;
  facebook?: string;
  telegram?: string;
};

export type StoreMaintenance = {
  enabled: boolean;
  message?: string;
};

export type StoreStacking = {
  allowCouponWithAutomatic: boolean;
};

export type StoreRevenue = {
  /** Order statuses counted toward revenue metrics. */
  statuses: OrderStatus[];
};

export type StoreGlobalDiscount = {
  /** Store-wide percentage discount (1–100), or null when disabled. */
  percentage: number | null;
};

/** Quote major units per 1 AMD (e.g. usd: "0.0026" → 1 AMD = 0.0026 USD). */
export type StoreFxRates = {
  usd: string;
  rub: string;
};

/** Which catalog currencies appear in the storefront header switcher. */
export type StoreEnabledCurrencies = Record<Currency, boolean>;

/** Store-wide cart subtotal floor; null disables the rule. */
export type StoreMinimumOrder = {
  amount: number | null;
};

/**
 * Loyalty / bonus program rates.
 * `earnPercent` is retained for settings compatibility but unused — earn comes
 * from product/category flat rules only.
 * `earnMinOrderAmount` — merchandise net floor required before flat bonuses
 *   are earned; null disables the floor. Bonus spend has no order minimum
 *   (only wallet balance and payable total).
 */
export type StoreLoyalty = {
  earnPercent: number;
  earnMinOrderAmount: number | null;
};

export const DEFAULT_STORE_LOYALTY: StoreLoyalty = {
  earnPercent: 0,
  earnMinOrderAmount: null,
};

export const DEFAULT_FX_RATES: StoreFxRates = {
  usd: DEFAULT_RATES_FROM_AMD.USD,
  rub: DEFAULT_RATES_FROM_AMD.RUB,
};

export const DEFAULT_ENABLED_CURRENCIES: StoreEnabledCurrencies = {
  AMD: true,
  USD: true,
  RUB: true,
};

function isPositiveRateString(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  try {
    parseRateToFixed(value);
    return true;
  } catch {
    return false;
  }
}

/** All fulfillment statuses count toward revenue except cancelled. */
export const DEFAULT_REVENUE_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "REFUNDED",
  "REQUIRES_REVIEW",
];

export function isStoreSettingKey(value: string): value is StoreSettingKey {
  return (STORE_SETTING_KEYS as readonly string[]).includes(value);
}

export function parseRevenueStatuses(value: unknown): OrderStatus[] {
  if (!value || typeof value !== "object") {
    return [...DEFAULT_REVENUE_STATUSES];
  }

  const statuses = (value as { statuses?: unknown }).statuses;
  if (!Array.isArray(statuses)) {
    return [...DEFAULT_REVENUE_STATUSES];
  }

  const parsed = statuses.filter(
    (item): item is OrderStatus =>
      typeof item === "string" &&
      (ORDER_STATUSES as readonly string[]).includes(item) &&
      item !== "CANCELLED",
  );

  return parsed.length > 0 ? parsed : [...DEFAULT_REVENUE_STATUSES];
}

export function parseMaintenance(value: unknown): StoreMaintenance {
  if (!value || typeof value !== "object") {
    return { enabled: false };
  }

  const record = value as Record<string, unknown>;
  return {
    enabled: record.enabled === true,
    message:
      typeof record.message === "string" ? record.message.slice(0, 500) : undefined,
  };
}

export function parseStacking(value: unknown): StoreStacking {
  if (!value || typeof value !== "object") {
    return { allowCouponWithAutomatic: false };
  }

  return {
    allowCouponWithAutomatic:
      (value as { allowCouponWithAutomatic?: unknown }).allowCouponWithAutomatic ===
      true,
  };
}

export function parseGlobalDiscount(value: unknown): StoreGlobalDiscount {
  if (!value || typeof value !== "object") {
    return { percentage: null };
  }

  const raw = (value as { percentage?: unknown }).percentage;
  if (raw === null || raw === undefined || raw === "") {
    return { percentage: null };
  }

  const percentage = typeof raw === "number" ? raw : Number(raw);
  if (
    !Number.isInteger(percentage) ||
    percentage < 1 ||
    percentage > 100
  ) {
    return { percentage: null };
  }

  return { percentage };
}

export function parseIdentity(value: unknown): StoreIdentity {
  if (!value || typeof value !== "object") {
    return { name: "White Shop", supportEmail: "support@example.com" };
  }

  const record = value as Record<string, unknown>;
  return {
    name:
      typeof record.name === "string" && record.name.trim()
        ? record.name.trim().slice(0, 120)
        : "White Shop",
    supportEmail:
      typeof record.supportEmail === "string" && record.supportEmail.includes("@")
        ? record.supportEmail.trim().toLowerCase().slice(0, 254)
        : "support@example.com",
    phone:
      typeof record.phone === "string" ? record.phone.trim().slice(0, 40) : undefined,
  };
}

export function parseFxRates(value: unknown): StoreFxRates {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_FX_RATES };
  }

  const record = value as Record<string, unknown>;
  return {
    usd: isPositiveRateString(record.usd)
      ? normalizeRateDecimalString(record.usd)
      : DEFAULT_FX_RATES.usd,
    rub: isPositiveRateString(record.rub)
      ? normalizeRateDecimalString(record.rub)
      : DEFAULT_FX_RATES.rub,
  };
}

export function parseEnabledCurrencies(value: unknown): StoreEnabledCurrencies {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_ENABLED_CURRENCIES };
  }

  const record = value as Record<string, unknown>;
  const parsed: StoreEnabledCurrencies = {
    AMD: record.AMD !== false,
    USD: record.USD !== false,
    RUB: record.RUB !== false,
  };

  return listEnabledCurrencies(parsed).length > 0
    ? parsed
    : { ...DEFAULT_ENABLED_CURRENCIES };
}

export function listEnabledCurrencies(
  settings: StoreEnabledCurrencies,
): Currency[] {
  return currencies.filter((currency) => settings[currency]);
}

/** Cookie or requested currency, clamped to admin-enabled storefront currencies. */
export function resolveEnabledDisplayCurrency(
  preferred: Currency,
  enabled: readonly Currency[],
): Currency {
  if (enabled.includes(preferred)) {
    return preferred;
  }
  if (enabled.includes(defaultCurrency)) {
    return defaultCurrency;
  }
  return enabled[0] ?? defaultCurrency;
}

export function parseMinimumOrder(value: unknown): StoreMinimumOrder {
  if (!value || typeof value !== "object") {
    return { amount: null };
  }

  const raw = (value as { amount?: unknown }).amount;
  if (raw === null || raw === undefined || raw === "") {
    return { amount: null };
  }

  const amount = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(amount) || amount <= 0 || amount > 100_000_000) {
    return { amount: null };
  }

  return { amount };
}

function parsePercentField(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") {
    return null;
  }
  const value = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    return null;
  }
  return value;
}

function parseEarnMinOrderAmount(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") {
    return null;
  }
  const value = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(value) || value <= 0 || value > 100_000_000) {
    return null;
  }
  return value;
}

export function parseLoyalty(value: unknown): StoreLoyalty {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_STORE_LOYALTY };
  }

  const record = value as Record<string, unknown>;
  // Prefer earnMinOrderAmount; fall back to legacy redeemMinOrderAmount key.
  const earnMin =
    parseEarnMinOrderAmount(record.earnMinOrderAmount) ??
    parseEarnMinOrderAmount(record.redeemMinOrderAmount);
  return {
    earnPercent: parsePercentField(record.earnPercent) ?? 0,
    earnMinOrderAmount: earnMin,
  };
}

/** True when merchandise net meets the loyalty earn floor (or none is set). */
export function meetsLoyaltyEarnMinOrder(
  merchandiseNet: number,
  earnMinOrderAmount: number | null,
): boolean {
  if (earnMinOrderAmount == null || earnMinOrderAmount <= 0) {
    return true;
  }
  return merchandiseNet >= earnMinOrderAmount;
}

/** Returns true when cart subtotal meets (or exceeds) the configured minimum. */
export function meetsMinimumOrder(
  subtotalAmount: number,
  minimumAmount: number | null,
): boolean {
  if (minimumAmount == null || minimumAmount <= 0) {
    return true;
  }
  return subtotalAmount >= minimumAmount;
}

/**
 * Store minimum applies to delivery only. Take Away (pickup) has no minimum.
 */
export function meetsStorefrontMinimumOrder(
  subtotalAmount: number,
  minimumAmount: number | null,
  shippingMethod: "pickup" | "delivery",
): boolean {
  if (shippingMethod === "pickup") {
    return true;
  }
  return meetsMinimumOrder(subtotalAmount, minimumAmount);
}
