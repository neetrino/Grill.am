/** Shared Poster Gate auth form visuals — login and register use the same chrome. */

export const AUTH_CARD_CLASS =
  "rounded-[18px] bg-white p-5 shadow-[0_28px_90px_rgba(7,16,20,0.18)] sm:rounded-[22px] sm:p-7 lg:p-8";

export const AUTH_TITLE_CLASS =
  "text-xl font-black tracking-tight text-brand-ink uppercase";

export const AUTH_FIELD_CLASS =
  "min-h-12 w-full rounded-[20px] border-[2px] border-brand-ink/12 bg-brand-cream/35 px-4 py-3 text-base leading-normal text-brand-ink outline-none transition placeholder:text-brand-ink/45 hover:border-brand-ink/25 hover:bg-white/80 focus:border-brand-red focus:bg-white focus:ring-0";

export const AUTH_FIELD_INVALID_CLASS =
  "border-brand-red bg-red-50/40 focus:border-brand-red";

export const AUTH_PASSWORD_FIELD_CLASS = `${AUTH_FIELD_CLASS} pr-11`;

export const AUTH_BTN_PRIMARY_CLASS =
  "inline-flex h-12 w-full items-center justify-center rounded-[20px] border-0 bg-brand-red px-6 text-sm font-black tracking-[0.12em] text-white uppercase transition hover:bg-brand-red-hot focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/40 focus-visible:ring-offset-2 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50";

export const AUTH_CHECKBOX_CLASS =
  "size-4 shrink-0 rounded border-brand-ink/20 bg-white text-brand-red accent-brand-red focus:ring-brand-yellow/40";

export const AUTH_LINK_CLASS =
  "font-bold text-brand-red underline-offset-2 transition hover:text-brand-red-hot hover:underline";

export function authFieldClassName(invalid: boolean, password = false): string {
  const base = password ? AUTH_PASSWORD_FIELD_CLASS : AUTH_FIELD_CLASS;
  return invalid ? `${base} ${AUTH_FIELD_INVALID_CLASS}` : base;
}
