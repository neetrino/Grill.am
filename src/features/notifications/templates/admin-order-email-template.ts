import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import type { RenderedEmail } from "@/features/notifications/templates/payment-email-templates";
import type { Locale } from "@/lib/i18n/config";
import {
  bodySection,
  escapeHtml,
  fill,
  formatPlacedAt,
  money,
  renderItemLinesText,
  renderItemRowsHtml,
  renderItemsTableHtml,
  renderOrderEmailDocument,
  renderPaymentSectionHtml,
  renderTotalsSectionHtml,
  resolveLocale,
  row,
  sectionHeading,
  textRow,
} from "@/features/notifications/templates/email-template-primitives";

export type AdminOrderEmailInput = {
  locale: string;
  storeName: string;
  detail: AdminOrderDetailView;
};

type AdminBundle = {
  subject: string;
  intro: string;
  orderLabel: string;
  placedAtLabel: string;
  statusLabel: string;
  paymentStatusLabel: string;
  customerLabel: string;
  nameLabel: string;
  emailLabel: string;
  phoneLabel: string;
  fulfillmentLabel: string;
  pickupLabel: string;
  deliveryLabel: string;
  addressLabel: string;
  itemsLabel: string;
  qtyLabel: string;
  unitLabel: string;
  lineTotalLabel: string;
  modifiersLabel: string;
  totalsLabel: string;
  subtotalLabel: string;
  deliveryFeeLabel: string;
  discountLabel: string;
  totalLabel: string;
  couponLabel: string;
  paymentLabel: string;
  methodLabel: string;
  amountLabel: string;
  cashTenderedLabel: string;
  cashChangeLabel: string;
  footer: string;
};

const BUNDLES: Record<"en" | "ru" | "hy", AdminBundle> = {
  en: {
    subject: "New order {orderNumber}",
    intro: "A confirmed order requires attention.",
    orderLabel: "Order",
    placedAtLabel: "Placed",
    statusLabel: "Order status",
    paymentStatusLabel: "Payment status",
    customerLabel: "Customer",
    nameLabel: "Name",
    emailLabel: "Email",
    phoneLabel: "Phone",
    fulfillmentLabel: "Fulfillment",
    pickupLabel: "Pickup",
    deliveryLabel: "Delivery",
    addressLabel: "Address",
    itemsLabel: "Items",
    qtyLabel: "Qty",
    unitLabel: "Unit",
    lineTotalLabel: "Line total",
    modifiersLabel: "Options",
    totalsLabel: "Totals",
    subtotalLabel: "Subtotal",
    deliveryFeeLabel: "Delivery",
    discountLabel: "Discount",
    totalLabel: "Total",
    couponLabel: "Coupon",
    paymentLabel: "Payment",
    methodLabel: "Method",
    amountLabel: "Amount",
    cashTenderedLabel: "Cash tendered",
    cashChangeLabel: "Change due",
    footer: "Sent by {storeName} order notifications.",
  },
  ru: {
    subject: "Новый заказ {orderNumber}",
    intro: "Подтверждённый заказ требует внимания.",
    orderLabel: "Заказ",
    placedAtLabel: "Создан",
    statusLabel: "Статус заказа",
    paymentStatusLabel: "Статус оплаты",
    customerLabel: "Клиент",
    nameLabel: "Имя",
    emailLabel: "Email",
    phoneLabel: "Телефон",
    fulfillmentLabel: "Получение",
    pickupLabel: "Самовывоз",
    deliveryLabel: "Доставка",
    addressLabel: "Адрес",
    itemsLabel: "Позиции",
    qtyLabel: "Кол-во",
    unitLabel: "Цена",
    lineTotalLabel: "Сумма",
    modifiersLabel: "Опции",
    totalsLabel: "Итого",
    subtotalLabel: "Подытог",
    deliveryFeeLabel: "Доставка",
    discountLabel: "Скидка",
    totalLabel: "Всего",
    couponLabel: "Купон",
    paymentLabel: "Оплата",
    methodLabel: "Способ",
    amountLabel: "Сумма",
    cashTenderedLabel: "Купюра клиента",
    cashChangeLabel: "Сдача",
    footer: "Отправлено уведомлениями заказов {storeName}.",
  },
  hy: {
    subject: "Նոր պատվեր {orderNumber}",
    intro: "Հաստատված պատվերը պահանջում է ուշադրություն։",
    orderLabel: "Պատվեր",
    placedAtLabel: "Ստեղծվել է",
    statusLabel: "Պատվերի կարգավիճակ",
    paymentStatusLabel: "Վճարման կարգավիճակ",
    customerLabel: "Հաճախորդ",
    nameLabel: "Անուն",
    emailLabel: "Email",
    phoneLabel: "Հեռախոս",
    fulfillmentLabel: "Ստացում",
    pickupLabel: "Մասնաճյուղ",
    deliveryLabel: "Առաքում",
    addressLabel: "Հասցե",
    itemsLabel: "Ապրանքներ",
    qtyLabel: "Քանակ",
    unitLabel: "Գին",
    lineTotalLabel: "Գումար",
    modifiersLabel: "Ընտրանքներ",
    totalsLabel: "Ընդամենը",
    subtotalLabel: "Ենթագումար",
    deliveryFeeLabel: "Առաքում",
    discountLabel: "Զեղչ",
    totalLabel: "Ընդհանուր",
    couponLabel: "Կուպոն",
    paymentLabel: "Վճարում",
    methodLabel: "Եղանակ",
    amountLabel: "Գումար",
    cashTenderedLabel: "Հաճախորդի թղթադրամ",
    cashChangeLabel: "Մանրադրամ",
    footer: "Ուղարկվել է {storeName}-ի պատվերի ծանուցումներով։",
  },
};

