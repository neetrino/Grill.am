"use server";

import { revalidatePath } from "next/cache";

import { requestPhoneVerification, verifyPhoneOtp } from "@/lib/auth/otp/flow";
import { createOtpFlowDeps } from "@/lib/auth/otp/runtime";
import { requireUser } from "@/lib/auth/policies";
import { getRequestClientIp } from "@/lib/http/client-ip";
import { isLocale, type Locale } from "@/lib/i18n/config";

export type PhoneVerificationRequestState = {
  status: "idle" | "sent" | "verified" | "error";
  errorCode?: "rate_limited" | "phone_missing" | "generic";
  formKey: number;
};

export type PhoneVerificationConfirmState = {
  status: "idle" | "verified" | "error";
  errorCode?: "invalid_code" | "rate_limited" | "generic";
};

export async function requestPhoneVerificationAction(
  localeInput: string,
  previousState: PhoneVerificationRequestState,
): Promise<PhoneVerificationRequestState> {
  void previousState;
  const locale = parseLocale(localeInput);
  if (!locale) {
    return { status: "error", errorCode: "generic", formKey: Date.now() };
  }

  const user = await requireUser(locale);
  const deps = createOtpFlowDeps(locale, async () => {});
  if (!deps) {
    return { status: "error", errorCode: "generic", formKey: Date.now() };
  }

  const result = await requestPhoneVerification(deps, {
    userId: user.id,
    ip: await getRequestClientIp(),
  });
  if (result.ok && result.code === "already_verified") {
    return { status: "verified", formKey: Date.now() };
  }
  if (!result.ok) {
    return {
      status: "error",
      errorCode:
        result.code === "rate_limited" || result.code === "phone_missing"
          ? result.code
          : "generic",
      formKey: Date.now(),
    };
  }

  return { status: "sent", formKey: Date.now() };
}

export async function verifyPhoneOtpAction(
  localeInput: string,
  _previous: PhoneVerificationConfirmState,
  formData: FormData,
): Promise<PhoneVerificationConfirmState> {
  const locale = parseLocale(localeInput);
  if (!locale) {
    return { status: "error", errorCode: "generic" };
  }

  const user = await requireUser(locale);
  const deps = createOtpFlowDeps(locale, async () => {});
  if (!deps) {
    return { status: "error", errorCode: "generic" };
  }

  const result = await verifyPhoneOtp(deps, {
    userId: user.id,
    code: String(formData.get("code") ?? ""),
    ip: await getRequestClientIp(),
  });
  if (!result.ok) {
    return {
      status: "error",
      errorCode: result.code === "rate_limited" ? "rate_limited" : "invalid_code",
    };
  }

  revalidatePath(`/${locale}/profile`);
  revalidatePath(`/${locale}/profile/personal-information`);
  return { status: "verified" };
}

function parseLocale(localeInput: string): Locale | null {
  return isLocale(localeInput) ? localeInput : null;
}
