import type { Locale } from "@/lib/i18n/config";

const OTP_SMS_TEXT: Record<Locale, (code: string) => string> = {
  en: (code) => `Grill.am verification code: ${code}. Valid for 5 minutes.`,
  hy: (code) => `Grill.am հաստատման կոդ՝ ${code}. Վավեր է 5 րոպե։`,
  ru: (code) => `Код Grill.am: ${code}. Действителен 5 минут.`,
};

/** Short transactional SMS. Does not include the customer's name or other data. */
export function buildOtpSmsText(locale: Locale, code: string): string {
  return OTP_SMS_TEXT[locale](code);
}
