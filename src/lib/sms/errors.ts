export type SmsErrorCode =
  | "not_configured"
  | "auth_failed"
  | "send_failed"
  | "timeout"
  | "busy";

/** Safe transport error. The message never includes credentials, session ids, or OTP text. */
export class SmsTransportError extends Error {
  readonly code: SmsErrorCode;

  constructor(code: SmsErrorCode) {
    super(`SMS transport failed: ${code}`);
    this.name = "SmsTransportError";
    this.code = code;
  }
}
