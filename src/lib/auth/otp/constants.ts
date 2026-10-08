export const OTP_PURPOSES = ["LOGIN", "VERIFY_PHONE"] as const;

export type OtpPurpose = (typeof OTP_PURPOSES)[number];

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_SEND_PHONE_LIMIT = 5;
export const OTP_SEND_PHONE_WINDOW_SECONDS = 15 * 60;
export const OTP_SEND_IP_LIMIT = 20;
export const OTP_SEND_IP_WINDOW_SECONDS = 15 * 60;
export const OTP_VERIFY_PHONE_LIMIT = 15;
export const OTP_VERIFY_PHONE_WINDOW_SECONDS = 15 * 60;
export const OTP_VERIFY_IP_LIMIT = 40;
export const OTP_VERIFY_IP_WINDOW_SECONDS = 15 * 60;

export type OtpRateLimitConfig = {
  sendPhoneLimit: number;
  sendPhoneWindowSeconds: number;
  sendIpLimit: number;
  sendIpWindowSeconds: number;
  verifyPhoneLimit: number;
  verifyPhoneWindowSeconds: number;
  verifyIpLimit: number;
  verifyIpWindowSeconds: number;
  resendCooldownSeconds: number;
};

export const DEFAULT_OTP_RATE_LIMITS: OtpRateLimitConfig = {
  sendPhoneLimit: OTP_SEND_PHONE_LIMIT,
  sendPhoneWindowSeconds: OTP_SEND_PHONE_WINDOW_SECONDS,
  sendIpLimit: OTP_SEND_IP_LIMIT,
  sendIpWindowSeconds: OTP_SEND_IP_WINDOW_SECONDS,
  verifyPhoneLimit: OTP_VERIFY_PHONE_LIMIT,
  verifyPhoneWindowSeconds: OTP_VERIFY_PHONE_WINDOW_SECONDS,
  verifyIpLimit: OTP_VERIFY_IP_LIMIT,
  verifyIpWindowSeconds: OTP_VERIFY_IP_WINDOW_SECONDS,
  resendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
};
