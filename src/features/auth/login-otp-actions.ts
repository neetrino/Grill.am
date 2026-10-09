"use server";

import { redirect } from "next/navigation";

import { requestLoginOtp, verifyLoginOtp } from "@/lib/auth/otp/flow";
import { createOtpFlowDeps } from "@/lib/auth/otp/runtime";
import { createSession } from "@/lib/auth/session";
import { resolveSafeNextPath } from "@/lib/auth/post-login-path";
import { getRequestClientIp } from "@/lib/http/client-ip";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { normalizePhoneToE164 } from "@/lib/phone/normalize";

export type LoginOtpRequestState = {
  status: "idle" | "sent" | "error";
  errorCode?: "invalid_phone" | "rate_limited" | "unavailable" | "generic";
  phone?: string;
  formKey: number;
};

export type LoginOtpVerifyState = {
  errorCode?: "invalid_code" | "rate_limited" | "generic";
};

export async function requestLoginOtpAction(
  localeInput: string,
  _previous: LoginOtpRequestState,
  formData: FormData,
): Promise<LoginOtpRequestState> {
  const locale = resolveLocale(localeInput);
  const phoneRaw = String(formData.get("phone") ?? "");
  const deps = createOtpFlowDeps(locale, async () => {});
  if (!deps) {
    return errorRequest("generic");
  }

  const result = await requestLoginOtp(deps, {
    phone: phoneRaw,
    ip: await getRequestClientIp(),
  });
  if (!result.ok) {
    return errorRequest(
      result.code === "invalid_phone" ||
        result.code === "rate_limited" ||
        result.code === "unavailable"
        ? result.code
        : "generic",
    );
  }

  return {
    status: "sent",
    phone: normalizePhoneToE164(phoneRaw) ?? undefined,
    formKey: Date.now(),
  };
}

export async function verifyLoginOtpAction(
  localeInput: string,
  _previous: LoginOtpVerifyState,
  formData: FormData,
): Promise<LoginOtpVerifyState> {
  const locale = resolveLocale(localeInput);
  const rememberMe = formData.get("rememberMe") === "on";
  const deps = createOtpFlowDeps(locale, async (userId) => {
    await createSession(userId, { rememberMe });
  });
  if (!deps) {
    return { errorCode: "generic" };
  }

  const result = await verifyLoginOtp(deps, {
    phone: String(formData.get("phone") ?? ""),
    code: String(formData.get("code") ?? ""),
    ip: await getRequestClientIp(),
  });
  if (!result.ok) {
    return {
      errorCode:
        result.code === "rate_limited" ? "rate_limited" : "invalid_code",
    };
  }

  if (result.isNewUser) {
    redirect(`/${locale}/profile/personal-information`);
  }

  redirect(resolveSafeNextPath(locale, result.role, formData.get("next")));
}

function resolveLocale(localeInput: string): Locale {
  return isLocale(localeInput) ? localeInput : defaultLocale;
}

function errorRequest(
  errorCode: NonNullable<LoginOtpRequestState["errorCode"]>,
): LoginOtpRequestState {
  return { status: "error", errorCode, formKey: Date.now() };
}
