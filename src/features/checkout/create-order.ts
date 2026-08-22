"use server";

import { createHash } from "node:crypto";

import { and, eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";

import { getPaymentAdapter } from "@/config/providers";
import {
  cartItems,
  carts,
  deliveryRules,
  orderEvents,
  orderItems,
  orders,
  products,
  promotions,
  promotionUsers,
  stockMovements,
} from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import {
  getCartWithItems,
  revalidateCartPaths,
} from "@/features/cart/cart";
import {
  checkoutSchema,
  type CheckoutInput,
} from "@/features/checkout/schemas";
import {
  buildCodPaymentMetadata,
  validateCodCashTenderedAmount,
} from "@/features/checkout/domain/cod-cash-change";
import { sanitizeCustomerNote } from "@/features/checkout/domain/customer-note";
import {
  createPaymentAttempt,
  getLatestPaymentAttempt,
} from "@/features/payments/application/create-payment-attempt";
import { scheduleOrderEmails } from "@/features/notifications/application/schedule-order-emails";
import { fingerprintCartItems } from "@/features/payments/domain/cart-fingerprint";
import {
  isPaymentDomainError,
  PaymentMethodDisabledError,
  PaymentProviderNotConfiguredError,
} from "@/features/payments/domain/errors";
import { assertPaymentMethodEnabled } from "@/features/payments/application/get-payment-method-availability";
import {
  getPaymentFlowType,
  isOnlinePaymentProvider,
  toPaymentRecord,
  type PaymentMethod,
} from "@/features/payments/domain/payment-method";
import { initializeArcaPayment } from "@/features/payments/providers/arca/initialize-arca-payment";
import { createIdramPaymentForm } from "@/features/payments/providers/idram/create-idram-payment";
import {
  ArcaBusinessError,
  ArcaHttpError,
  isArcaProtocolError,
} from "@/lib/payments/arca/errors";
import { isIdramProtocolError } from "@/lib/payments/idram/errors";
import { logger } from "@/lib/observability/logger";
import {
  generateGuestOrderAccessToken,
  ORDER_ACCESS_COOKIE_MAX_AGE,
  orderAccessCookieName,
} from "@/features/payments/domain/order-access-token";
import {
  ORDER_NUMBER_LOCK_KEY,
  formatOrderNumber,
  nextOrderSequence,
} from "@/features/orders/domain/order-number";
import {
  couponDiscountErrorMessage,
  evaluateCouponDiscount,
  isCouponUserAllowed,
} from "@/features/promotions/domain/evaluate-coupon";
import { normalizePromotionCode } from "@/features/promotions/domain/promotion-rules";
import { resolveProductPrices } from "@/features/promotions/application/resolve-product-prices";
import { getStoreMinimumOrder } from "@/features/settings/application/queries";
import { meetsStorefrontMinimumOrder } from "@/features/settings/domain/store-settings";
import {
  describeModifiers,
  parseCartModifiers,
  parseProductCustomization,
  unitAmountWithModifiers,
} from "@/features/products/domain/customization";
import { getStoreById } from "@/features/stores/yandex-map-embed";
import { getCurrentUser } from "@/lib/auth/session";
import { getCheckoutRateSnapshot } from "@/lib/fx/service";
import { createId } from "@/lib/id";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { convertAmount } from "@/lib/money/convert";
import { defaultCurrency } from "@/lib/money/currency";
import {
  CURRENCY_COOKIE_NAME,
  parseCurrencyCookie,
} from "@/lib/money/currency-cookie";
import { formatMoneyAmount } from "@/lib/money/format";

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function deliveryLabel(countryCode: string, city: string | null): string {
  const cityPart = city?.trim();
  if (cityPart) {
    return `${cityPart}, ${countryCode}`;
  }
  return countryCode;
}

export type CreateOrderResult =
  | {
      ok: true;
      type: "offline_order_created";
      orderId: string;
      orderNumber: string;
      paymentId: string;
    }
  | {
      ok: true;
      type: "payment_redirect_required";
      provider: "arca";
      orderId: string;
      orderNumber: string;
      paymentId: string;
      redirectUrl: string;
    }
  | {
      ok: true;
      type: "payment_form_required";
      provider: "idram";
      orderId: string;
      orderNumber: string;
      paymentId: string;
      action: string;
      method: "POST";
      fields: Record<string, string>;
    }
  | {
      ok: true;
      type: "payment_pending";
      orderId: string;
      orderNumber: string;
      paymentId: string;
      provider: "arca" | "idram";
    }
  | {
      ok: true;
      type: "payment_initialization_uncertain";
      orderId: string;
      orderNumber: string;
      paymentId: string;
      provider: "arca" | "idram";
    }
  | {
      ok: true;
      type: "payment_provider_unavailable";
      orderId: string;
      orderNumber: string;
      paymentId: string;
      provider: "arca" | "idram";
    }
  | {
      /** @deprecated Prefer payment_pending / payment_initialization_uncertain. */
      ok: true;
      type: "online_payment_required";
      orderId: string;
      orderNumber: string;
      paymentId: string;
      provider: "arca" | "idram";
    }
  | { ok: false; error: string; code?: "validation_error" };

type CreatedOrderPayload = {
  orderId: string;
  orderNumber: string;
  paymentId: string;
  flow: "offline" | "online";
  provider: "cod" | "arca" | "idram";
  guestAccessRawToken: string | null;
  locale: string;
  /** Fresh COD create only — skip on idempotent replay. */
  notifyCod: boolean;
};

/** Creates an order with server-side totals; COD fulfills, online stays unpaid. */
export async function createOrderAction(
  raw: CheckoutInput,
): Promise<CreateOrderResult> {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid checkout data.",
      code: "validation_error",
    };
  }

  const input = parsed.data;
  const paymentMethod = input.paymentMethod as PaymentMethod;
  const user = await getCurrentUser();

  try {
    assertPaymentMethodEnabled(paymentMethod, {
      isAdmin: user?.role === "ADMIN",
    });
  } catch (error) {
    if (error instanceof PaymentMethodDisabledError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }

  const flowType = getPaymentFlowType(paymentMethod);
  const { cart, items } = await getCartWithItems();
  const cookieStore = await cookies();
  const displayCurrency = parseCurrencyCookie(
    cookieStore.get(CURRENCY_COOKIE_NAME)?.value,
  );

  if (items.length === 0 || !cart) {
    return { ok: false, error: "Cart is empty." };
  }

  let rateSnapshot;
  try {
    rateSnapshot = await getCheckoutRateSnapshot(displayCurrency);
  } catch {
    return { ok: false, error: "Exchange rate unavailable. Try again shortly." };
  }

  const contactName = `${input.firstName} ${input.lastName}`.trim();
  const customerNote = sanitizeCustomerNote(input.customerNote);
  const scopeHash = hashValue(user?.id ?? cart.guestTokenHash ?? cart.id);
  const keyHash = hashValue(input.idempotencyKey);
  const fingerprint = hashValue(
    JSON.stringify({
      cartId: cart.id,
      items: items.map(({ item }) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      email: input.contactEmail.toLowerCase(),
      shippingMethod: input.shippingMethod,
      paymentMethod: input.paymentMethod,
      cashTenderedAmount: input.cashTenderedAmount ?? null,
      deliveryRuleId: input.deliveryRuleId ?? null,
      customerNote,
    }),
  );

  const sourceCartFingerprint = fingerprintCartItems(
    items.map(({ item }) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  );

  try {
    const created = await withTransaction(async (tx) => {
      const [existing] = await tx
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
        })
        .from(orders)
        .where(
          and(
            eq(orders.idempotencyScopeHash, scopeHash),
            eq(orders.idempotencyKeyHash, keyHash),
            eq(orders.requestFingerprint, fingerprint),
          ),
        )
        .limit(1);

      if (existing) {
        const latestPayment = await getLatestPaymentAttempt(tx, existing.id);
        if (!latestPayment) {
          throw new Error("Existing order is missing a payment attempt.");
        }
        return {
          orderId: existing.id,
          orderNumber: existing.orderNumber,
          paymentId: latestPayment.id,
          flow: flowType,
          provider: toPaymentRecord(paymentMethod).provider,
          guestAccessRawToken: null,
          locale: input.locale,
          notifyCod: false,
        } satisfies CreatedOrderPayload;
      }

      let delivery: typeof deliveryRules.$inferSelect | null = null;
      if (input.shippingMethod === "delivery") {
        if (!input.deliveryRuleId) {
          throw new Error("Delivery location is required.");
        }

        const [matched] = await tx
          .select()
          .from(deliveryRules)
          .where(
            and(
              eq(deliveryRules.id, input.deliveryRuleId),
              eq(deliveryRules.isActive, true),
            ),
          )
          .limit(1);

        if (!matched) {
          throw new Error("Selected delivery location is unavailable.");
        }

        delivery = matched;
      }

      const pickupStore =
        input.shippingMethod === "pickup"
          ? getStoreById(input.pickupStoreId)
          : undefined;
      if (input.shippingMethod === "pickup" && !pickupStore) {
        throw new Error("Pickup branch is required.");
      }

      const address = {
        recipientFirstName: input.firstName,
        recipientLastName: input.lastName,
        phone: input.contactPhone,
        countryCode: delivery?.countryCode ?? "AM",
        region: input.region,
        city:
          input.shippingMethod === "pickup"
            ? (input.city?.trim() || "Yerevan")
            : (delivery?.city?.trim() || input.city?.trim() || ""),
        line1:
          input.shippingMethod === "pickup"
            ? (pickupStore?.address[input.locale] ?? "Store pickup")
            : (input.line1 ?? ""),
        line2: input.line2,
        postalCode: input.postalCode,
      };

      let subtotal = 0;
      const lineSnapshots: Array<{
        productId: string;
        title: string;
        sku: string;
        quantity: number;
        unitAmount: number;
        unitDisplayAmount: number;
        compareAtAmount: number | null;
        lineDiscountAmount: number;
        lineTotal: number;
        nextStock: number;
        modifiersSnapshot: {
          optionChoices: Record<string, string>;
          addonIds: string[];
          exclusionIds: string[];
          labels: string[];
        } | null;
      }> = [];

      const quantityByProduct = new Map<string, number>();
      for (const { item, product } of items) {
        if (product.status !== "ACTIVE") {
          throw new Error("A product in the cart is unavailable.");
        }
        quantityByProduct.set(
          product.id,
          (quantityByProduct.get(product.id) ?? 0) + item.quantity,
        );
      }

      const lockedById = new Map<string, typeof products.$inferSelect>();
      for (const productId of quantityByProduct.keys()) {
        const [locked] = await tx
          .select()
          .from(products)
          .where(eq(products.id, productId))
          .for("update")
          .limit(1);

        const needed = quantityByProduct.get(productId) ?? 0;
        if (!locked || locked.stockOnHand < needed) {
          throw new Error("Insufficient stock for one or more items.");
        }
        lockedById.set(productId, locked);
      }

      const pricedUnits = await resolveProductPrices(
        [...lockedById.values()].map((product) => ({
          id: product.id,
          priceAmount: product.priceAmount,
          compareAtAmount: product.compareAtAmount,
        })),
      );

      const remainingStock = new Map(
        [...lockedById.entries()].map(([id, product]) => [
          id,
          product.stockOnHand,
        ]),
      );

      for (const { item, product } of items) {
        const locked = lockedById.get(product.id);
        if (!locked) {
          throw new Error("A product in the cart is unavailable.");
        }

        const resolved = pricedUnits.get(locked.id);
        const baseUnit = resolved?.unitAmount ?? locked.priceAmount;
        const modifiers = parseCartModifiers(item.modifiers);
        const customization = parseProductCustomization(locked.customization);
        const unitAmount = unitAmountWithModifiers(
          baseUnit,
          customization,
          modifiers,
        );
        const compareAtAmount = resolved?.compareAtAmount ?? null;
        const lineDiscountAmount = Math.max(
          0,
          (resolved?.listAmount ?? locked.priceAmount) - baseUnit,
        );
        const lineTotal = unitAmount * item.quantity;
        const unitDisplayAmount = Number(
          convertAmount(
            unitAmount,
            rateSnapshot.rate,
            defaultCurrency,
            displayCurrency,
          ).amount,
        );
        const nextStock = (remainingStock.get(locked.id) ?? 0) - item.quantity;
        remainingStock.set(locked.id, nextStock);
        subtotal += lineTotal;

        const locale = input.locale;
        const labels = describeModifiers(customization, modifiers, locale);

        lineSnapshots.push({
          productId: locked.id,
          title:
            locked.translations[locale]?.title ??
            locked.translations.hy?.title ??
            locked.translations.en?.title ??
            locked.sku,
          sku: locked.sku,
          quantity: item.quantity,
          unitAmount,
          unitDisplayAmount,
          compareAtAmount,
          lineDiscountAmount,
          lineTotal,
          nextStock,
          modifiersSnapshot:
            labels.length > 0
              ? {
                  optionChoices: modifiers.optionChoices,
                  addonIds: modifiers.addonIds,
                  exclusionIds: modifiers.exclusionIds,
                  labels,
                }
              : null,
        });
      }

      // Admins may place test/small orders below the storefront minimum.
      if (user?.role !== "ADMIN") {
        const { amount: minimumOrderAmount } = await getStoreMinimumOrder();
        if (
          !meetsStorefrontMinimumOrder(
            subtotal,
            minimumOrderAmount,
            input.shippingMethod,
          )
        ) {
          const amountLabel = formatMoneyAmount(
            minimumOrderAmount ?? 0,
            "AMD",
            input.locale,
          );
          const template =
            getDictionary(input.locale).checkout.errors.minimumOrder;
          throw new Error(template.replace("{amount}", amountLabel));
        }
      }

      const deliveryAmount =
        input.shippingMethod === "pickup"
          ? 0
          : delivery &&
              (delivery.freeThresholdAmount === null ||
                subtotal < delivery.freeThresholdAmount)
            ? delivery.priceAmount
            : 0;

      let discountAmount = 0;
      let appliedPromotion: typeof promotions.$inferSelect | null = null;
      if (input.couponCode) {
        const code = normalizePromotionCode(input.couponCode);
        const [coupon] = await tx
          .select()
          .from(promotions)
          .where(
            and(eq(promotions.kind, "COUPON"), eq(promotions.code, code)),
          )
          .for("update")
          .limit(1);

        const nowCheck = new Date();
        const evaluated = evaluateCouponDiscount(coupon, subtotal, nowCheck);
        if (!evaluated.ok || !coupon) {
          throw new Error(
            couponDiscountErrorMessage(
              evaluated.ok ? "INVALID_OR_INACTIVE" : evaluated.error,
            ),
          );
        }

        const allowlist = await tx
          .select({ userId: promotionUsers.userId })
          .from(promotionUsers)
          .where(eq(promotionUsers.promotionId, coupon.id));
        if (
          !isCouponUserAllowed(
            allowlist.map((row) => row.userId),
            user?.id,
          )
        ) {
          throw new Error(couponDiscountErrorMessage("USER_NOT_ELIGIBLE"));
        }

        discountAmount = evaluated.discountAmount;
        appliedPromotion = coupon;

        await tx
          .update(promotions)
          .set({
            usedCount: sql`${promotions.usedCount} + 1`,
            updatedAt: nowCheck,
          })
          .where(eq(promotions.id, coupon.id));
      }

      const totalAmount = Math.max(0, subtotal - discountAmount) + deliveryAmount;

      if (paymentMethod === "cash_on_delivery") {
        const tender = validateCodCashTenderedAmount(
          totalAmount,
          input.cashTenderedAmount,
        );
        if (!tender.ok) {
          throw new Error(tender.error);
        }
      }

      const paymentRecord = toPaymentRecord(paymentMethod);
      const adapter = getPaymentAdapter(paymentRecord.provider);
      if (flowType === "online" && adapter.name === "cod") {
        throw new Error("Online payment must not resolve to COD.");
      }
      // Phase 1: online provider APIs are not initialized; unpaid attempt only.

      const orderId = createId();
      const now = new Date();
      const guestAccess =
        user?.id == null ? generateGuestOrderAccessToken(now) : null;
      await tx.execute(
        sql`select pg_advisory_xact_lock(${ORDER_NUMBER_LOCK_KEY})`,
      );
      const [maxRow] = await tx
        .select({
          maxSeq: sql<number | null>`max(cast(substring(${orders.orderNumber} from 2) as integer))`,
        })
        .from(orders)
        .where(sql`${orders.orderNumber} ~ '^p[0-9]+$'`);
      const number = formatOrderNumber(nextOrderSequence(maxRow?.maxSeq ?? null));

      await tx.insert(orders).values({
        id: orderId,
        orderNumber: number,
        userId: user?.id,
        contactEmail: input.contactEmail.toLowerCase(),
        contactPhone: input.contactPhone,
        contactName,
        customerNote,
        status: "PENDING",
        paymentStatus: "PENDING",
        baseCurrency: defaultCurrency,
        displayCurrency,
        exchangeRate: rateSnapshot.rate,
        exchangeRateSource: rateSnapshot.source,
        exchangeRateAsOf: rateSnapshot.asOf,
        subtotalAmount: subtotal,
        discountAmount,
        taxAmount: 0,
        deliveryAmount,
        totalAmount,
        shippingAddress: address,
        billingAddress: address,
        promotionId: appliedPromotion?.id,
        promotionCodeSnapshot: appliedPromotion?.code ?? null,
        promotionTypeSnapshot: appliedPromotion?.discountType ?? null,
        promotionValueSnapshot: appliedPromotion?.discountValue ?? null,
        promotionDiscountAmount: appliedPromotion ? discountAmount : null,
        deliveryRuleId:
          input.shippingMethod === "delivery" ? (delivery?.id ?? null) : null,
        deliveryLabelSnapshot:
          input.shippingMethod === "pickup"
            ? "Store pickup"
            : delivery
              ? deliveryLabel(delivery.countryCode, delivery.city)
              : "Delivery",
        deliveryEstimateSnapshot:
          input.shippingMethod === "pickup"
            ? null
            : delivery
              ? `${delivery.estimatedDaysMin ?? 1}-${delivery.estimatedDaysMax ?? 3} days`
              : null,
        idempotencyScopeHash: scopeHash,
        idempotencyKeyHash: keyHash,
        requestFingerprint: fingerprint,
        locale: input.locale,
        sourceCartId: cart.id,
        guestAccessTokenHash: guestAccess?.tokenHash ?? null,
        guestAccessExpiresAt: guestAccess?.expiresAt ?? null,
        placedAt: now,
      });

      for (const line of lineSnapshots) {
        await tx.insert(orderItems).values({
          id: createId(),
          orderId,
          productId: line.productId,
          productTitleSnapshot: line.title,
          productSkuSnapshot: line.sku,
          quantity: line.quantity,
          unitBaseAmount: line.unitAmount,
          unitDisplayAmount: line.unitDisplayAmount,
          compareAtAmount: line.compareAtAmount,
          discountAmount: line.lineDiscountAmount * line.quantity,
          lineTotalAmount: line.lineTotal,
          currency: defaultCurrency,
          modifiersSnapshot: line.modifiersSnapshot,
        });
      }

      // Offline (COD): decrement stock now. Online: validate only; confirm later.
      if (flowType === "offline") {
        for (const line of lineSnapshots) {
          await tx
            .update(products)
            .set({
              stockOnHand: line.nextStock,
              version: sql`${products.version} + 1`,
              updatedAt: now,
            })
            .where(eq(products.id, line.productId));

          await tx.insert(stockMovements).values({
            id: createId(),
            productId: line.productId,
            delta: -line.quantity,
            reason: "ORDER",
            orderId,
            resultingBalance: line.nextStock,
            correlationId: number,
          });
        }
      }

      let paymentMetadata: Record<string, unknown> | null = null;
      if (
        paymentMethod === "cash_on_delivery" &&
        input.cashTenderedAmount != null
      ) {
        paymentMetadata = buildCodPaymentMetadata(input.cashTenderedAmount);
      }
      if (flowType === "online") {
        paymentMetadata = {
          ...(paymentMetadata ?? {}),
          sourceCartFingerprint,
        };
      }

      if (flowType === "offline") {
        const adapterResult = await getPaymentAdapter("cod").createPayment({
          orderId,
          amount: BigInt(totalAmount),
          currency: defaultCurrency,
          idempotencyKey: input.idempotencyKey,
        });
        void adapterResult;
      }

      const paymentAttempt = await createPaymentAttempt({
        tx,
        orderId,
        provider: paymentRecord.provider,
        method: paymentMethod,
        amount: totalAmount,
        currency: defaultCurrency,
        metadata: paymentMetadata,
      });

      await tx.insert(orderEvents).values({
        id: createId(),
        orderId,
        eventType: "STATUS_CHANGE",
        fromState: null,
        toState: "PENDING",
        actorUserId: user?.id,
        isCustomerVisible: true,
        payload: {
          source: "checkout",
          paymentFlow: flowType,
          paymentMethod,
        },
      });

      if (flowType === "offline") {
        await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
        await tx
          .update(carts)
          .set({ status: "CONVERTED", updatedAt: now })
          .where(eq(carts.id, cart.id));
      }

      return {
        orderId,
        orderNumber: number,
        paymentId: paymentAttempt.id,
        flow: flowType,
        provider: paymentRecord.provider,
        guestAccessRawToken: guestAccess?.rawToken ?? null,
        locale: input.locale,
        notifyCod: flowType === "offline",
      } satisfies CreatedOrderPayload;
    });

    if (created.guestAccessRawToken) {
      cookieStore.set(
        orderAccessCookieName(created.orderNumber),
        created.guestAccessRawToken,
        {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: ORDER_ACCESS_COOKIE_MAX_AGE,
        },
      );
    }

    if (created.flow === "offline") {
      if (created.notifyCod) {
        scheduleOrderEmails({
          kind: "cod_created",
          orderId: created.orderId,
          orderNumber: created.orderNumber,
          locale: created.locale,
          paymentId: created.paymentId,
        });
      }
      await revalidateCartPaths();
      return {
        ok: true,
        type: "offline_order_created",
        orderId: created.orderId,
        orderNumber: created.orderNumber,
        paymentId: created.paymentId,
      };
    }

    if (!isOnlinePaymentProvider(created.provider)) {
      return { ok: false, error: "Unable to place order." };
    }

    // Cart intentionally unchanged for unpaid online orders.
    if (created.provider === "arca") {
      try {
        const init = await initializeArcaPayment({
          paymentId: created.paymentId,
          locale: input.locale,
        });
        if (init.type === "redirect") {
          return {
            ok: true,
            type: "payment_redirect_required",
            provider: "arca",
            orderId: init.orderId,
            orderNumber: init.orderNumber,
            paymentId: init.paymentId,
            redirectUrl: init.redirectUrl,
          };
        }
        if (init.type === "uncertain") {
          return {
            ok: true,
            type: "payment_initialization_uncertain",
            orderId: created.orderId,
            orderNumber: created.orderNumber,
            paymentId: created.paymentId,
            provider: "arca",
          };
        }
        return {
          ok: true,
          type: "payment_pending",
          orderId: created.orderId,
          orderNumber: created.orderNumber,
          paymentId: created.paymentId,
          provider: "arca",
        };
      } catch (arcaError) {
        if (
          arcaError instanceof PaymentProviderNotConfiguredError ||
          isArcaProtocolError(arcaError) ||
          isPaymentDomainError(arcaError)
        ) {
          const fields: Record<
            string,
            string | number | boolean | null | undefined
          > = {
            provider: "arca",
            paymentId: created.paymentId,
            orderId: created.orderId,
            orderNumber: created.orderNumber,
            errorName:
              arcaError instanceof Error ? arcaError.name : "UnknownError",
            errorMessage:
              arcaError instanceof Error ? arcaError.message : String(arcaError),
          };
          if (isArcaProtocolError(arcaError)) {
            fields.arcaCode = arcaError.code;
          }
          if (arcaError instanceof ArcaBusinessError) {
            fields.providerErrorCode = arcaError.providerErrorCode;
            fields.providerErrorMessage = arcaError.providerErrorMessage;
          }
          if (arcaError instanceof ArcaHttpError) {
            fields.httpStatus = arcaError.httpStatus;
            fields.endpointPath = arcaError.endpointPath;
          }
          // Visible in `pnpm dev` terminal (console.error via logger).
          logger.error("checkout.arca_init_failed", fields);
          return {
            ok: true,
            type: "payment_provider_unavailable",
            orderId: created.orderId,
            orderNumber: created.orderNumber,
            paymentId: created.paymentId,
            provider: "arca",
          };
        }
        throw arcaError;
      }
    }

    if (created.provider === "idram") {
      try {
        const form = await createIdramPaymentForm({
          paymentId: created.paymentId,
          locale: input.locale,
        });
        return {
          ok: true,
          type: "payment_form_required",
          provider: "idram",
          orderId: form.orderId,
          orderNumber: form.orderNumber,
          paymentId: form.paymentId,
          action: form.action,
          method: "POST",
          fields: form.fields,
        };
      } catch (idramError) {
        if (
          idramError instanceof PaymentProviderNotConfiguredError ||
          isIdramProtocolError(idramError) ||
          isPaymentDomainError(idramError)
        ) {
          return {
            ok: true,
            type: "payment_provider_unavailable",
            orderId: created.orderId,
            orderNumber: created.orderNumber,
            paymentId: created.paymentId,
            provider: "idram",
          };
        }
        throw idramError;
      }
    }

    return {
      ok: true,
      type: "payment_pending",
      orderId: created.orderId,
      orderNumber: created.orderNumber,
      paymentId: created.paymentId,
      provider: created.provider,
    };
  } catch (error) {
    if (isPaymentDomainError(error)) {
      return { ok: false, error: error.message };
    }
    const message =
      error instanceof Error ? error.message : "Unable to place order.";
    return { ok: false, error: message };
  }
}
