import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import type { RenderedEmail } from "@/features/outbox/templates/payment-email-templates";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { formatMoneyAmount } from "@/lib/money/format";
import { defaultCurrency, isCurrency, type Currency } from "@/lib/money/currency";

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
    cashTenderedLabel: "Հաճախորդի թղթադրամ",
    cashChangeLabel: "Մանրադրամ",
    footer: "Ուղարկվել է {storeName}-ի պատվերի ծանուցումներով։",
  },
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function resolveLocale(locale: string): Locale {
  const base = locale.split("-")[0] ?? "en";
  return isLocale(base) ? base : "en";
}

function resolveBundle(locale: Locale): AdminBundle {
  if (locale === "ru") return BUNDLES.ru;
  if (locale === "hy") return BUNDLES.hy;
  return BUNDLES.en;
}

function resolveCurrency(value: string): Currency {
  return isCurrency(value) ? value : defaultCurrency;
}

function money(
  amount: number,
  currency: string,
  locale: Locale,
): string {
  return formatMoneyAmount(amount, resolveCurrency(currency), locale);
}

function formatPlacedAt(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_m, key: string) => values[key] ?? "");
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:4px 12px 4px 0;color:#667085;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:4px 0;color:#101828;vertical-align:top;">${value}</td></tr>`;
}

