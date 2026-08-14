export type PaymentEmailTemplateInput = {
  locale: string;
  orderNumber: string;
  amountFormatted: string;
  contactName?: string;
};

export type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

type LocaleBundle = {
  codCreated: { subject: string; body: string };
  captured: { subject: string; body: string };
  failed: { subject: string; body: string };
  reviewCustomer: { subject: string; body: string };
  reviewOperator: { subject: string; body: string };
};

const BUNDLES: Record<string, LocaleBundle> = {
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
    reviewOperator: {
      subject: "[HIGH] REQUIRES_REVIEW order {orderNumber}",
      body: "Order {orderNumber} has CAPTURED payment ({amount}) but fulfillment requires review (e.g. stock). Do not mark payment as failed. Resolve via admin review workflow.",
    },
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
    reviewOperator: {
      subject: "[HIGH] REQUIRES_REVIEW պատվեր {orderNumber}",
      body: "Պատվեր {orderNumber}-ը CAPTURED վճարում ունի ({amount}), բայց առաքումը պահանջում է վերանայում։ Մի նշեք վճարումը որպես ձախողված։",
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
    reviewOperator: {
      subject: "[HIGH] REQUIRES_REVIEW заказ {orderNumber}",
      body: "Заказ {orderNumber} имеет CAPTURED оплату ({amount}), но выполнение требует проверки. Не отмечайте оплату как failed.",
    },
  },
};

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_m, key: string) => values[key] ?? "");
}

function renderPair(
  locale: string,
  key: keyof LocaleBundle,
  input: PaymentEmailTemplateInput,
): RenderedEmail {
  const bundle = BUNDLES[locale] ?? BUNDLES.en!;
  const entry = bundle[key];
  if (!entry) {
    throw new Error(`Missing email template: ${locale}/${String(key)}`);
  }
  const nameSuffix = input.contactName ? `, ${input.contactName}` : "";
  const values = {
    orderNumber: input.orderNumber,
    amount: input.amountFormatted,
    nameSuffix,
  };
  const subject = fill(entry.subject, values);
  const text = fill(entry.body, values);
  const html = `<p>${escapeHtml(text)}</p>`;
  return { subject, text, html };
}

export function renderCodOrderCreatedEmail(
  input: PaymentEmailTemplateInput,
): RenderedEmail {
  return renderPair(input.locale, "codCreated", input);
}

export function renderPaymentCapturedEmail(
  input: PaymentEmailTemplateInput,
): RenderedEmail {
  return renderPair(input.locale, "captured", input);
}

export function renderPaymentFailedEmail(
  input: PaymentEmailTemplateInput,
): RenderedEmail {
  return renderPair(input.locale, "failed", input);
}

export function renderReviewCustomerEmail(
  input: PaymentEmailTemplateInput,
): RenderedEmail {
  return renderPair(input.locale, "reviewCustomer", input);
}

export function renderReviewOperatorEmail(
  input: PaymentEmailTemplateInput,
): RenderedEmail {
  return renderPair(input.locale, "reviewOperator", input);
}
