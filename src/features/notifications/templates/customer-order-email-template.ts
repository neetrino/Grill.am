import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import type { RenderedEmail } from "@/features/notifications/templates/payment-email-templates";
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
  renderTotalsSectionText,
  resolveLocale,
  row,
  sectionHeading,
  textRow,
} from "@/features/notifications/templates/email-template-primitives";
import type { Locale } from "@/lib/i18n/config";

export type CustomerOrderEmailInput = {
  locale: string;
  storeName: string;
  detail: AdminOrderDetailView;
  /** Pre-formatted order total for copy templates ({amount}). */
  amountFormatted: string;
};

type CustomerCopyBundle = {
  subject: string;
  body: string;
  footer: string;
  orderLabel: string;
  placedAtLabel: string;
  contactLabel: string;
  nameLabel: string;
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
  statusBannerFailed: string;
  statusBannerReview: string;
};

type CustomerLocaleBundle = {
  codCreated: Pick<CustomerCopyBundle, "subject" | "body">;
  captured: Pick<CustomerCopyBundle, "subject" | "body">;
  failed: Pick<CustomerCopyBundle, "subject" | "body">;
  reviewCustomer: Pick<CustomerCopyBundle, "subject" | "body">;
  labels: Omit<CustomerCopyBundle, "subject" | "body">;
};

const LABELS_EN: CustomerLocaleBundle["labels"] = {
  footer: "Thank you for ordering from {storeName}.",
  orderLabel: "Order",
  placedAtLabel: "Placed",
  contactLabel: "Contact",
  nameLabel: "Name",
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
  cashTenderedLabel: "Cash you will pay with",
  cashChangeLabel: "Change",
  statusBannerFailed:
    "Payment was not completed. You can safely retry from your order page.",
  statusBannerReview:
    "Your order is under review. We will contact you if we need anything.",
};

const BUNDLES: Record<"en" | "ru" | "hy", CustomerLocaleBundle> = {
  en: {
    codCreated: {
      subject: "Order {orderNumber} placed — pay on delivery",
      body: "Hello{nameSuffix}. Order {orderNumber} was placed successfully. Please pay {amount} when you receive the order. This message does not mean the order is already paid.",
    },
    captured: {
      subject: "Payment received for order {orderNumber}",
      body: "Hello{nameSuffix}. We received payment of {amount} for order {orderNumber}. Thank you.",
    },
    failed: {
      subject: "Payment not completed for order {orderNumber}",
      body: "Hello{nameSuffix}. Payment for order {orderNumber} ({amount}) was not completed. You can safely retry from your order page.",
    },
    reviewCustomer: {
      subject: "Payment received — order {orderNumber} under review",
      body: "Hello{nameSuffix}. We received payment of {amount} for order {orderNumber}. The order is under review and our team will contact you if needed. This does not mean payment failed.",
    },
    labels: LABELS_EN,
  },
  hy: {
    codCreated: {
      subject: "Պատվեր {orderNumber} տեղադրվել է — վճարեք ստանալիս",
      body: "Բարև{nameSuffix}։ Պատվեր {orderNumber}-ը հաջողությամբ տեղադրվել է։ Խնդրում ենք վճարել {amount}՝ պատվերը ստանալիս։ Այս նամակը չի նշանակում, որ պատվերն արդեն վճարված է։",
    },
    captured: {
      subject: "Վճարումն ստացվել է՝ պատվեր {orderNumber}",
      body: "Բարև{nameSuffix}։ Ստացել ենք {amount} վճարում պատվեր {orderNumber}-ի համար։ Շնորհակալություն։",
    },
    failed: {
      subject: "Վճարումը չի ավարտվել՝ պատվեր {orderNumber}",
      body: "Բարև{nameSuffix}։ Պատվեր {orderNumber}-ի վճարումը ({amount}) չի ավարտվել։ Կարող եք անվտանգ կրկին փորձել պատվերի էջից։",
    },
    reviewCustomer: {
      subject: "Վճարումն ստացվել է՝ պատվեր {orderNumber}-ը վերանայման մեջ է",
      body: "Բարև{nameSuffix}։ Ստացել ենք {amount} վճարում պատվեր {orderNumber}-ի համար։ Պատվերը վերանայման մեջ է, և անհրաժեշտության դեպքում մեր թիմը կկապվի ձեզ հետ։ Սա չի նշանակում, որ վճարումը ձախողվել է։",
    },
    labels: {
      ...LABELS_EN,
      footer: "Շնորհակալություն {storeName}-ից պատվեր կատարելու համար։",
      orderLabel: "Պատվեր",
      placedAtLabel: "Ստեղծվել է",
      contactLabel: "Կապ",
      nameLabel: "Անուն",
      phoneLabel: "Հեռախոս",
      fulfillmentLabel: "Ստացում",
      pickupLabel: "Ինքնաառաքում",
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
      cashTenderedLabel: "Վճարման թղթադրամ",
      cashChangeLabel: "Մանրադրամ",
      statusBannerFailed:
        "Վճարումը չի ավարտվել։ Կարող եք անվտանգ կրկին փորձել պատվերի էջից։",
      statusBannerReview:
        "Պատվերը վերանայման մեջ է։ Անհրաժեշտության դեպքում կկապվենք ձեզ հետ։",
    },
  },
  ru: {
    codCreated: {
      subject: "Заказ {orderNumber} оформлен — оплата при получении",
      body: "Здравствуйте{nameSuffix}. Заказ {orderNumber} успешно оформлен. Оплатите {amount} при получении. Это письмо не означает, что заказ уже оплачен.",
    },
    captured: {
      subject: "Оплата получена по заказу {orderNumber}",
      body: "Здравствуйте{nameSuffix}. Мы получили оплату {amount} по заказу {orderNumber}. Спасибо.",
    },
    failed: {
      subject: "Оплата не завершена по заказу {orderNumber}",
      body: "Здравствуйте{nameSuffix}. Оплата заказа {orderNumber} ({amount}) не завершена. Вы можете безопасно повторить попытку на странице заказа.",
    },
    reviewCustomer: {
      subject: "Оплата получена — заказ {orderNumber} на проверке",
      body: "Здравствуйте{nameSuffix}. Мы получили оплату {amount} по заказу {orderNumber}. Заказ на проверке; при необходимости мы свяжемся с вами. Это не означает, что оплата не прошла.",
    },
    labels: {
      ...LABELS_EN,
      footer: "Спасибо за заказ в {storeName}.",
      orderLabel: "Заказ",
      placedAtLabel: "Создан",
      contactLabel: "Контакт",
      nameLabel: "Имя",
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
      cashTenderedLabel: "Купюра для оплаты",
      cashChangeLabel: "Сдача",
      statusBannerFailed:
        "Оплата не завершена. Вы можете безопасно повторить попытку на странице заказа.",
      statusBannerReview:
        "Заказ на проверке. Мы свяжемся с вами, если понадобится уточнение.",
    },
  },
};