function textRow(label: string, value: string): string {
  return `${label}: ${value}`;
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
    ? detail.storeName
    : detail.addressLine || "—";

  const itemHtmlRows = detail.items
    .map((item) => {
      const modifiers =
        item.modifierLines.length > 0
          ? `<div style="margin-top:4px;color:#667085;font-size:12px;">${escapeHtml(bundle.modifiersLabel)}: ${escapeHtml(item.modifierLines.join(", "))}</div>`
          : "";
      return `<tr>
  <td style="padding:10px 8px;border-bottom:1px solid #eaecf0;vertical-align:top;">
    <div style="font-weight:600;color:#101828;">${escapeHtml(item.title)}</div>
    <div style="color:#667085;font-size:12px;">SKU ${escapeHtml(item.sku)}</div>
    ${modifiers}
  </td>
  <td style="padding:10px 8px;border-bottom:1px solid #eaecf0;text-align:center;vertical-align:top;">${item.quantity}</td>
  <td style="padding:10px 8px;border-bottom:1px solid #eaecf0;text-align:right;vertical-align:top;">${escapeHtml(money(item.unitPriceAmount, item.currency, locale))}</td>
  <td style="padding:10px 8px;border-bottom:1px solid #eaecf0;text-align:right;vertical-align:top;font-weight:600;">${escapeHtml(money(item.lineTotalAmount, item.currency, locale))}</td>
</tr>`;
    })
    .join("");

  const itemTextLines = detail.items.map((item) => {
    const modifiers =
      item.modifierLines.length > 0
        ? ` (${bundle.modifiersLabel}: ${item.modifierLines.join(", ")})`
        : "";
    return `- ${item.title}${modifiers} × ${item.quantity} @ ${money(item.unitPriceAmount, item.currency, locale)} = ${money(item.lineTotalAmount, item.currency, locale)}`;
  });

  const cashHtml =
    detail.cashTenderedAmount != null
      ? `${row(bundle.cashTenderedLabel, escapeHtml(money(detail.cashTenderedAmount, currency, locale)))}${row(bundle.cashChangeLabel, escapeHtml(money(detail.cashChangeAmount ?? 0, currency, locale)))}`
      : "";

  const cashText =
    detail.cashTenderedAmount != null
      ? [
          textRow(
            bundle.cashTenderedLabel,
            money(detail.cashTenderedAmount, currency, locale),
          ),
          textRow(
            bundle.cashChangeLabel,
            money(detail.cashChangeAmount ?? 0, currency, locale),
          ),
        ]
      : [];

  const couponHtml = detail.couponCode
    ? row(bundle.couponLabel, escapeHtml(detail.couponCode))
    : "";
  const couponText = detail.couponCode
    ? [textRow(bundle.couponLabel, detail.couponCode)]
    : [];

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#101828;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f7;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #eaecf0;">
        <tr><td style="background:#111827;padding:20px 24px;">
          <div style="color:#f9fafb;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;">${escapeHtml(storeName)}</div>
          <div style="color:#ffffff;font-size:22px;font-weight:700;margin-top:6px;">${escapeHtml(subject)}</div>
          <div style="color:#d0d5dd;font-size:14px;margin-top:6px;">${escapeHtml(bundle.intro)}</div>
        </td></tr>
        <tr><td style="padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            ${row(bundle.orderLabel, `<strong>${escapeHtml(orderNumber)}</strong>`)}
            ${row(bundle.placedAtLabel, escapeHtml(formatPlacedAt(detail.placedAt, locale)))}
            ${row(bundle.statusLabel, escapeHtml(detail.status))}
            ${row(bundle.paymentStatusLabel, escapeHtml(detail.paymentStatus))}
          </table>
        </td></tr>
        <tr><td style="padding:0 24px 20px;">
          <div style="font-size:13px;font-weight:700;color:#344054;margin-bottom:8px;">${escapeHtml(bundle.customerLabel)}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            ${row(bundle.nameLabel, escapeHtml(detail.contactName))}
            ${row(bundle.emailLabel, escapeHtml(detail.contactEmail))}
            ${row(bundle.phoneLabel, escapeHtml(detail.contactPhone))}
          </table>
        </td></tr>
        <tr><td style="padding:0 24px 20px;">
          <div style="font-size:13px;font-weight:700;color:#344054;margin-bottom:8px;">${escapeHtml(bundle.fulfillmentLabel)}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            ${row(bundle.fulfillmentLabel, escapeHtml(fulfillment))}
            ${row(bundle.addressLabel, escapeHtml(addressDisplay))}
          </table>
        </td></tr>
        <tr><td style="padding:0 24px 8px;">
          <div style="font-size:13px;font-weight:700;color:#344054;margin-bottom:8px;">${escapeHtml(bundle.itemsLabel)}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border:1px solid #eaecf0;border-radius:8px;overflow:hidden;">
            <tr style="background:#f9fafb;">
              <th align="left" style="padding:8px;color:#667085;font-weight:600;">${escapeHtml(bundle.itemsLabel)}</th>
              <th align="center" style="padding:8px;color:#667085;font-weight:600;">${escapeHtml(bundle.qtyLabel)}</th>
              <th align="right" style="padding:8px;color:#667085;font-weight:600;">${escapeHtml(bundle.unitLabel)}</th>
              <th align="right" style="padding:8px;color:#667085;font-weight:600;">${escapeHtml(bundle.lineTotalLabel)}</th>
            </tr>
            ${itemHtmlRows}
          </table>
        </td></tr>
        <tr><td style="padding:16px 24px 20px;">
          <div style="font-size:13px;font-weight:700;color:#344054;margin-bottom:8px;">${escapeHtml(bundle.totalsLabel)}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            ${row(bundle.subtotalLabel, escapeHtml(money(detail.subtotalAmount, currency, locale)))}
            ${row(bundle.deliveryFeeLabel, escapeHtml(money(detail.deliveryAmount, currency, locale)))}
            ${row(bundle.discountLabel, escapeHtml(money(detail.discountAmount, currency, locale)))}
            ${couponHtml}
            ${row(bundle.totalLabel, `<strong>${escapeHtml(money(detail.totalAmount, currency, locale))}</strong>`)}
          </table>
        </td></tr>
        <tr><td style="padding:0 24px 24px;">
          <div style="font-size:13px;font-weight:700;color:#344054;margin-bottom:8px;">${escapeHtml(bundle.paymentLabel)}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            ${row(bundle.methodLabel, escapeHtml(detail.paymentMethod))}
            ${row(bundle.amountLabel, escapeHtml(money(detail.paymentAmount, currency, locale)))}
            ${cashHtml}
          </table>
        </td></tr>
        <tr><td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #eaecf0;color:#667085;font-size:12px;">
          ${escapeHtml(fill(bundle.footer, { storeName }))}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

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
    bundle.totalsLabel,
    textRow(bundle.subtotalLabel, money(detail.subtotalAmount, currency, locale)),
    textRow(bundle.deliveryFeeLabel, money(detail.deliveryAmount, currency, locale)),
    textRow(bundle.discountLabel, money(detail.discountAmount, currency, locale)),
    ...couponText,
    textRow(bundle.totalLabel, money(detail.totalAmount, currency, locale)),
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
