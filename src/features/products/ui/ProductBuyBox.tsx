"use client";

import { Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";

import { addCartLineQuantity } from "@/features/cart/cart-line-coordinator";
import { playCartFlyAnimation } from "@/features/cart/cart-fly-animation";
import {
  computeModifiersDelta,
  describeModifiers,
  hasRequiredModifiersSelected,
  selectionKeyFromModifiers,
  type CartModifiers,
  type ProductCustomization,
  type StorefrontCustomization,
} from "@/features/products/domain/customization";
import { ProductAddonChecklist } from "@/features/products/ui/ProductAddonChecklist";
import type { Locale } from "@/lib/i18n/config";
import { convertAmount } from "@/lib/money/convert";
import type { Currency } from "@/lib/money/currency";
import { defaultCurrency } from "@/lib/money/currency";
import { formatMoneyAmount } from "@/lib/money/format";

type ProductBuyBoxLabels = {
  quantity: string;
  decreaseQuantity: string;
  increaseQuantity: string;
  addToCart: string;
  selectRequired: string;
  outOfStock: string;
  added: string;
  error: string;
  options: string;
  addons: string;
  exclusions: string;
  removeModifier: string;
  orderSummary: string;
  basePrice: string;
  total: string;
};

type ProductBuyBoxProps = {
  locale: Locale;
  currency: Currency;
  fxRate: string;
  productId: string;
  title: string;
  slug: string;
  stockOnHand: number;
  baseUnitAmount: number;
  compareAtAmount: number | null;
  initialPriceFormatted: string;
  initialCompareAtFormatted: string | null;
  shortDescription?: string;
  description?: string;
  imageUrl?: string | null;
  customization: StorefrontCustomization;
  rawCustomization: ProductCustomization | null;
  ratingAverage?: number | null;
  ratingCount?: number | null;
  labels: ProductBuyBoxLabels;
};

function formatDisplay(
  amountAmd: number,
  rate: string,
  currency: Currency,
  locale: Locale,
): string {
  const converted = convertAmount(
    amountAmd,
    rate,
    defaultCurrency,
    currency,
  );
  return formatMoneyAmount(converted.amount, currency, locale);
}

function subscribeNoop(): () => void {
  return () => undefined;
}

function formatReviewCount(count: number): string {
  if (count >= 1000) {
    const thousands = count / 1000;
    const rounded =
      thousands >= 10
        ? String(Math.round(thousands))
        : (Math.round(thousands * 10) / 10).toFixed(1).replace(/\.0$/, "");
    return `(${rounded}k+)`;
  }
  return `(${count})`;
}

export function ProductBuyBox({
  locale,
  currency,
  fxRate,
  productId,
  title,
  slug,
  stockOnHand,
  baseUnitAmount,
  compareAtAmount,
  initialPriceFormatted,
  initialCompareAtFormatted,
  shortDescription,
  description,
  imageUrl = null,
  customization,
  rawCustomization,
  ratingAverage = null,
  ratingCount = null,
  labels,
}: ProductBuyBoxProps) {
  const maxQty = Math.max(stockOnHand, 0);
  const [modifiers, setModifiers] = useState<CartModifiers>({
    optionChoices: {},
    addonIds: [],
    exclusionIds: [],
  });
  const [quantity, setQuantity] = useState(maxQty > 0 ? 1 : 0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Renders the server-formatted price until the client mounts, then
  // switches to live client-computed pricing (currency/modifier reactive).
  const livePricing = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const disabled = maxQty < 1;
  const optionsComplete = hasRequiredModifiersSelected(
    rawCustomization,
    modifiers,
  );
  const canAdd = !disabled && optionsComplete;

  const modifiersDelta = useMemo(
    () => computeModifiersDelta(rawCustomization, modifiers),
    [rawCustomization, modifiers],
  );
  const unitAmount = baseUnitAmount + modifiersDelta;
  const lineAmount = unitAmount * Math.max(quantity, 1);

  const priceFormatted = livePricing
    ? formatDisplay(unitAmount, fxRate, currency, locale)
    : initialPriceFormatted;
  const lineFormatted = livePricing
    ? formatDisplay(lineAmount, fxRate, currency, locale)
    : initialPriceFormatted;
  const baseFormatted = livePricing
    ? formatDisplay(baseUnitAmount, fxRate, currency, locale)
    : initialPriceFormatted;
  const compareAtFormatted =
    compareAtAmount != null && compareAtAmount > unitAmount
      ? livePricing
        ? formatDisplay(compareAtAmount, fxRate, currency, locale)
        : initialCompareAtFormatted
      : null;

  function changeQuantity(next: number): void {
    if (disabled) return;
    setQuantity(Math.min(Math.max(1, next), maxQty));
    setMessage(null);
    setError(null);
  }

  function selectOption(groupId: string, choiceId: string): void {
    setModifiers((prev) => ({
      ...prev,
      optionChoices: { ...prev.optionChoices, [groupId]: choiceId },
    }));
    setMessage(null);
    setError(null);
  }

  function toggleAddon(addonId: string): void {
    setModifiers((prev) => {
      const exists = prev.addonIds.includes(addonId);
      return {
        ...prev,
        addonIds: exists
          ? prev.addonIds.filter((id) => id !== addonId)
          : [...prev.addonIds, addonId],
      };
    });
    setMessage(null);
    setError(null);
  }

  function toggleExclusion(exclusionId: string): void {
    setModifiers((prev) => {
      const exists = prev.exclusionIds.includes(exclusionId);
      return {
        ...prev,
        exclusionIds: exists
          ? prev.exclusionIds.filter((id) => id !== exclusionId)
          : [...prev.exclusionIds, exclusionId],
      };
    });
    setMessage(null);
    setError(null);
  }

  function handleAdd(): void {
    if (!canAdd || quantity < 1) return;
    setMessage(null);
    setError(null);

    const flyOrigin = document.querySelector("[data-product-fly-origin]");
    playCartFlyAnimation({
      fromElement: flyOrigin,
      imageUrl: imageUrl?.trim() || null,
    });

    const selectionKey = selectionKeyFromModifiers(modifiers);
    const displayUnitAmount = Number(
      convertAmount(unitAmount, fxRate, defaultCurrency, currency).amount,
    );
    setMessage(labels.added);

    void addCartLineQuantity({
      productId,
      selectionKey,
      addQuantity: quantity,
      modifiers,
      display: {
        productId,
        selectionKey,
        title,
        slug,
        quantity,
        imageUrl,
        unitPriceAmount: displayUnitAmount,
        unitPriceFormatted: priceFormatted,
        locale,
        currency,
        modifierLines: describeModifiers(rawCustomization, modifiers, locale),
      },
    }).catch(() => {
      setMessage(null);
      setError(labels.error);
    });
  }

  const blurb = shortDescription || description;

  return (
    <div className="flex flex-col gap-[25px]">
      <section className="rounded-[30px] bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl leading-[30px] font-bold text-[#101828]">
            {title}
          </h1>
          {ratingAverage != null && ratingCount != null && ratingCount > 0 ? (
            <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#fff7ed] px-3 py-1.5">
              <Star
                className="size-3.5 fill-brand-red text-brand-red"
                aria-hidden
              />
              <span className="text-sm font-bold text-brand-red">
                {ratingAverage.toFixed(1)}
              </span>
              <span className="text-xs text-[#99a1af]">
                {formatReviewCount(ratingCount)}
              </span>
            </div>
          ) : null}
        </div>

        {blurb ? (
          <p className="mt-3 text-sm leading-[22.75px] text-[#6a7282]">
            {blurb}
          </p>
        ) : null}

        {customization.optionGroups.length > 0 ? (
          <fieldset className="mt-5 flex flex-col gap-4 border-b border-[#f3f4f6] pb-5">
            <legend className="sr-only">{labels.options}</legend>
            {customization.optionGroups.map((group) => (
              <div key={group.id} className="flex flex-col gap-2">
                <p className="text-xs font-medium tracking-[0.25px] text-[#99a1af] uppercase">
                  {group.label}
                  {group.required ? " *" : ""}
                </p>
                <div
                  className="flex flex-wrap gap-2"
                  role="radiogroup"
                  aria-label={group.label}
                >
                  {group.choices.map((choice) => {
                    const selected =
                      modifiers.optionChoices[group.id] === choice.id;
                    return (
                      <button
                        key={choice.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => selectOption(group.id, choice.id)}
                        className={`rounded-full border px-3 py-2 text-sm transition ${
                          selected
                            ? "border-brand-red bg-brand-red text-white"
                            : "border-[#e5e7eb] bg-white text-[#1e2939] hover:border-brand-red/40"
                        }`}
                      >
                        {choice.label}
                        {choice.priceDeltaAmount > 0 && livePricing
                          ? ` (+${formatDisplay(choice.priceDeltaAmount, fxRate, currency, locale)})`
                          : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </fieldset>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-[30px] leading-9 font-bold text-brand-red">
              {priceFormatted}
            </p>
            {compareAtFormatted ? (
              <p className="text-base leading-6 text-[#99a1af] line-through">
                {compareAtFormatted}
              </p>
            ) : null}
          </div>

          <div className="inline-flex items-center gap-3 rounded-full bg-brand-red px-2 py-1.5">
            <button
              type="button"
              aria-label={labels.decreaseQuantity}
              disabled={disabled || quantity <= 1}
              onClick={() => changeQuantity(quantity - 1)}
              className="inline-flex size-8 items-center justify-center rounded-full bg-white/45 text-white transition hover:bg-white/60 disabled:opacity-40"
            >
              <Minus className="size-3.5" aria-hidden />
            </button>
            <span
              className="min-w-6 text-center text-base font-bold text-white"
              aria-label={labels.quantity}
            >
              {quantity}
            </span>
            <button
              type="button"
              aria-label={labels.increaseQuantity}
              disabled={disabled || quantity >= maxQty}
              onClick={() => changeQuantity(quantity + 1)}
              className="inline-flex size-8 items-center justify-center rounded-full bg-white text-brand-red transition hover:bg-white/90 disabled:opacity-40"
            >
              <Plus className="size-3.5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-[22px]">
          <button
            type="button"
            disabled={!canAdd}
            onClick={handleAdd}
            className="inline-flex h-[53px] w-full items-center justify-center gap-3 rounded-[66px] bg-brand-red px-4 text-sm font-semibold text-white transition hover:bg-brand-red-hot disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart
              className="h-[21px] w-[22px] shrink-0 fill-white"
              strokeWidth={1.2}
              aria-hidden
            />
            <span>
              {disabled
                ? labels.outOfStock
                : !optionsComplete
                  ? labels.selectRequired
                  : labels.addToCart}
            </span>
            {canAdd ? (
              <span className="text-base font-black">{lineFormatted}</span>
            ) : null}
          </button>

          <div>
            <p className="text-xs font-semibold tracking-[0.6px] text-[#6b7280] uppercase">
              {labels.orderSummary}
            </p>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[#6b7280]">{labels.basePrice}</dt>
                <dd className="font-medium text-[#101828]">{baseFormatted}</dd>
              </div>
              <div className="border-t border-[rgba(107,114,128,0.47)] pt-2.5">
                <div className="flex items-center justify-between gap-3 text-base">
                  <dt className="font-bold text-[#101828]">{labels.total}</dt>
                  <dd className="font-bold text-[#101828]">{lineFormatted}</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>

        {message ? (
          <p className="mt-3 text-sm text-green-700" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <ProductAddonChecklist
        addons={customization.addons}
        exclusions={customization.exclusions}
        selectedAddonIds={modifiers.addonIds}
        selectedExclusionIds={modifiers.exclusionIds}
        livePricing={livePricing}
        formatPrice={(amount) =>
          formatDisplay(amount, fxRate, currency, locale)
        }
        labels={{
          addons: labels.addons,
          exclusions: labels.exclusions,
          removeModifier: labels.removeModifier,
        }}
        onToggleAddon={toggleAddon}
        onToggleExclusion={toggleExclusion}
      />
    </div>
  );
}