function resolveBundle(locale: Locale): AdminBundle {
  if (locale === "ru") return BUNDLES.ru;
  if (locale === "hy") return BUNDLES.hy;
  return BUNDLES.en;
}

/**
 * Renders a rich HTML + plain-text admin order notification.
 * Escapes all user-provided content; never includes payment secrets.
 */
export function renderAdminOrderEmail(
  input: AdminOrderEmailInput,
): RenderedEmail {
  const locale = resolveLocale(input.locale);
  const bundle = resolveBundle(locale);
  const { detail, storeName } = input;
  const currency = detail.baseCurrency;
  const orderNumber = detail.orderNumber;
  const subject = fill(bundle.subject, { orderNumber });

  const fulfillment = detail.isPickup
    ? bundle.pickupLabel
    : (detail.deliveryLabel ?? bundle.deliveryLabel);
  const addressDisplay = detail.isPickup
    ? detail.addressLine || detail.storeName
    : detail.addressLine || "—";

  const itemLabels = {
    itemsLabel: bundle.itemsLabel,
    qtyLabel: bundle.qtyLabel,
    unitLabel: bundle.unitLabel,
    lineTotalLabel: bundle.lineTotalLabel,
    modifiersLabel: bundle.modifiersLabel,
  };
  const itemHtmlRows = renderItemRowsHtml(detail, locale, itemLabels, {
    showSku: true,
  });
  const itemTextLines = renderItemLinesText(
    detail,
    locale,
    bundle.modifiersLabel,
  );

  const totalsLabels = {
    totalsLabel: bundle.totalsLabel,
    subtotalLabel: bundle.subtotalLabel,
    deliveryFeeLabel: bundle.deliveryFeeLabel,
    discountLabel: bundle.discountLabel,
    totalLabel: bundle.totalLabel,
    couponLabel: bundle.couponLabel,
  };
  const { html: totalsHtml, couponText } = renderTotalsSectionHtml(
    detail,
    locale,
    totalsLabels,
  );

  const paymentLabels = {
    paymentLabel: bundle.paymentLabel,
    methodLabel: bundle.methodLabel,
    amountLabel: bundle.amountLabel,
    cashTenderedLabel: bundle.cashTenderedLabel,
    cashChangeLabel: bundle.cashChangeLabel,
  };
  const { html: paymentHtml, cashText } = renderPaymentSectionHtml(
    detail,
    locale,
    paymentLabels,
  );

  const innerBodyHtml = [
    bodySection(
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            ${row(bundle.orderLabel, `<strong>${escapeHtml(orderNumber)}</strong>`)}
            ${row(bundle.placedAtLabel, escapeHtml(formatPlacedAt(detail.placedAt, locale)))}
            ${row(bundle.statusLabel, escapeHtml(detail.status))}
            ${row(bundle.paymentStatusLabel, escapeHtml(detail.paymentStatus))}
          </table>`,
      "20px 24px",
    ),
    bodySection(
      `${sectionHeading(bundle.customerLabel)}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            ${row(bundle.nameLabel, escapeHtml(detail.contactName))}
            ${row(bundle.emailLabel, escapeHtml(detail.contactEmail))}
            ${row(bundle.phoneLabel, escapeHtml(detail.contactPhone))}
          </table>`,
    ),
    bodySection(
      `${sectionHeading(bundle.fulfillmentLabel)}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            ${row(bundle.fulfillmentLabel, escapeHtml(fulfillment))}
            ${row(bundle.addressLabel, escapeHtml(addressDisplay))}
          </table>`,
    ),
    bodySection(
      `${sectionHeading(bundle.itemsLabel)}
          ${renderItemsTableHtml(itemLabels, itemHtmlRows)}`,
      "0 24px 8px",
    ),
    bodySection(`${totalsHtml}`, "16px 24px 20px"),
    bodySection(paymentHtml),
  ].join("");

  const html = renderOrderEmailDocument({
    locale,
    storeName,
    subject,
    intro: bundle.intro,
    innerBodyHtml,
    footer: fill(bundle.footer, { storeName }),
  });

  const text = [
    subject,
    bundle.intro,
    "",
    textRow(bundle.orderLabel, orderNumber),
    textRow(bundle.placedAtLabel, formatPlacedAt(detail.placedAt, locale)),
    textRow(bundle.statusLabel, detail.status),
    textRow(bundle.paymentStatusLabel, detail.paymentStatus),
    "",
    bundle.customerLabel,
    textRow(bundle.nameLabel, detail.contactName),
    textRow(bundle.emailLabel, detail.contactEmail),
    textRow(bundle.phoneLabel, detail.contactPhone),
    "",
    bundle.fulfillmentLabel,
    textRow(bundle.fulfillmentLabel, fulfillment),
    textRow(bundle.addressLabel, addressDisplay),
    "",
    bundle.itemsLabel,
    ...itemTextLines,
    "",
    ...[
      bundle.totalsLabel,
      textRow(
        bundle.subtotalLabel,
        money(detail.subtotalAmount, currency, locale),
      ),
      textRow(
        bundle.deliveryFeeLabel,
        money(detail.deliveryAmount, currency, locale),
      ),
      textRow(
        bundle.discountLabel,
        money(detail.discountAmount, currency, locale),
      ),
      ...couponText,
      textRow(bundle.totalLabel, money(detail.totalAmount, currency, locale)),
    ],
    "",
    bundle.paymentLabel,
    textRow(bundle.methodLabel, detail.paymentMethod),
    textRow(bundle.amountLabel, money(detail.paymentAmount, currency, locale)),
    ...cashText,
    "",
    fill(bundle.footer, { storeName }),
  ].join("\n");

  return { subject, text, html };
}
