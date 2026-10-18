export type SendSmsInput = {
  /** Canonical E.164 destination. Provider code converts it for the vendor. */
  to: string;
  text: string;
  /** Optional provider reference. MOBIPACE expects a UUID when present. */
  reference?: string;
};

export type SmsProvider = {
  readonly name: string;
  sendSms(input: SendSmsInput): Promise<void>;
};
