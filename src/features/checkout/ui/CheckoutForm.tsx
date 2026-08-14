"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition, type FormEvent } from "react";

import type { CheckoutOrderProduct } from "@/features/checkout/ui/checkout-order-product";
import { previewCouponAction } from "@/features/checkout/application/preview-coupon";
import { createOrderAction } from "@/features/checkout/create-order";
import {
  eligibleCodCashDenominations,
  type CodCashDenomination,
} from "@/features/checkout/domain/cod-cash-change";
import type { CheckoutPaymentMethod } from "@/features/checkout/domain/payment-methods";
import { CheckoutCodCashChange } from "@/features/checkout/ui/CheckoutCodCashChange";
import { CheckoutDetailsSections } from "@/features/checkout/ui/CheckoutDetailsSections";
import { CheckoutOrderSummary } from "@/features/checkout/ui/CheckoutOrderSummary";
import { CheckoutProductsInOrder } from "@/features/checkout/ui/CheckoutProductsInOrder";
import { IdramAutoSubmitForm } from "@/features/checkout/ui/IdramAutoSubmitForm";
import {
  CHECKOUT_ALERT_CLASS,
  CHECKOUT_PRIMARY_BUTTON_CLASS,
  CHECKOUT_SECTION_CARD_CLASS,
} from "@/features/checkout/ui/checkout-ui";
import {
  CHECKOUT_DELIVERY_CITY_PRIMARY,
  normalizeCheckoutDeliveryCity,
  resolveCheckoutDeliveryCity,
} from "@/features/checkout/domain/checkout-delivery-cities";
import type { CheckoutDeliveryOption } from "@/features/delivery/application/queries";
import { meetsMinimumOrder } from "@/features/settings/domain/store-settings";
import { createId } from "@/lib/id";
import type { Locale } from "@/lib/i18n/config";
import { formatMoneyAmount } from "@/lib/money/format";

type CheckoutLabels = {
  title: string;
  titleLead: string;
  titleAccent: string;
  productsInOrder: string;
  itemsOne: string;
  itemsMany: string;
  removeItem: string;
  contactInformation: string;
  shippingMethod: string;
  shippingAddress: string;
  paymentMethod: string;
  orderSummary: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  deliveryLocation: string;
  selectLocation: string;
  phonePlaceholder: string;
  cityPlaceholder: string;
  addressPlaceholder: string;
  storePickup: string;
  storePickupDescription: string;
  delivery: string;
  deliveryDescription: string;
  freePickup: string;
  enterCity: string;
  selectDeliveryLocation: string;
  cashOnDelivery: string;
  cashOnDeliveryDescription: string;
  cashChangeTitle: string;
  cashChangeDescription: string;
  cashChangeExact: string;
  cashChangeHint: string;
  cashChangeNoEligible: string;
  idram: string;
  idramDescription: string;
  arca: string;
  arcaDescription: string;
  paymentUnavailable: string;
  onlineProviderPending: string;
  couponTitle: string;
  couponPlaceholder: string;
  couponApply: string;
  couponApplying: string;
  discount: string;
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  placeOrder: string;
  processing: string;
  continueShopping: string;
  goToShop: string;
  cartEmpty: string;
  minimumOrder: string;
  idramRedirecting: string;
  idramSubmitFallback: string;
  arcaRedirecting: string;
  providerUnavailableSaved: string;
};

type CheckoutFormProps = {
  locale: Locale;
  labels: CheckoutLabels;
  productsHref: string;
  orderProducts: CheckoutOrderProduct[];
  defaultFirstName: string;
  defaultLastName: string;
  defaultEmail: string;
  defaultPhone: string;
  defaultLine1: string;
  /** City from the customer's default (Հիմնական) address when available. */
  defaultCity: string;
  subtotalAmount: number;
  minimumOrderAmount: number | null;
  deliveryOptions: CheckoutDeliveryOption[];
  hasItems: boolean;
  /** Server-authoritative payment method flags (booleans only). */
  paymentAvailability: {
    cash_on_delivery: boolean;
    arca: boolean;
    idram: boolean;
  };
};

function quoteDeliveryAmount(
  option: CheckoutDeliveryOption | undefined,
  subtotalAmount: number,
): number {
  if (!option) return 0;
  if (
    option.freeThresholdAmount !== null &&
    subtotalAmount >= option.freeThresholdAmount
  ) {
    return 0;
  }
  return option.priceAmount;
}

