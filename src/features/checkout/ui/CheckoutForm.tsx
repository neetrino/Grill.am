"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";

import type { CheckoutOrderProduct } from "@/features/checkout/ui/checkout-order-product";
import { previewCouponAction } from "@/features/checkout/application/preview-coupon";
import { createOrderAction } from "@/features/checkout/create-order";
import {
  eligibleCodCashDenominations,
  type CodCashDenomination,
} from "@/features/checkout/domain/cod-cash-change";
import type { CheckoutPaymentMethod } from "@/features/checkout/domain/payment-methods";
import type {
  CheckoutAddressChoice,
  CheckoutAddressDrawerLabels,
} from "@/features/checkout/ui/CheckoutAddressDrawer";
import { CheckoutCodCashChange } from "@/features/checkout/ui/CheckoutCodCashChange";
import { CheckoutDetailsSections } from "@/features/checkout/ui/CheckoutDetailsSections";
import {
  isCheckoutEmailValid,
  scrollToCheckoutField,
  type CheckoutInvalidField,
} from "@/features/checkout/ui/checkout-field-validation";
import { CheckoutOrderSummary } from "@/features/checkout/ui/CheckoutOrderSummary";
import { CheckoutProductsInOrder } from "@/features/checkout/ui/CheckoutProductsInOrder";
import { IdramAutoSubmitForm } from "@/features/checkout/ui/IdramAutoSubmitForm";
import {
  CHECKOUT_ALERT_CLASS,
  CHECKOUT_INVALID_FEEDBACK_MS,
  CHECKOUT_PRIMARY_BUTTON_CLASS,
  CHECKOUT_SECTION_CARD_CLASS,
  CHECKOUT_TITLE_INVALID_CLASS,
} from "@/features/checkout/ui/checkout-ui";
import {
  CHECKOUT_DELIVERY_CITY_PRIMARY,
  normalizeCheckoutDeliveryCity,
  resolveCheckoutDeliveryCity,
} from "@/features/checkout/domain/checkout-delivery-cities";
import type { CheckoutDeliveryOption } from "@/features/delivery/application/queries";
import type { CustomerAddressListItem } from "@/features/profile/application/address-queries";
import { meetsStorefrontMinimumOrder } from "@/features/settings/domain/store-settings";
import {
  applyEarnMinOrderGate,
  clampBonusSpendAmount,
  computeMaxBonusRedeemAmount,
  computeOrderTotalWithBonus,
  merchandiseNetAmount,
} from "@/features/loyalty/domain/loyalty-math";
import type { StorePickupOption } from "@/features/stores/yandex-map-embed";
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
  orderComment: string;
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
  orderCommentPlaceholder: string;
  storePickup: string;
  storePickupDescription: string;
  delivery: string;
  deliveryDescription: string;
  pickupBranch: string;
  selectPickupBranch: string;
  selectAddress: string;
  selectAddressRequired: string;
  addressBook: CheckoutAddressDrawerLabels;
  enterCity: string;
  selectShippingMethod: string;
  selectPaymentMethod: string;
  selectDeliveryLocation: string;
  cashOnDelivery: string;
  cashOnDeliveryDescription: string;
  cashOnPickup: string;
  cashOnPickupDescription: string;
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
  bonusTitle: string;
  bonusAvailable: string;
  bonusMaxButton: string;
  bonusApplied: string;
  bonusLoginRequired: string;
  bonusMinOrderHint: string;
  grillCoinLabel: string;
  grillCoinProgressTitle: string;
  grillCoinProgressHint: string;
  grillCoinProgressCta: string;
  subtotal: string;
  shipping: string;
  pickup: string;
  tax: string;
  total: string;
  placeOrder: string;
  processing: string;
  continueShopping: string;
  goToShop: string;
  cartEmpty: string;
  minimumOrder: string;
  fillRequired: string;
  invalidEmail: string;
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
  /** Saved address book when logged in; empty for guests. */
  savedAddresses: CustomerAddressListItem[];
  /** Whether the shopper can persist addresses to their profile. */
  canSaveAddresses: boolean;
  subtotalAmount: number;
  minimumOrderAmount: number | null;
  deliveryOptions: CheckoutDeliveryOption[];
  pickupStores: StorePickupOption[];
  hasItems: boolean;
  /** Server-authoritative payment method flags (booleans only). */
  paymentAvailability: {
    cash_on_delivery: boolean;
    arca: boolean;
    idram: boolean;
  };
  /** Null for guests or when loyalty is unavailable. */
  bonusWallet: {
    balanceAmount: number;
    earnMinOrderAmount: number | null;
    /** Flat product/category-rule earn for current cart (AMD). */
    productBonusEarnAmount: number;
  } | null;
  /**
   * Earn floor + projected cart earn for the Grill Coin progress card
   * (shown to guests and signed-in users below the min).
   */
  grillCoinEarnPreview: {
    earnMinOrderAmount: number | null;
    productBonusEarnAmount: number;
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
  savedAddresses,
  canSaveAddresses,
  subtotalAmount,
  minimumOrderAmount,
  deliveryOptions,
  pickupStores,
  hasItems,
  paymentAvailability,
  bonusWallet,
  grillCoinEarnPreview,
}: CheckoutFormProps) {
  const router = useRouter();
  const idempotencyKey = useMemo(() => createId(), []);
  const defaultRuleId = resolveDefaultDeliveryRuleId(
    deliveryOptions,
    defaultCity,
  );
  const defaultAddressId =
    savedAddresses.find((address) => address.isDefaultShipping)?.id ??
    savedAddresses.find((address) => address.line1 === defaultLine1)?.id ??
    null;
  const [shippingMethod, setShippingMethod] = useState<
    "pickup" | "delivery" | null
  >(null);
  const [deliveryRuleId, setDeliveryRuleId] = useState(defaultRuleId);
  const [line1, setLine1] = useState(defaultLine1);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    defaultAddressId,
  );
  const [pickupStoreId, setPickupStoreId] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<CheckoutPaymentMethod | null>(null);
  const [cashTenderedAmount, setCashTenderedAmount] =
    useState<CodCashDenomination | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invalidFields, setInvalidFields] = useState<
    Partial<Record<CheckoutInvalidField, true>>
  >({});
  const [couponDraft, setCouponDraft] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(
    null,
  );
  const [discountAmount, setDiscountAmount] = useState(0);
  const [useBonus, setUseBonus] = useState(false);
  const [bonusDraft, setBonusDraft] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [applyingCoupon, startApplyCoupon] = useTransition();
  const [idramForm, setIdramForm] = useState<{
    action: string;
    fields: Record<string, string>;
  } | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const submitLockRef = useRef(false);
  const invalidFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (invalidFeedbackTimeoutRef.current) {
        clearTimeout(invalidFeedbackTimeoutRef.current);
      }
    };
  }, []);

  const selectedDelivery = deliveryOptions.find(
    (option) => option.id === deliveryRuleId,
  );
  const selectedPickupStore = pickupStores.find(
    (store) => store.id === pickupStoreId,
  );

  const paymentOptions = useMemo(
    () => {
      const cashName =
        shippingMethod === "pickup"
          ? labels.cashOnPickup
          : labels.cashOnDelivery;
      const cashDescription =
        shippingMethod === "pickup"
          ? labels.cashOnPickupDescription
          : labels.cashOnDeliveryDescription;

      const options = [
        {
          id: "cash_on_delivery" as const,
          name: cashName,
          description: cashDescription,
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
      labels.cashOnPickup,
      labels.cashOnPickupDescription,
      labels.idram,
      labels.idramDescription,
      labels.paymentUnavailable,
      paymentAvailability.arca,
      paymentAvailability.cash_on_delivery,
      paymentAvailability.idram,
      shippingMethod,
    ],
  );

  function onPaymentMethodChange(method: CheckoutPaymentMethod): void {
    setPaymentMethod(method);
    clearInvalidField("payment");
    if (method !== "cash_on_delivery") {
      setCashTenderedAmount(null);
    }
  }

  function formatMoney(amount: number): string {
    return formatMoneyAmount(amount, "AMD", locale);
  }

  const quotedDelivery = quoteDeliveryAmount(selectedDelivery, subtotalAmount);
  const shippingAmount =
    shippingMethod === "delivery" ? quotedDelivery : 0;
  const merchandiseNet = merchandiseNetAmount(subtotalAmount, discountAmount);
  const maxBonusRedeem =
    bonusWallet == null
      ? 0
      : computeMaxBonusRedeemAmount({
          merchandiseNet,
          deliveryAmount: shippingAmount,
          balanceAmount: bonusWallet.balanceAmount,
        });
  const parsedBonusDraft = Number.parseInt(bonusDraft.replace(/\s/g, ""), 10);
  const requestedBonusSpend =
    useBonus && Number.isInteger(parsedBonusDraft) && parsedBonusDraft > 0
      ? parsedBonusDraft
      : 0;
  const bonusSpentAmount = clampBonusSpendAmount(
    requestedBonusSpend,
    maxBonusRedeem,
  );
  const rawProjectedEarn = grillCoinEarnPreview.productBonusEarnAmount;
  const projectedEarn = applyEarnMinOrderGate(
    rawProjectedEarn,
    merchandiseNet,
    grillCoinEarnPreview.earnMinOrderAmount,
  );
  const earnMinOrderAmount = grillCoinEarnPreview.earnMinOrderAmount;
  const showGrillCoinProgress =
    earnMinOrderAmount != null &&
    earnMinOrderAmount > 0 &&
    rawProjectedEarn > 0 &&
    merchandiseNet < earnMinOrderAmount;
  const remainingToEarnMin = showGrillCoinProgress
    ? Math.max(0, earnMinOrderAmount - merchandiseNet)
    : 0;
  const totalAmount = computeOrderTotalWithBonus({
    merchandiseNet,
    deliveryAmount: shippingAmount,
    bonusSpentAmount,
  });

  if (useBonus && maxBonusRedeem <= 0) {
    setUseBonus(false);
    setBonusDraft("");
  } else if (useBonus && bonusDraft.trim() !== "") {
    const parsed = Number.parseInt(bonusDraft.replace(/\s/g, ""), 10);
    if (Number.isInteger(parsed) && parsed > maxBonusRedeem) {
      setBonusDraft(String(maxBonusRedeem));
    }
  }

  function onUseBonusChange(next: boolean): void {
    setUseBonus(next);
    if (!next) {
      setBonusDraft("");
      return;
    }
    if (maxBonusRedeem > 0 && bonusDraft.trim() === "") {
      setBonusDraft(String(maxBonusRedeem));
    }
  }

  function onBonusDraftChange(value: string): void {
    const digitsOnly = value.replace(/[^\d]/g, "");
    if (digitsOnly === "") {
      setBonusDraft("");
      return;
    }
    const next = Number.parseInt(digitsOnly, 10);
    if (!Number.isInteger(next) || next < 0) {
      return;
    }
    setBonusDraft(String(Math.min(next, Math.max(0, maxBonusRedeem))));
  }

  function onBonusMaxClick(): void {
    if (maxBonusRedeem <= 0) {
      setBonusDraft("");
      return;
    }
    setUseBonus(true);
    setBonusDraft(String(maxBonusRedeem));
  }

  const meetsMinimum =
    shippingMethod == null
      ? true
      : meetsStorefrontMinimumOrder(
          subtotalAmount,
          minimumOrderAmount,
          shippingMethod,
        );
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
      ? (selectedPickupStore?.label ?? labels.selectPickupBranch)
      : shippingMethod === "delivery"
        ? selectedDelivery
          ? `${formatMoney(shippingAmount)} (${selectedDelivery.label})`
          : labels.selectDeliveryLocation
        : labels.selectShippingMethod;
  const shippingLabel =
    shippingMethod === "pickup"
      ? labels.pickup
      : shippingMethod === "delivery"
        ? labels.shipping
        : labels.shippingMethod;

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

  function clearInvalidField(field: CheckoutInvalidField): void {
    setInvalidFields((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function markInvalidAndScroll(fields: CheckoutInvalidField[]): void {
    const next: Partial<Record<CheckoutInvalidField, true>> = {};
    for (const field of fields) {
      next[field] = true;
    }
    if (invalidFeedbackTimeoutRef.current) {
      clearTimeout(invalidFeedbackTimeoutRef.current);
      invalidFeedbackTimeoutRef.current = null;
    }
    // Drop classes first so a repeat submit restarts the red + shake.
    setInvalidFields({});
    setError(null);
    requestAnimationFrame(() => {
      setInvalidFields(next);
      const first = fields[0];
      if (first) {
        scrollToCheckoutField(first);
      }
      invalidFeedbackTimeoutRef.current = setTimeout(() => {
        setInvalidFields({});
        invalidFeedbackTimeoutRef.current = null;
      }, CHECKOUT_INVALID_FEEDBACK_MS);
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (pending || submitLockRef.current || redirecting) {
      return;
    }

    const data = new FormData(event.currentTarget);
    const firstName = String(data.get("firstName") ?? "").trim();
    const lastName = String(data.get("lastName") ?? "").trim();
    const contactEmail = String(data.get("contactEmail") ?? "").trim();
    const contactPhone = String(data.get("contactPhone") ?? "").trim();

    const missing: CheckoutInvalidField[] = [];
    if (!firstName) {
      missing.push("firstName");
    }
    if (!lastName) {
      missing.push("lastName");
    }
    if (contactPhone.length < 5) {
      missing.push("contactPhone");
    }
    if (!isCheckoutEmailValid(contactEmail)) {
      missing.push("contactEmail");
    }
    if (shippingMethod == null) {
      missing.push("shipping");
    } else if (shippingMethod === "pickup" && !pickupStoreId) {
      missing.push("pickup");
    } else if (shippingMethod === "delivery" && !line1.trim()) {
      missing.push("address");
    }
    if (paymentMethod == null) {
      missing.push("payment");
    }
    if (!meetsMinimum) {
      missing.push("minimum");
    }

    if (missing.length > 0) {
      markInvalidAndScroll(missing);
      return;
    }

    if (shippingMethod == null || paymentMethod == null) {
      return;
    }

    setError(null);
    setInvalidFields({});
    submitLockRef.current = true;

    startTransition(async () => {
      try {
        const result = await createOrderAction({
          locale,
          idempotencyKey,
          firstName,
          lastName,
          contactEmail,
          contactPhone,
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
          pickupStoreId:
            shippingMethod === "pickup"
              ? pickupStoreId || undefined
              : undefined,
          city:
            shippingMethod === "delivery" ? selectedDelivery?.city : undefined,
          line1:
            shippingMethod === "delivery" ? line1.trim() : undefined,
          customerNote: String(data.get("customerNote") ?? "") || undefined,
          couponCode: appliedCouponCode ?? undefined,
          bonusSpendAmount: bonusSpentAmount > 0 ? bonusSpentAmount : undefined,
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
            id="checkout-field-minimum"
            role="alert"
            className={`mb-6 flex flex-col gap-3 border border-red-200 bg-red-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${CHECKOUT_ALERT_CLASS} ${
              invalidFields.minimum ? CHECKOUT_TITLE_INVALID_CLASS : ""
            }`}
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

        <form onSubmit={onSubmit} noValidate suppressHydrationWarning>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
            <CheckoutDetailsSections
              locale={locale}
              labels={labels}
              pending={pending}
              invalidFields={invalidFields}
              onClearInvalidField={clearInvalidField}
              shippingMethod={shippingMethod}
              onShippingMethodChange={(method) => {
                setShippingMethod(method);
                clearInvalidField("shipping");
                clearInvalidField("pickup");
                clearInvalidField("address");
              }}
              deliveryOptions={deliveryOptions}
              deliveryRuleId={deliveryRuleId}
              onDeliveryRuleChange={setDeliveryRuleId}
              pickupStores={pickupStores}
              pickupStoreId={pickupStoreId}
              onPickupStoreChange={(storeId) => {
                setPickupStoreId(storeId);
                clearInvalidField("pickup");
              }}
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
              canSaveAddresses={canSaveAddresses}
              savedAddresses={savedAddresses}
              selectedAddressId={selectedAddressId}
              line1={line1}
              onAddressSelect={(address: CheckoutAddressChoice) => {
                setSelectedAddressId(address.id);
                setLine1(address.line1);
                clearInvalidField("address");
              }}
            />

            <CheckoutOrderSummary
              title={labels.orderSummary}
              couponTitle={labels.couponTitle}
              couponPlaceholder={labels.couponPlaceholder}
              couponApplyLabel={labels.couponApply}
              couponApplyingLabel={labels.couponApplying}
              discountLabel={labels.discount}
              bonusTitle={labels.bonusTitle}
              bonusAvailableFormatted={
                bonusWallet
                  ? labels.bonusAvailable.replace(
                      "{amount}",
                      formatMoney(bonusWallet.balanceAmount),
                    )
                  : null
              }
              bonusMaxButtonLabel={labels.bonusMaxButton}
              bonusAppliedLabel={labels.bonusApplied}
              bonusLoginRequired={
                bonusWallet == null ? labels.bonusLoginRequired : null
              }
              grillCoinLabel={
                projectedEarn > 0 ? labels.grillCoinLabel : null
              }
              grillCoinAmountFormatted={
                projectedEarn > 0
                  ? `+${Math.floor(projectedEarn).toLocaleString(
                      locale === "en" ? "en-US" : "ru-RU",
                    )}`
                  : null
              }
              grillCoinProgress={
                showGrillCoinProgress
                  ? {
                      productsHref,
                      targetFormatted: formatMoney(earnMinOrderAmount),
                      progressRatio: merchandiseNet / earnMinOrderAmount,
                      copy: {
                        title: labels.grillCoinProgressTitle.replace(
                          "{amount}",
                          formatMoney(earnMinOrderAmount),
                        ),
                        hint: labels.grillCoinProgressHint.replace(
                          "{amount}",
                          formatMoney(remainingToEarnMin),
                        ),
                        cta: labels.grillCoinProgressCta,
                      },
                    }
                  : null
              }
              useBonus={useBonus}
              canUseBonus={maxBonusRedeem > 0}
              bonusDraft={bonusDraft}
              onUseBonusChange={onUseBonusChange}
              onBonusDraftChange={onBonusDraftChange}
              onBonusMaxClick={onBonusMaxClick}
              bonusFormatted={
                bonusSpentAmount > 0 ? formatMoney(bonusSpentAmount) : null
              }
              subtotalLabel={labels.subtotal}
              shippingLabel={shippingLabel}
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
              placeOrderLabel={labels.placeOrder}
              processingLabel={labels.processing}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
