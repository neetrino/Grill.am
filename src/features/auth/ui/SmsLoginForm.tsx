"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";

import { AppLink } from "@/components/ui/AppLink";
import {
  requestLoginOtpAction,
  verifyLoginOtpAction,
  type LoginOtpRequestState,
  type LoginOtpVerifyState,
} from "@/features/auth/login-otp-actions";
import { AuthTermsAgreement } from "@/features/auth/ui/AuthTermsAgreement";
import { OtpCodeInput } from "@/features/auth/ui/OtpCodeInput";
import {
  AUTH_BTN_PRIMARY_CLASS,
  AUTH_CHECKBOX_CLASS,
  AUTH_LINK_CLASS,
  authFieldClassName,
} from "@/features/auth/ui/auth-ui";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

const requestInitial: LoginOtpRequestState = { status: "idle", formKey: 0 };
const verifyInitial: LoginOtpVerifyState = {};

type SmsLoginFormProps = {
  locale: Locale;
  dictionary: Dictionary["auth"];
  nextPath: string | null;
  /** Login keeps SMS sign-in; register is the entry for new phone signup. */
  intent: "login" | "register";
  alternateHref: string;
};

export function SmsLoginForm({
  locale,
  dictionary,
  nextPath,
  intent,
  alternateHref,
}: SmsLoginFormProps) {
  const requestAction = requestLoginOtpAction.bind(null, locale);
  const verifyAction = verifyLoginOtpAction.bind(null, locale);
  const [requestState, submitRequest, requestPending] = useActionState(
    requestAction,
    requestInitial,
  );
  const [verifyState, submitVerify, verifyPending] = useActionState(
    verifyAction,
    verifyInitial,
  );
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [countdownKey, setCountdownKey] = useState<number | null>(null);
  const sent = requestState.status === "sent" && Boolean(requestState.phone);
  const isRegister = intent === "register";

  if (sent && requestState.formKey !== countdownKey) {
    setCountdownKey(requestState.formKey);
    setSecondsLeft(60);
    setCode("");
  }

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setSecondsLeft((value) => value - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const requestError = requestErrorText(dictionary, requestState.errorCode);
  const verifyError = verifyErrorText(dictionary, verifyState.errorCode);
  const submitLabel = isRegister
    ? verifyPending
      ? dictionary.smsRegistering
      : dictionary.smsRegister
    : verifyPending
      ? dictionary.smsSigningIn
      : dictionary.smsSignIn;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-center text-sm leading-relaxed text-brand-ink/50">
        {isRegister ? dictionary.registerSubtitle : dictionary.loginSubtitle}
      </p>

      {sent ? (
        <form
          key={`sms-verify-${requestState.formKey}`}
          action={submitVerify}
          className="flex flex-col gap-5"
        >
          <input
            type="hidden"
            name="phone"
            value={requestState.phone ?? ""}
          />
          <input type="hidden" name="code" value={code} />
          {nextPath ? (
            <input type="hidden" name="next" value={nextPath} />
          ) : null}
          <p role="status" className="text-sm leading-relaxed text-brand-ink/70">
            {isRegister
              ? dictionary.smsRegisterSent.replace(
                  "{phone}",
                  requestState.phone ?? "",
                )
              : dictionary.smsSent}
          </p>
          <OtpCodeInput
            value={code}
            onChange={setCode}
            disabled={verifyPending}
            invalid={Boolean(verifyError)}
            label={dictionary.smsCodeLabel}
          />
          {verifyError ? <Alert message={verifyError} /> : null}
          <label className="flex items-center gap-2.5 text-sm font-semibold text-brand-ink/75">
            <input
              type="checkbox"
              name="rememberMe"
              value="on"
              defaultChecked
              className={AUTH_CHECKBOX_CLASS}
            />
            {dictionary.rememberMe}
          </label>
          <button
            type="submit"
            disabled={verifyPending || code.length !== 6}
            aria-busy={verifyPending}
            className={AUTH_BTN_PRIMARY_CLASS}
          >
            {submitLabel}
          </button>
          <button
            type="submit"
            formAction={submitRequest}
            disabled={requestPending || secondsLeft > 0}
            className="text-sm font-bold text-brand-red disabled:cursor-not-allowed disabled:opacity-50"
          >
            {secondsLeft > 0
              ? dictionary.smsResendIn.replace("{seconds}", String(secondsLeft))
              : dictionary.smsResend}
          </button>
        </form>
      ) : (
        <form
          key="sms-request"
          action={submitRequest}
          className="flex flex-col gap-5"
        >
          <input
            required
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            autoFocus
            placeholder={dictionary.smsPhonePlaceholder}
            aria-label={dictionary.smsPhoneLabel}
            aria-invalid={requestState.errorCode === "invalid_phone"}
            className={authFieldClassName(
              requestState.errorCode === "invalid_phone",
            )}
          />
          {isRegister ? (
            <AuthTermsAgreement locale={locale} dictionary={dictionary} />
          ) : null}
          {requestError ? <Alert message={requestError} /> : null}
          <button
            type="submit"
            disabled={requestPending}
            aria-busy={requestPending}
            className={AUTH_BTN_PRIMARY_CLASS}
          >
            {requestPending ? dictionary.smsSending : dictionary.smsSendCode}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-brand-ink/60">
        {isRegister ? dictionary.hasAccount : dictionary.noAccount}{" "}
        <AppLink
          href={alternateHref}
          prefetchPolicy="intent"
          className={AUTH_LINK_CLASS}
        >
          {isRegister ? dictionary.signInLink : dictionary.registerLink}
        </AppLink>
      </p>
    </div>
  );
}

function Alert({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-[10px] border-2 border-red-700 bg-red-50 p-3 text-sm font-medium text-red-800"
    >
      {message}
    </p>
  );
}

function requestErrorText(
  dictionary: Dictionary["auth"],
  code: LoginOtpRequestState["errorCode"],
): string | null {
  if (code === "invalid_phone") return dictionary.smsInvalidPhone;
  if (code === "rate_limited") return dictionary.smsRateLimited;
  if (code === "unavailable") return dictionary.smsSendFailed;
  if (code === "generic") return dictionary.smsGenericError;
  return null;
}

function verifyErrorText(
  dictionary: Dictionary["auth"],
  code: LoginOtpVerifyState["errorCode"],
): string | null {
  if (code === "invalid_code") return dictionary.smsInvalidCode;
  if (code === "rate_limited") return dictionary.smsRateLimited;
  if (code === "generic") return dictionary.smsGenericError;
  return null;
}
