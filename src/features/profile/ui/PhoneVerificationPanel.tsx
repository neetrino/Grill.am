"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";

import {
  requestPhoneVerificationAction,
  verifyPhoneOtpAction,
  type PhoneVerificationConfirmState,
  type PhoneVerificationRequestState,
} from "@/features/auth/phone-verification-actions";
import { OtpCodeInput } from "@/features/auth/ui/OtpCodeInput";
import {
  PROFILE_BTN_PRIMARY_CLASS,
  PROFILE_BTN_SECONDARY_CLASS,
} from "@/features/profile/ui/profile-ui";

type PhoneVerificationCopy = {
  verified: string;
  unverified: string;
  hint: string;
  send: string;
  sending: string;
  codeLabel: string;
  confirm: string;
  confirming: string;
  resend: string;
  resendIn: string;
  sent: string;
  success: string;
  invalidCode: string;
  rateLimited: string;
  missingPhone: string;
  genericError: string;
};

type PhoneVerificationPanelProps = {
  locale: string;
  phone: string;
  phoneVerified: boolean;
  copy: PhoneVerificationCopy;
};

const requestInitial: PhoneVerificationRequestState = {
  status: "idle",
  formKey: 0,
};
const confirmInitial: PhoneVerificationConfirmState = { status: "idle" };

export function PhoneVerificationPanel({
  locale,
  phone,
  phoneVerified,
  copy,
}: PhoneVerificationPanelProps) {
  const requestAction = requestPhoneVerificationAction.bind(null, locale);
  const confirmAction = verifyPhoneOtpAction.bind(null, locale);
  const [requestState, submitRequest, requestPending] = useActionState(
    requestAction,
    requestInitial,
  );
  const [confirmState, submitConfirm, confirmPending] = useActionState(
    confirmAction,
    confirmInitial,
  );
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [countdownKey, setCountdownKey] = useState<number | null>(null);
  const [syncedPhone, setSyncedPhone] = useState(phone);
  const verified =
    phoneVerified ||
    requestState.status === "verified" ||
    confirmState.status === "verified";

  if (phone !== syncedPhone) {
    setSyncedPhone(phone);
    setCode("");
    setSecondsLeft(0);
    setCountdownKey(null);
  }

  const sent = requestState.status === "sent" && !verified;
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

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      <p
        className={`text-sm font-semibold ${verified ? "text-green-700" : "text-gray-600"}`}
      >
        {verified ? copy.verified : copy.unverified}
      </p>
      {verified ? (
        <p className="mt-2 text-sm text-green-700" role="status">
          {copy.success}
        </p>
      ) : (
        <p className="mt-2 text-sm text-gray-500">{copy.hint}</p>
      )}

      {!verified && sent ? (
        <form action={submitConfirm} className="mt-4 max-w-md space-y-4">
          <input type="hidden" name="code" value={code} />
          <p className="text-sm text-gray-700" role="status">
            {copy.sent}
          </p>
          <OtpCodeInput
            value={code}
            onChange={setCode}
            disabled={confirmPending}
            invalid={confirmState.errorCode === "invalid_code"}
            label={copy.codeLabel}
          />
          {confirmState.errorCode ? (
            <p className="text-sm text-red-700" role="alert">
              {confirmErrorText(copy, confirmState.errorCode)}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={confirmPending || code.length !== 6}
              className={`${PROFILE_BTN_PRIMARY_CLASS} inline-flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {confirmPending ? copy.confirming : copy.confirm}
            </button>
            <button
              type="submit"
              formAction={submitRequest}
              disabled={requestPending || secondsLeft > 0}
              className={`${PROFILE_BTN_SECONDARY_CLASS} inline-flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {secondsLeft > 0
                ? copy.resendIn.replace("{seconds}", String(secondsLeft))
                : copy.resend}
            </button>
          </div>
        </form>
      ) : null}

      {!verified && !sent ? (
        <form action={submitRequest} className="mt-4">
          {requestState.errorCode ? (
            <p className="mb-3 text-sm text-red-700" role="alert">
              {requestErrorText(copy, requestState.errorCode)}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={requestPending || phone.trim().length === 0}
            className={`${PROFILE_BTN_SECONDARY_CLASS} inline-flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {requestPending ? copy.sending : copy.send}
          </button>
        </form>
      ) : null}
    </div>
  );
}

function requestErrorText(
  copy: PhoneVerificationCopy,
  code: PhoneVerificationRequestState["errorCode"],
): string {
  if (code === "rate_limited") return copy.rateLimited;
  if (code === "phone_missing") return copy.missingPhone;
  return copy.genericError;
}

function confirmErrorText(
  copy: PhoneVerificationCopy,
  code: PhoneVerificationConfirmState["errorCode"],
): string {
  if (code === "rate_limited") return copy.rateLimited;
  if (code === "invalid_code") return copy.invalidCode;
  return copy.genericError;
}
