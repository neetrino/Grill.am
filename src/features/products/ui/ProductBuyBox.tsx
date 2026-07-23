"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

import { addToCart } from "@/features/cart/cart";
import {
  computeModifiersDelta,
  defaultModifiers,
  type CartModifiers,
  type ProductCustomization,
  type StorefrontCustomization,
} from "@/features/products/domain/customization";
import { ProductModifierDropdowns } from "@/features/products/ui/ProductModifierDropdowns";
import { WishlistButton } from "@/features/wishlist/ui/WishlistButton";
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
  adding: string;
  outOfStock: string;
  added: string;
  error: string;
  shortDescription: string;
  composition: string;
  options: string;
  addons: string;
  exclusions: string;
  selectAddon: string;
  selectExclusion: string;
  removeModifier: string;
  inStock: string;
  sku: string;
};

type ProductBuyBoxProps = {
  locale: Locale;
  currency: Currency;
  fxRate: string;
  productId: string;
  sku: string;
  stockOnHand: number;
  baseUnitAmount: number;
  compareAtAmount: number | null;
  discountPercent: number | null;
  /** SSR-safe formatted base price (no modifiers). */
  initialPriceFormatted: string;
  initialCompareAtFormatted: string | null;
  shortDescription?: string;
  composition?: string;
  description?: string;
  customization: StorefrontCustomization;
  /** Raw catalog used for delta math (ids + amounts). */
  rawCustomization: ProductCustomization | null;
  inWishlist: boolean;
  isSignedIn: boolean;
  wishlistLabel: string;
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

export function ProductBuyBox({
  locale,
  currency,
  fxRate,
  productId,
  sku,
  stockOnHand,
  baseUnitAmount,
  compareAtAmount,
  discountPercent,
  initialPriceFormatted,
  initialCompareAtFormatted,
  shortDescription,
  composition,
  description,
  customization,
  rawCustomization,
  inWishlist,
  isSignedIn,
  wishlistLabel,
  labels,
}: ProductBuyBoxProps) {
  const maxQty = Math.max(stockOnHand, 0);
  const [modifiers, setModifiers] = useState<CartModifiers>(() =>
    defaultModifiers(rawCustomization),
  );
  const [quantity, setQuantity] = useState(maxQty > 0 ? 1 : 0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [livePricing, setLivePricing] = useState(false);
  const disabled = maxQty < 1;
  const inStock = maxQty > 0;

  useEffect(() => {
    setLivePricing(true);
  }, []);

  const modifiersDelta = useMemo(
    () => computeModifiersDelta(rawCustomization, modifiers),
    [rawCustomization, modifiers],
  );
  const unitAmount = baseUnitAmount + modifiersDelta;

  const priceFormatted = livePricing
    ? formatDisplay(unitAmount, fxRate, currency, locale)
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
    if (disabled || quantity < 1) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await addToCart(productId, quantity, modifiers);
        setMessage(labels.added);
      } catch {
        setError(labels.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <p className="text-2xl font-semibold text-gray-900">{priceFormatted}</p>
        {compareAtFormatted ? (
          <p className="text-base text-gray-500 line-through">
            {compareAtFormatted}
          </p>
        ) : null}
        {discountPercent != null ? (
          <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
            -{discountPercent}%
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
        <span>
          {labels.sku}: {sku}
        </span>
        <span aria-hidden>·</span>
        <span className={inStock ? "text-green-700" : "text-red-700"}>
          {inStock ? labels.inStock : labels.outOfStock}
        </span>
      </div>

      {shortDescription ? (
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-gray-900">
            {labels.shortDescription}
          </h2>
          <p className="text-base leading-relaxed text-gray-600">
            {shortDescription}
          </p>
        </div>
      ) : null}

      {description && !shortDescription ? (
        <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-600">
          {description}
        </p>
      ) : null}

      {description && shortDescription ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
          {description}
        </p>
      ) : null}

      {composition ? (
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-gray-900">
            {labels.composition}
          </h2>
          <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-600">
            {composition}
          </p>
        </div>
      ) : null}

      {customization.optionGroups.length > 0 ? (
        <fieldset className="flex flex-col gap-4">
          <legend className="text-sm font-semibold text-gray-900">
            {labels.options}
          </legend>
          {customization.optionGroups.map((group) => (
            <div key={group.id} className="flex flex-col gap-2">
              <p className="text-sm text-gray-700">
                {group.label}
                {group.required ? " *" : ""}
              </p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={group.label}>
                {group.choices.map((choice) => {
                  const selected = modifiers.optionChoices[group.id] === choice.id;
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => selectOption(group.id, choice.id)}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        selected
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-white text-gray-800 hover:border-gray-400"
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

      <ProductModifierDropdowns
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
          selectAddon: labels.selectAddon,
          selectExclusion: labels.selectExclusion,
          removeModifier: labels.removeModifier,
        }}
        onToggleAddon={toggleAddon}
        onToggleExclusion={toggleExclusion}
      />

      <div className="mt-auto flex flex-col gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white">
            <button
              type="button"
              aria-label={labels.decreaseQuantity}
              disabled={disabled || quantity <= 1 || pending}
              onClick={() => changeQuantity(quantity - 1)}
              className="flex h-11 w-11 items-center justify-center text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
            >
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <span
              className="min-w-10 text-center text-base font-semibold text-gray-900"
              aria-label={labels.quantity}
            >
              {quantity}
            </span>
            <button
              type="button"
              aria-label={labels.increaseQuantity}
              disabled={disabled || quantity >= maxQty || pending}
              onClick={() => changeQuantity(quantity + 1)}
              className="flex h-11 w-11 items-center justify-center text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <button
            type="button"
            disabled={disabled || pending}
            onClick={handleAdd}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-gray-900 px-6 text-base font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:min-w-[12rem]"
          >
            {disabled
              ? labels.outOfStock
              : pending
                ? labels.adding
                : labels.addToCart}
          </button>

          <WishlistButton
            locale={locale}
            productId={productId}
            initialInWishlist={inWishlist}
            isSignedIn={isSignedIn}
            label={wishlistLabel}
            className="h-11 w-11 border border-gray-200 bg-white hover:bg-gray-50"
          />
        </div>

        {message ? (
          <p className="text-sm text-green-700" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
