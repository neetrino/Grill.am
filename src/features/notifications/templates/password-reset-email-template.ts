import {
  escapeHtml,
  fill,
} from "@/features/notifications/templates/email-template-primitives";
import type { RenderedEmail } from "@/features/notifications/templates/payment-email-templates";
import type { Locale } from "@/lib/i18n/config";

/** Mirrors the storefront palette in `src/app/globals.css`. */
const BRAND = {
  red: "#db0b20",
  ink: "#071014",
  surface: "#f4f4f4",
  muted: "#667085",
  body: "#344054",
  border: "#eaecf0",
} as const;

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export type PasswordResetEmailInput = {
  locale: Locale;
  storeName: string;
  resetUrl: string;
  ttlMinutes: number;
};

type PasswordResetCopy = {
  subject: string;
  preheader: string;
  heading: string;
  body: string;
  button: string;
  expiry: string;
  ignore: string;
  footer: string;
};

const COPY: Record<Locale, PasswordResetCopy> = {
  en: {
    subject: "Reset your password — {storeName}",
    preheader: "Choose a new password for your {storeName} account.",
    heading: "Reset your password",
    body: "We received a request to reset the password for your {storeName} account. Tap the button below to choose a new one.",
    button: "Set new password",
    expiry: "The link is valid for {minutes} minutes.",
    ignore:
      "If you didn't request a password reset, just ignore this email — your password will stay the same.",
    footer: "You received this email from {storeName}.",
  },
  ru: {
    subject: "Восстановление пароля — {storeName}",
    preheader: "Задайте новый пароль для аккаунта {storeName}.",
    heading: "Восстановление пароля",
    body: "Мы получили запрос на сброс пароля для вашего аккаунта {storeName}. Нажмите кнопку ниже, чтобы задать новый пароль.",
    button: "Задать новый пароль",
    expiry: "Ссылка действительна {minutes} минут.",
    ignore:
      "Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо — ваш пароль останется прежним.",
    footer: "Вы получили это письмо от {storeName}.",
  },
  hy: {
    subject: "Գաղտնաբառի վերականգնում — {storeName}",
    preheader: "Ընտրեք նոր գաղտնաբառ ձեր {storeName} հաշվի համար։",
    heading: "Գաղտնաբառի վերականգնում",
    body: "Մենք ստացել ենք ձեր {storeName} հաշվի գաղտնաբառը վերականգնելու հարցում։ Սեղմեք ստորև կոճակը՝ նոր գաղտնաբառ ընտրելու համար։",
    button: "Ընտրել նոր գաղտնաբառ",
    expiry: "Հղումը վավեր է {minutes} րոպե։",
    ignore:
      "Եթե դուք չեք պահանջել գաղտնաբառի վերականգնում, պարզապես անտեսեք այս նամակը․ ձեր գաղտնաբառը չի փոխվի։",
    footer: "Այս նամակը ուղարկվել է {storeName}-ի կողմից։",
  },
};

function renderButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
  <tr><td align="center" bgcolor="${BRAND.red}" style="border-radius:20px;background:${BRAND.red};">
    <a href="${escapeHtml(href)}" target="_blank" rel="noopener" style="display:inline-block;padding:16px 36px;font-family:${FONT_STACK};font-size:14px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:#ffffff;text-decoration:none;border-radius:20px;">${escapeHtml(label)}</a>
  </td></tr>
</table>`;
}

function renderHtml(
  input: PasswordResetEmailInput,
  copy: PasswordResetCopy,
  values: Record<string, string>,
): string {
  const storeName = escapeHtml(input.storeName);
  return `<!DOCTYPE html>
<html lang="${input.locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(fill(copy.subject, values))}</title></head>
<body style="margin:0;padding:0;background:${BRAND.surface};font-family:${FONT_STACK};color:${BRAND.ink};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(fill(copy.preheader, values))}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.surface};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid ${BRAND.border};">
        <tr><td align="center" style="background:${BRAND.ink};padding:28px 24px;border-bottom:4px solid ${BRAND.red};">
          <div style="color:#ffffff;font-size:22px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;">${storeName}</div>
        </td></tr>
        <tr><td align="center" style="padding:40px 32px 8px;">
          <h1 style="margin:0;font-size:26px;line-height:1.25;font-weight:800;color:${BRAND.ink};">${escapeHtml(copy.heading)}</h1>
          <p style="margin:16px 0 0;font-size:16px;line-height:1.6;color:${BRAND.body};">${escapeHtml(fill(copy.body, values))}</p>
        </td></tr>
        <tr><td align="center" style="padding:28px 32px;">
          ${renderButton(input.resetUrl, copy.button)}
          <p style="margin:16px 0 0;font-size:13px;color:${BRAND.muted};">${escapeHtml(fill(copy.expiry, values))}</p>
        </td></tr>
        <tr><td style="padding:0 32px 32px;">
          <div style="border-top:1px solid ${BRAND.border};padding-top:20px;font-size:13px;line-height:1.6;color:${BRAND.muted};text-align:center;">${escapeHtml(copy.ignore)}</div>
        </td></tr>
        <tr><td align="center" style="padding:16px 24px;background:${BRAND.surface};color:${BRAND.muted};font-size:12px;">
          ${escapeHtml(fill(copy.footer, values))}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Branded password-reset email; HTML shows only a button, plain text keeps the link. */
export function renderPasswordResetEmail(
  input: PasswordResetEmailInput,
): RenderedEmail {
  const copy = COPY[input.locale];
  const values = {
    storeName: input.storeName,
    minutes: String(input.ttlMinutes),
  };

  const text = [
    fill(copy.heading, values),
    "",
    fill(copy.body, values),
    "",
    input.resetUrl,
    "",
    fill(copy.expiry, values),
    "",
    copy.ignore,
  ].join("\n");

  return {
    subject: fill(copy.subject, values),
    text,
    html: renderHtml(input, copy, values),
  };
}