type CustomerVariant = "codCreated" | "captured" | "failed" | "reviewCustomer";

function resolveBundle(locale: Locale): CustomerLocaleBundle {
  if (locale === "ru") return BUNDLES.ru;
  if (locale === "hy") return BUNDLES.hy;
  return BUNDLES.en;
}

function statusBannerHtml(message: string, tone: "failed" | "review"): string {
  const styles =
    tone === "failed"
      ? "background:#fef3f2;border:1px solid #fecdca;color:#b42318;"
      : "background:#eff8ff;border:1px solid #b2ddff;color:#175cd3;";
  return `<div style="margin-bottom:16px;padding:12px 14px;border-radius:8px;font-size:14px;${styles}">${escapeHtml(message)}</div>`;
}

function renderCustomerOrderEmail(
  variant: CustomerVariant,
  input: CustomerOrderEmailInput,
): RenderedEmail {
  const locale = resolveLocale(input.locale);
  const bundle = resolveBundle(locale);
  const labels = bundle.labels;
  const copy = bundle[variant];
  const { detail, storeName, amountFormatted } = input;
  const orderNumber = detail.orderNumber;
  const nameSuffix = detail.contactName ? `, ${detail.contactName}` : "";
  const copyValues = {
    orderNumber,
    amount: amountFormatted,
    nameSuffix,
  };
  const subject = fill(copy.subject, copyValues);
  const intro = fill(copy.body, copyValues);

  const fulfillment = detail.isPickup
    ? labels.pickupLabel
    : (detail.deliveryLabel ?? labels.deliveryLabel);
  const addressDisplay = detail.isPickup
    ? detail.addressLine || detail.storeName
    : detail.addressLine || "—";

  const itemLabels = {
    itemsLabel: labels.itemsLabel,
    qtyLabel: labels.qtyLabel,
    unitLabel: labels.unitLabel,
    lineTotalLabel: labels.lineTotalLabel,
    modifiersLabel: labels.modifiersLabel,
  };
  const itemHtmlRows = renderItemRowsHtml(detail, locale, itemLabels, {
    showSku: false,
  });
  const itemTextLines = renderItemLinesText(
    detail,
    locale,
    labels.modifiersLabel,
  );

  const totalsLabels = {
    totalsLabel: labels.totalsLabel,
    subtotalLabel: labels.subtotalLabel,
    deliveryFeeLabel: labels.deliveryFeeLabel,
    discountLabel: labels.discountLabel,
    totalLabel: labels.totalLabel,
    couponLabel: labels.couponLabel,
  };
  const { html: totalsHtml, couponText } = renderTotalsSectionHtml(
    detail,
    locale,
    totalsLabels,
  );
  const totalsText = renderTotalsSectionText(
    detail,
    locale,
    totalsLabels,
    couponText,
  );

  const paymentLabels = {
    paymentLabel: labels.paymentLabel,
    methodLabel: labels.methodLabel,
    amountLabel: labels.amountLabel,
    cashTenderedLabel: labels.cashTenderedLabel,
    cashChangeLabel: labels.cashChangeLabel,
  };
  const { html: paymentHtml, cashText } = renderPaymentSectionHtml(
    detail,
    locale,
    paymentLabels,
  );

  const bannerSection =
    variant === "failed"
      ? statusBannerHtml(labels.statusBannerFailed, "failed")
      : variant === "reviewCustomer"
        ? statusBannerHtml(labels.statusBannerReview, "review")
        : "";

  const orderMetaSection = bodySection(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            ${row(labels.orderLabel, `<strong>${escapeHtml(orderNumber)}</strong>`)}
            ${row(labels.placedAtLabel, escapeHtml(formatPlacedAt(detail.placedAt, locale)))}
          </table>`,
    bannerSection ? "12px 24px 20px" : "20px 24px 20px",
  );

  const innerBodyHtml = [
    ...(bannerSection
      ? [bodySection(bannerSection, "20px 24px 0")]
      : []),
    orderMetaSection,
    bodySection(
      `${sectionHeading(labels.contactLabel)}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            ${row(labels.nameLabel, escapeHtml(detail.contactName))}
            ${row(labels.phoneLabel, escapeHtml(detail.contactPhone))}
          </table>`,
    ),
    bodySection(
      `${sectionHeading(labels.fulfillmentLabel)}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            ${row(labels.fulfillmentLabel, escapeHtml(fulfillment))}
            ${row(labels.addressLabel, escapeHtml(addressDisplay))}
          </table>`,
    ),
    bodySection(
      `${sectionHeading(labels.itemsLabel)}
          ${renderItemsTableHtml(itemLabels, itemHtmlRows)}`,
      "0 24px 8px",
    ),
    bodySection(totalsHtml, "16px 24px 20px"),
    bodySection(paymentHtml),
  ].join("");

  const html = renderOrderEmailDocument({
    locale,
    storeName,
    subject,
    intro,
    innerBodyHtml,
    footer: fill(labels.footer, { storeName }),
  });

  const bannerText =
    variant === "failed"
      ? [labels.statusBannerFailed, ""]
      : variant === "reviewCustomer"
        ? [labels.statusBannerReview, ""]
        : [];

  const text = [
    subject,
    intro,
    "",
    ...bannerText,
    textRow(labels.orderLabel, orderNumber),
    textRow(labels.placedAtLabel, formatPlacedAt(detail.placedAt, locale)),
    "",
    labels.contactLabel,
    textRow(labels.nameLabel, detail.contactName),
    textRow(labels.phoneLabel, detail.contactPhone),
    "",
    labels.fulfillmentLabel,
    textRow(labels.fulfillmentLabel, fulfillment),
    textRow(labels.addressLabel, addressDisplay),
    "",
    labels.itemsLabel,
    ...itemTextLines,
    "",
    ...totalsText,
    "",
    labels.paymentLabel,
    textRow(labels.methodLabel, detail.paymentMethod),
    textRow(
      labels.amountLabel,
      money(detail.paymentAmount, detail.baseCurrency, locale),
    ),
    ...cashText,
    "",
    fill(labels.footer, { storeName }),
  ].join("\n");

  return { subject, text, html };
}

export function renderCustomerCodOrderCreatedEmail(
  input: CustomerOrderEmailInput,
): RenderedEmail {
  return renderCustomerOrderEmail("codCreated", input);
}

export function renderCustomerPaymentCapturedEmail(
  input: CustomerOrderEmailInput,
): RenderedEmail {
  return renderCustomerOrderEmail("captured", input);
}

export function renderCustomerPaymentFailedEmail(
  input: CustomerOrderEmailInput,
): RenderedEmail {
  return renderCustomerOrderEmail("failed", input);
}

export function renderCustomerReviewEmail(
  input: CustomerOrderEmailInput,
): RenderedEmail {
  return renderCustomerOrderEmail("reviewCustomer", input);
}
