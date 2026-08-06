export type EmailDeliveryResult =
  | {
      ok: true;
      providerMessageId: string;
    }
  | {
      ok: false;
      retryable: boolean;
      errorCode: string;
      safeMessage: string;
    };

export type OutboxEmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Passed to providers that support idempotent send. */
  idempotencyKey?: string;
};

export type EmailDeliveryProvider = {
  readonly name: string;
  send(message: OutboxEmailMessage): Promise<EmailDeliveryResult>;
};
