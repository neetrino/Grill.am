import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { formatMoneyAmount } from "@/lib/money/format";
import { defaultCurrency, isCurrency, type Currency } from "@/lib/money/currency";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function resolveLocale(locale: string): Locale {
  const base = locale.split("-")[0] ?? "en";
  return isLocale(base) ? base : "en";
}

function resolveCurrency(value: string): Currency {
  return isCurrency(value) ? value : defaultCurrency;
}

export function money(
  amount: number,
  currency: string,
  locale: Locale,
): string {
  return formatMoneyAmount(amount, resolveCurrency(currency), locale);
}

export function formatPlacedAt(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_m, key: string) => values[key] ?? "");
}

export function row(label: string, value: string): string {
  return `<tr><td style="padding:4px 12px 4px 0;color:#667085;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:4px 0;color:#101828;vertical-align:top;">${value}</td></tr>`;
}

export function textRow(label: string, value: string): string {
  return `${label}: ${value}`;
}

export type ItemsTableLabels = {
  itemsLabel: string;
  qtyLabel: string;
  unitLabel: string;
  lineTotalLabel: string;
  modifiersLabel: string;
};

export function renderItemRowsHtml(
  detail: AdminOrderDetailView,
  locale: Locale,
  labels: ItemsTableLabels,
  options?: { showSku?: boolean },
): string {
  const showSku = options?.showSku ?? true;
  return detail.items
    .map((item) => {
      const skuLine = showSku
        ? `<div style="color:#667085;font-size:12px;">SKU ${escapeHtml(item.sku)}</div>`
        : "";
      const modifiers =
        item.modifierLines.length > 0
          ? `<div style="margin-top:4px;color:#667085;font-size:12px;">${escapeHtml(labels.modifiersLabel)}: ${escapeHtml(item.modifierLines.join(", "))}</div>`
          : "";
      return `<tr>
  <td style="padding:10px 8px;border-bottom:1px solid #eaecf0;vertical-align:top;">
    <div style="font-weight:600;color:#101828;">${escapeHtml(item.title)}</div>
    ${skuLine}
    ${modifiers}
  </td>
  <td style="padding:10px 8px;border-bottom:1px solid #eaecf0;text-align:center;vertical-align:top;">${item.quantity}</td>
  <td style="padding:10px 8px;border-bottom:1px solid #eaecf0;text-align:right;vertical-align:top;">${escapeHtml(money(item.unitPriceAmount, item.currency, locale))}</td>
  <td style="padding:10px 8px;border-bottom:1px solid #eaecf0;text-align:right;vertical-align:top;font-weight:600;">${escapeHtml(money(item.lineTotalAmount, item.currency, locale))}</td>
</tr>`;
    })
    .join("");
}

export function renderItemLinesText(
  detail: AdminOrderDetailView,
  locale: Locale,
  modifiersLabel: string,
): string[] {
  return detail.items.map((item) => {
    const modifiers =
      item.modifierLines.length > 0
        ? ` (${modifiersLabel}: ${item.modifierLines.join(", ")})`
        : "";
    return `- ${item.title}${modifiers} × ${item.quantity} @ ${money(item.unitPriceAmount, item.currency, locale)} = ${money(item.lineTotalAmount, item.currency, locale)}`;
  });
}

