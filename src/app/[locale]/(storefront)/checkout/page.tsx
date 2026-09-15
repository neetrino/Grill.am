import { notFound } from "next/navigation";

import { getCartWithItems } from "@/features/cart/cart";
import { getCheckoutDeliveryOptions } from "@/features/checkout/application/get-checkout-delivery";
import { getCheckoutOrderProducts } from "@/features/checkout/application/get-checkout-order-products";
import {
  CHECKOUT_DELIVERY_CITY_I18N_KEYS,
  resolveCheckoutDeliveryCity,
} from "@/features/checkout/domain/checkout-delivery-cities";
import { CheckoutForm } from "@/features/checkout/ui/CheckoutForm";
import { getPaymentMethodAvailability } from "@/features/payments/application/get-payment-method-availability";
import {
  parseCartModifiers,
  parseProductCustomization,
  unitAmountWithModifiers,
} from "@/features/products/domain/customization";
import {
  getDefaultShippingAddress,
  listCustomerAddresses,
} from "@/features/profile/application/address-queries";
import { resolveProductPrices } from "@/features/promotions/application/resolve-product-prices";
import { getStoreLoyalty, getStoreMinimumOrder } from "@/features/settings/application/queries";
import { getUserBonusBalance } from "@/features/loyalty/application/queries";
import {
  computeFlatBonusEarnAmount,
} from "@/features/loyalty/domain/loyalty-math";
import { resolveActiveFlatBonusByProductId } from "@/features/loyalty/application/product-bonus-board";
import { getStorePickupOptions } from "@/features/stores/yandex-map-embed";
import { getCurrentUser } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type CheckoutPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);
  const copy = dictionary.checkout;
  const [user, { items }, deliveryOptionsRaw, minimumOrder, loyalty] =
    await Promise.all([
      getCurrentUser(),
      getCartWithItems(),
      getCheckoutDeliveryOptions(),
      getStoreMinimumOrder(),
      getStoreLoyalty(),
    ]);
  const bonusBalance = user ? await getUserBonusBalance(user.id) : 0;
  const paymentAvailability = getPaymentMethodAvailability({
    isAdmin: user?.role === "ADMIN",
  });
  const deliveryOptions = deliveryOptionsRaw.map((option) => {
    const city = resolveCheckoutDeliveryCity(option.city);
    if (!city) {
      return option;
    }
    const key = CHECKOUT_DELIVERY_CITY_I18N_KEYS[city];
    return {
      ...option,
      label: copy.deliveryCities[key],
    };
  });
  const [defaultAddress, savedAddresses, prices, orderProducts] =
    await Promise.all([
      user ? getDefaultShippingAddress(user.id) : Promise.resolve(null),
      user ? listCustomerAddresses(user.id) : Promise.resolve([]),
      resolveProductPrices(
        items.map(({ product }) => ({
          id: product.id,
          priceAmount: product.priceAmount,
          compareAtAmount: product.compareAtAmount,
        })),
      ),
      getCheckoutOrderProducts(rawLocale, items),
    ]);
  const subtotal = items.reduce((sum, { item, product }) => {
    const base = prices.get(product.id)?.unitAmount ?? product.priceAmount;
    const unit = unitAmountWithModifiers(
      base,
      parseProductCustomization(product.customization),
      parseCartModifiers(item.modifiers),
    );
    return sum + item.quantity * unit;
  }, 0);

  const productBonusRules = user
    ? await resolveActiveFlatBonusByProductId(
        items.map(({ product }) => product.id),
      )
    : new Map();
  const productBonusEarnAmount = user
    ? computeFlatBonusEarnAmount(
        items.map(({ item, product }) => ({
          productId: product.id,
          quantity: item.quantity,
        })),
        productBonusRules,
      )
    : 0;

  return (
    <CheckoutForm
      locale={rawLocale}
      productsHref={`/${rawLocale}/products`}
      hasItems={items.length > 0}
      orderProducts={orderProducts}
      defaultFirstName={user?.firstName ?? defaultAddress?.recipientFirstName ?? ""}
      defaultLastName={user?.lastName ?? defaultAddress?.recipientLastName ?? ""}
      defaultEmail={user?.email ?? ""}
      defaultPhone={user?.phone ?? defaultAddress?.phone ?? ""}
      defaultLine1={defaultAddress?.line1 ?? ""}
      defaultCity={defaultAddress?.city ?? ""}
      savedAddresses={savedAddresses}
      canSaveAddresses={Boolean(user)}
      subtotalAmount={subtotal}
      minimumOrderAmount={
        user?.role === "ADMIN" ? null : minimumOrder.amount
      }
      deliveryOptions={deliveryOptions}
      pickupStores={getStorePickupOptions(rawLocale)}
      paymentAvailability={paymentAvailability}
      bonusWallet={
        user
          ? {
              balanceAmount: bonusBalance,
              earnMinOrderAmount: loyalty.earnMinOrderAmount,
              productBonusEarnAmount,
            }
          : null
      }
      labels={{
        title: copy.title,
        titleLead: copy.titleLead,
        titleAccent: copy.titleAccent,
        productsInOrder: copy.productsInOrder,
        itemsOne: copy.itemsOne,
        itemsMany: copy.itemsMany,
        removeItem: copy.removeItem,
        contactInformation: copy.contactInformation,
        shippingMethod: copy.shippingMethod,
        shippingAddress: copy.shippingAddress,
        paymentMethod: copy.paymentMethod,
        orderComment: copy.orderComment,
        orderSummary: copy.orderSummary,
        firstName: copy.form.firstName,
        lastName: copy.form.lastName,
        email: copy.form.email,
        phone: copy.form.phone,
        city: copy.form.city,
        address: copy.form.address,
        deliveryLocation: copy.form.deliveryLocation,
        selectLocation: copy.form.selectLocation,
        phonePlaceholder: copy.placeholders.phone,
        cityPlaceholder: copy.placeholders.city,
        addressPlaceholder: copy.placeholders.address,
        orderCommentPlaceholder: copy.placeholders.orderComment,
        storePickup: copy.shipping.storePickup,
        storePickupDescription: copy.shipping.storePickupDescription,
        delivery: copy.shipping.delivery,
        deliveryDescription: copy.shipping.deliveryDescription,
        pickupBranch: copy.form.pickupBranch,
        selectPickupBranch: copy.form.selectPickupBranch,
        selectAddress: copy.addresses.selectAddress,
        selectAddressRequired: copy.addresses.selectAddressRequired,
        addressBook: {
          title: copy.addresses.title,
          close: dictionary.close,
          addAddress: copy.addresses.addAddress,
          noAddresses: copy.addresses.noAddresses,
          newBadge: copy.addresses.newBadge,
          defaultBadge: dictionary.profile.addressBook.defaultBadge,
          line1: copy.form.address,
          addressPlaceholder: copy.placeholders.address,
          city: copy.form.city,
          selectLocation: copy.form.selectLocation,
          cancel: dictionary.profile.cancel,
          add: dictionary.profile.addressBook.add,
          saving: dictionary.profile.saving,
          loginToSave: copy.addresses.loginToSave,
        },
        enterCity: copy.shipping.enterCity,
        selectShippingMethod: copy.shipping.selectShippingMethod,
        selectDeliveryLocation: copy.shipping.selectDeliveryLocation,
        cashOnDelivery: copy.payment.cashOnDelivery,
        cashOnDeliveryDescription: copy.payment.cashOnDeliveryDescription,
        cashOnPickup: copy.payment.cashOnPickup,
        cashOnPickupDescription: copy.payment.cashOnPickupDescription,
        cashChangeTitle: copy.payment.cashChangeTitle,
        cashChangeDescription: copy.payment.cashChangeDescription,
        cashChangeExact: copy.payment.cashChangeExact,
        cashChangeHint: copy.payment.cashChangeHint,
        cashChangeNoEligible: copy.payment.cashChangeNoEligible,
        idram: copy.payment.idram,
        idramDescription: copy.payment.idramDescription,
        arca: copy.payment.arca,
        arcaDescription: copy.payment.arcaDescription,
        paymentUnavailable: copy.payment.unavailable,
        onlineProviderPending: copy.errors.onlineProviderPending,
        couponTitle: copy.coupon.title,
        couponPlaceholder: copy.coupon.placeholder,
        couponApply: copy.coupon.apply,
        couponApplying: copy.coupon.applying,
        discount: copy.summary.discount,
        bonusTitle: copy.bonus.title,
        bonusAvailable: copy.bonus.available,
        bonusMaxButton: copy.bonus.maxButton,
        bonusApplied: copy.bonus.applied,
        bonusLoginRequired: copy.bonus.loginRequired,
        bonusEarnHint: copy.bonus.earnHint,
        bonusMinOrderHint: copy.bonus.minOrderHint,
        subtotal: copy.summary.subtotal,
        shipping: copy.summary.shipping,
        pickup: copy.summary.pickup,
        tax: copy.summary.tax,
        total: copy.summary.total,
        placeOrder: copy.buttons.placeOrder,
        processing: copy.buttons.processing,
        continueShopping: copy.buttons.continueShopping,
        goToShop: copy.buttons.goToShop,
        cartEmpty: copy.errors.cartEmpty,
        minimumOrder: copy.errors.minimumOrder,
        idramRedirecting: copy.payment.idramRedirecting,
        idramSubmitFallback: copy.payment.idramSubmitFallback,
        arcaRedirecting:
          copy.payment.arcaRedirecting ?? copy.success.bodyRedirecting,
        providerUnavailableSaved:
          copy.payment.providerUnavailableSaved ??
          copy.errors.onlineProviderPending,
      }}
    />
  );
}