function resolveDefaultDeliveryRuleId(
  deliveryOptions: CheckoutDeliveryOption[],
  defaultCity: string,
): string {
  const preferredCity =
    resolveCheckoutDeliveryCity(defaultCity) ?? CHECKOUT_DELIVERY_CITY_PRIMARY;
  const preferredKey = normalizeCheckoutDeliveryCity(preferredCity);
  const primaryKey = normalizeCheckoutDeliveryCity(
    CHECKOUT_DELIVERY_CITY_PRIMARY,
  );

  return (
    deliveryOptions.find(
      (option) =>
        normalizeCheckoutDeliveryCity(option.city) === preferredKey,
    )?.id ??
    deliveryOptions.find(
      (option) =>
        normalizeCheckoutDeliveryCity(option.city) === primaryKey,
    )?.id ??
    deliveryOptions[0]?.id ??
    ""
  );
}

export function CheckoutForm({
  locale,
  labels,
  productsHref,
  orderProducts,
  defaultFirstName,
  defaultLastName,
  defaultEmail,
  defaultPhone,
  defaultLine1,
  defaultCity,
  subtotalAmount,
  minimumOrderAmount,
  deliveryOptions,
  hasItems,
  paymentAvailability,
}: CheckoutFormProps) {
  const router = useRouter();
  const idempotencyKey = useMemo(() => createId(), []);
  const defaultRuleId = resolveDefaultDeliveryRuleId(
    deliveryOptions,
    defaultCity,
  );
  const [shippingMethod, setShippingMethod] = useState<"pickup" | "delivery">(
    deliveryOptions.length > 0 ? "delivery" : "pickup",
  );
  const [deliveryRuleId, setDeliveryRuleId] = useState(defaultRuleId);
  const [paymentMethod, setPaymentMethod] =
    useState<CheckoutPaymentMethod>("cash_on_delivery");
  const [cashTenderedAmount, setCashTenderedAmount] =
    useState<CodCashDenomination | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [couponDraft, setCouponDraft] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(
    null,
  );
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [applyingCoupon, startApplyCoupon] = useTransition();
  const [idramForm, setIdramForm] = useState<{
    action: string;
    fields: Record<string, string>;
  } | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const submitLockRef = useRef(false);

  const selectedDelivery = deliveryOptions.find(
    (option) => option.id === deliveryRuleId,
  );

  const paymentOptions = useMemo(
    () => {
      const options = [
        {
          id: "cash_on_delivery" as const,
          name: labels.cashOnDelivery,
          description: labels.cashOnDeliveryDescription,
          enabled: paymentAvailability.cash_on_delivery,
          unavailableLabel: labels.paymentUnavailable,
        },
        {
          id: "idram" as const,
          name: labels.idram,
          description: labels.idramDescription,
          enabled: paymentAvailability.idram,
          unavailableLabel: labels.paymentUnavailable,
        },
        {
          id: "arca" as const,
          name: labels.arca,
          description: labels.arcaDescription,
          enabled: paymentAvailability.arca,
          unavailableLabel: labels.paymentUnavailable,
        },
      ];
      return options.filter(
        (option) => option.id !== "arca" || option.enabled,
      );
    },
    [
      labels.arca,
      labels.arcaDescription,
      labels.cashOnDelivery,
      labels.cashOnDeliveryDescription,
      labels.idram,
      labels.idramDescription,
      labels.paymentUnavailable,
      paymentAvailability.arca,
      paymentAvailability.cash_on_delivery,
      paymentAvailability.idram,
    ],
  );

  function onPaymentMethodChange(method: CheckoutPaymentMethod): void {
    setPaymentMethod(method);
    if (method !== "cash_on_delivery") {
      setCashTenderedAmount(null);
    }
  }

  function formatMoney(amount: number): string {
    return formatMoneyAmount(amount, "AMD", locale);
  }

  const quotedDelivery = quoteDeliveryAmount(selectedDelivery, subtotalAmount);
  const shippingAmount = shippingMethod === "pickup" ? 0 : quotedDelivery;
  const totalAmount =
    Math.max(0, subtotalAmount - discountAmount) + shippingAmount;
  const meetsMinimum = meetsMinimumOrder(subtotalAmount, minimumOrderAmount);
  const minimumOrderMessage =
    !meetsMinimum && minimumOrderAmount != null
      ? labels.minimumOrder.replace(
          "{amount}",
          formatMoney(minimumOrderAmount),
        )
      : null;

  const resolvedCashTendered: CodCashDenomination | null =
    cashTenderedAmount != null &&
    eligibleCodCashDenominations(totalAmount).includes(cashTenderedAmount)
      ? cashTenderedAmount
      : null;

  const shippingFormatted =
    shippingMethod === "pickup"
      ? labels.freePickup
      : selectedDelivery
        ? `${formatMoney(shippingAmount)} (${selectedDelivery.label})`
        : labels.selectDeliveryLocation;

  function clearAppliedCoupon(): void {
    setAppliedCouponCode(null);
    setDiscountAmount(0);
  }

  function onCouponDraftChange(value: string): void {
    setCouponDraft(value);
    setCouponError(null);
    if (appliedCouponCode) {
      clearAppliedCoupon();
    }
  }

  function onApplyCoupon(): void {
    const code = couponDraft.trim();
    if (!code) {
      return;
    }

    setCouponError(null);
    startApplyCoupon(async () => {
      const result = await previewCouponAction({ couponCode: code });
      if (!result.ok) {
        clearAppliedCoupon();
        setCouponError(result.error);
        return;
      }

      setAppliedCouponCode(result.code);
      setCouponDraft(result.code);
      setDiscountAmount(result.discountAmount);
      setCouponError(null);
    });
  }

  if (!hasItems) {
    return (
      <div className="storefront-bleed bg-[#f1f1f3] lg:bg-white">
        <div className="mx-auto w-full max-w-[1024px] px-4 pt-6 pb-16 sm:px-6 lg:px-6 lg:pt-8 lg:pb-12">
          <h1 className="mb-6 text-[26px] leading-tight font-black uppercase sm:text-[30px] sm:leading-[1.2]">
            <span className="text-brand-red">{labels.titleLead}</span>{" "}
            <span className="text-brand-yellow">{labels.titleAccent}</span>
          </h1>
          <div className={`${CHECKOUT_SECTION_CARD_CLASS} text-center`}>
            <p className="mb-4 text-gray-600">{labels.cartEmpty}</p>
            <Link
              href={productsHref}
              className={`${CHECKOUT_PRIMARY_BUTTON_CLASS} mx-auto max-w-xs`}
            >
              {labels.continueShopping}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!meetsMinimum) {
      setError(minimumOrderMessage);
      return;
    }
    if (pending || submitLockRef.current || redirecting) {
      return;
    }
    const data = new FormData(event.currentTarget);
    setError(null);
    submitLockRef.current = true;

    startTransition(async () => {
      try {
        const result = await createOrderAction({
          locale,
          idempotencyKey,
          firstName: String(data.get("firstName") ?? ""),
          lastName: String(data.get("lastName") ?? ""),
          contactEmail: String(data.get("contactEmail") ?? ""),
          contactPhone: String(data.get("contactPhone") ?? ""),
          shippingMethod,
          paymentMethod,
          cashTenderedAmount:
            paymentMethod === "cash_on_delivery"
              ? (resolvedCashTendered ?? undefined)
              : undefined,
          deliveryRuleId:
            shippingMethod === "delivery"
              ? deliveryRuleId || undefined
              : undefined,
          city:
            shippingMethod === "delivery" ? selectedDelivery?.city : undefined,
          line1:
            shippingMethod === "delivery"
              ? String(data.get("line1") ?? "")
              : undefined,
          couponCode: appliedCouponCode ?? undefined,
        });

        if (!result.ok) {
          setError(result.error);
          submitLockRef.current = false;
          return;
        }

        if (result.type === "payment_redirect_required") {
          setRedirecting(true);
          window.location.assign(result.redirectUrl);
          return;
        }

        if (result.type === "payment_form_required") {
          setIdramForm({
            action: result.action,
            fields: result.fields,
          });
          return;
        }

        if (result.type === "payment_provider_unavailable") {
          setError(labels.providerUnavailableSaved);
          router.push(
            `/${locale}/checkout/success/${result.orderNumber}?state=pending`,
          );
          return;
        }

        if (result.type === "payment_initialization_uncertain") {
          router.push(
            `/${locale}/checkout/success/${result.orderNumber}?state=pending`,
          );
          router.refresh();
          return;
        }

        if (
          result.type === "payment_pending" ||
          result.type === "online_payment_required"
        ) {
          router.push(
            `/${locale}/checkout/success/${result.orderNumber}?state=pending`,
          );
          router.refresh();
          return;
        }

        router.push(`/${locale}/checkout/success/${result.orderNumber}`);
        router.refresh();
      } catch {
        setError(labels.onlineProviderPending);
        submitLockRef.current = false;
      }
    });
  }

  if (idramForm) {
    return (
      <IdramAutoSubmitForm
        action={idramForm.action}
        fields={idramForm.fields}
        redirectingLabel={labels.idramRedirecting}
        submitFallbackLabel={labels.idramSubmitFallback}
      />
    );
  }

  if (redirecting) {
    return (
      <div
        className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4"
        role="status"
        aria-live="polite"
      >
        <p className="text-center text-sm text-gray-700">
          {labels.arcaRedirecting}
        </p>
      </div>
    );
  }

  return (
    <div className="storefront-bleed bg-[#f1f1f3] lg:bg-white">
      <div className="mx-auto w-full max-w-[1024px] px-4 pt-6 pb-16 sm:px-6 lg:px-6 lg:pt-8 lg:pb-12">
        <h1 className="mb-6 text-[26px] leading-tight font-black uppercase sm:text-[30px] sm:leading-[1.2]">
          <span className="text-brand-red">{labels.titleLead}</span>{" "}
          <span className="text-brand-yellow">{labels.titleAccent}</span>
        </h1>

        <CheckoutProductsInOrder
          products={orderProducts}
          title={labels.productsInOrder}
          itemsOneLabel={labels.itemsOne}
          itemsManyLabel={labels.itemsMany}
          removeItemLabel={labels.removeItem}
          onCartChanged={clearAppliedCoupon}
        />

        {minimumOrderMessage ? (
          <div
            role="alert"
            className={`mb-6 flex flex-col gap-3 border border-red-200 bg-red-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${CHECKOUT_ALERT_CLASS}`}
          >
            <p className="text-sm text-red-600">{minimumOrderMessage}</p>
            <Link
              href={productsHref}
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-brand-red px-4 text-sm font-semibold whitespace-nowrap text-white transition hover:bg-brand-red-hot"
            >
              {labels.goToShop}
            </Link>
          </div>
        ) : null}

        <form onSubmit={onSubmit} suppressHydrationWarning>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
            <CheckoutDetailsSections
              labels={labels}
              pending={pending}
              shippingMethod={shippingMethod}
              onShippingMethodChange={setShippingMethod}
              deliveryOptions={deliveryOptions}
              deliveryRuleId={deliveryRuleId}
              onDeliveryRuleChange={setDeliveryRuleId}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={onPaymentMethodChange}
              paymentOptions={paymentOptions}
              cashOnDeliveryExtra={
                <CheckoutCodCashChange
                  title={labels.cashChangeTitle}
                  description={labels.cashChangeDescription}
                  exactLabel={labels.cashChangeExact}
                  changeHintLabel={labels.cashChangeHint}
                  noEligibleLabel={labels.cashChangeNoEligible}
                  orderTotalAmount={totalAmount}
                  formatMoney={formatMoney}
                  value={resolvedCashTendered}
                  onChange={setCashTenderedAmount}
                  disabled={pending}
                />
              }
              defaultFirstName={defaultFirstName}
              defaultLastName={defaultLastName}
              defaultEmail={defaultEmail}
              defaultPhone={defaultPhone}
              defaultLine1={defaultLine1}
            />

            <CheckoutOrderSummary
              title={labels.orderSummary}
              couponTitle={labels.couponTitle}
              couponPlaceholder={labels.couponPlaceholder}
              couponApplyLabel={labels.couponApply}
              couponApplyingLabel={labels.couponApplying}
              discountLabel={labels.discount}
              subtotalLabel={labels.subtotal}
              shippingLabel={labels.shipping}
              taxLabel={labels.tax}
              totalLabel={labels.total}
              subtotalFormatted={formatMoney(subtotalAmount)}
              shippingFormatted={shippingFormatted}
              taxFormatted={null}
              discountFormatted={
                discountAmount > 0 ? formatMoney(discountAmount) : null
              }
              totalFormatted={formatMoney(totalAmount)}
              couponDraft={couponDraft}
              onCouponDraftChange={onCouponDraftChange}
              onApplyCoupon={onApplyCoupon}
              couponError={couponError}
              isApplyingCoupon={applyingCoupon}
              error={error}
              isSubmitting={pending}
              canPlaceOrder={meetsMinimum}
              placeOrderLabel={labels.placeOrder}
              processingLabel={labels.processing}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