export function renderItemsTableHtml(
  labels: ItemsTableLabels,
  itemRowsHtml: string,
): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border:1px solid #eaecf0;border-radius:8px;overflow:hidden;">
            <tr style="background:#f9fafb;">
              <th align="left" style="padding:8px;color:#667085;font-weight:600;">${escapeHtml(labels.itemsLabel)}</th>
              <th align="center" style="padding:8px;color:#667085;font-weight:600;">${escapeHtml(labels.qtyLabel)}</th>
              <th align="right" style="padding:8px;color:#667085;font-weight:600;">${escapeHtml(labels.unitLabel)}</th>
              <th align="right" style="padding:8px;color:#667085;font-weight:600;">${escapeHtml(labels.lineTotalLabel)}</th>
            </tr>
            ${itemRowsHtml}
          </table>`;
}

export type TotalsLabels = {
  totalsLabel: string;
  subtotalLabel: string;
  deliveryFeeLabel: string;
  discountLabel: string;
  totalLabel: string;
  couponLabel: string;
};

export function renderTotalsSectionHtml(
  detail: AdminOrderDetailView,
  locale: Locale,
  labels: TotalsLabels,
): { html: string; couponText: string[] } {
  const currency = detail.baseCurrency;
  const couponHtml = detail.couponCode
    ? row(labels.couponLabel, escapeHtml(detail.couponCode))
    : "";
  const couponText = detail.couponCode
    ? [textRow(labels.couponLabel, detail.couponCode)]
    : [];
  const html = `<div style="font-size:13px;font-weight:700;color:#344054;margin-bottom:8px;">${escapeHtml(labels.totalsLabel)}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            ${row(labels.subtotalLabel, escapeHtml(money(detail.subtotalAmount, currency, locale)))}
            ${row(labels.deliveryFeeLabel, escapeHtml(money(detail.deliveryAmount, currency, locale)))}
            ${row(labels.discountLabel, escapeHtml(money(detail.discountAmount, currency, locale)))}
            ${couponHtml}
            ${row(labels.totalLabel, `<strong>${escapeHtml(money(detail.totalAmount, currency, locale))}</strong>`)}
          </table>`;
  return { html, couponText };
}

export function renderTotalsSectionText(
  detail: AdminOrderDetailView,
  locale: Locale,
  labels: TotalsLabels,
  couponText: string[],
): string[] {
  const currency = detail.baseCurrency;
  return [
    labels.totalsLabel,
    textRow(labels.subtotalLabel, money(detail.subtotalAmount, currency, locale)),
    textRow(labels.deliveryFeeLabel, money(detail.deliveryAmount, currency, locale)),
    textRow(labels.discountLabel, money(detail.discountAmount, currency, locale)),
    ...couponText,
    textRow(labels.totalLabel, money(detail.totalAmount, currency, locale)),
  ];
}

export type PaymentSectionLabels = {
  paymentLabel: string;
  methodLabel: string;
  amountLabel: string;
  cashTenderedLabel: string;
  cashChangeLabel: string;
};

export function renderPaymentSectionHtml(
  detail: AdminOrderDetailView,
  locale: Locale,
  labels: PaymentSectionLabels,
): { html: string; cashText: string[] } {
  const currency = detail.baseCurrency;
  const cashHtml =
    detail.cashTenderedAmount != null
      ? `${row(labels.cashTenderedLabel, escapeHtml(money(detail.cashTenderedAmount, currency, locale)))}${row(labels.cashChangeLabel, escapeHtml(money(detail.cashChangeAmount ?? 0, currency, locale)))}`
      : "";
  const cashText =
    detail.cashTenderedAmount != null
      ? [
          textRow(
            labels.cashTenderedLabel,
            money(detail.cashTenderedAmount, currency, locale),
          ),
          textRow(
            labels.cashChangeLabel,
            money(detail.cashChangeAmount ?? 0, currency, locale),
          ),
        ]
      : [];
  const html = `<div style="font-size:13px;font-weight:700;color:#344054;margin-bottom:8px;">${escapeHtml(labels.paymentLabel)}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            ${row(labels.methodLabel, escapeHtml(detail.paymentMethod))}
            ${row(labels.amountLabel, escapeHtml(money(detail.paymentAmount, currency, locale)))}
            ${cashHtml}
          </table>`;
  return { html, cashText };
}

export type EmailDocumentInput = {
  locale: Locale;
  storeName: string;
  subject: string;
  intro: string;
  innerBodyHtml: string;
  footer: string;
};

/** Shared card layout for admin and customer order emails. */
export function renderOrderEmailDocument(input: EmailDocumentInput): string {
  const { locale, storeName, subject, intro, innerBodyHtml, footer } = input;
  return `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#101828;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f7;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #eaecf0;">
        <tr><td style="background:#111827;padding:20px 24px;">
          <div style="color:#f9fafb;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;">${escapeHtml(storeName)}</div>
          <div style="color:#ffffff;font-size:22px;font-weight:700;margin-top:6px;">${escapeHtml(subject)}</div>
          <div style="color:#d0d5dd;font-size:14px;margin-top:6px;">${escapeHtml(intro)}</div>
        </td></tr>
        ${innerBodyHtml}
        <tr><td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #eaecf0;color:#667085;font-size:12px;">
          ${escapeHtml(footer)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function sectionHeading(title: string): string {
  return `<div style="font-size:13px;font-weight:700;color:#344054;margin-bottom:8px;">${escapeHtml(title)}</div>`;
}

export function bodySection(innerHtml: string, padding = "0 24px 20px"): string {
  return `<tr><td style="padding:${padding};">${innerHtml}</td></tr>`;
}
