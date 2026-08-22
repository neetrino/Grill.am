import "server-only";

import { formatArcaAmountParam } from "@/lib/payments/arca/amount";
import {
  isFormUrlHostAllowed,
  requireArcaConfig,
  resolveRegisterPath,
  type ArcaRuntimeConfig,
  ARCA_STATUS_PATH,
  ARCA_REVERSE_PATH,
  ARCA_REFUND_PATH,
} from "@/lib/payments/arca/config";
import {
  ArcaBusinessError,
  ArcaFormUrlRejectedError,
  ArcaHttpError,
  ArcaMalformedResponseError,
} from "@/lib/payments/arca/errors";
import { logger } from "@/lib/observability/logger";
import {
  redactProviderReference,
  sanitizeArcaErrorMessage,
} from "@/lib/payments/arca/redaction";
import {
  arcaMutationResponseSchema,
  arcaRegisterResponseSchema,
  arcaStatusResponseSchema,
  isArcaSystemOk,
  normalizeErrorCode,
  type ArcaStatusResponse,
} from "@/lib/payments/arca/schemas";
import { ARCA_REQUEST_ACCEPT, postArca } from "@/lib/payments/arca/transport";
import type {
  ArcaClientRefundInput,
  ArcaClientRegisterInput,
  ArcaClientRegisterResult,
  ArcaClientReverseInput,
  ArcaClientStatusInput,
} from "@/lib/payments/arca/types";
import {
  createMockArcaPaymentClient,
  isArcaMockModeEnabled,
} from "@/lib/payments/arca/mock-client";

export type ArcaPaymentClient = {
  register(
    input: ArcaClientRegisterInput,
  ): Promise<ArcaClientRegisterResult>;
  getOrderStatusExtended(
    input: ArcaClientStatusInput,
  ): Promise<ArcaStatusResponse>;
  reverse(input: ArcaClientReverseInput): Promise<void>;
  refund(input: ArcaClientRefundInput): Promise<void>;
};

export { ARCA_REQUEST_ACCEPT };

/** Coolify/ops grep key — keep this exact message. */
const ARCA_REGISTER_RESPONSE_LOG = "ARCA register response";

function formUrlHost(formUrl: string | undefined): string | undefined {
  if (!formUrl) {
    return undefined;
  }
  try {
    return new URL(formUrl).host;
  } catch {
    return undefined;
  }
}

function logArcaRegisterResponse(args: {
  httpStatus?: number;
  errorCode: string | null;
  errorMessage?: string;
  orderId?: string;
  formUrl?: string;
}): void {
  const fields = {
    provider: "arca",
    httpStatus: args.httpStatus,
    errorCode: args.errorCode,
    errorMessage: args.errorMessage,
    orderId: redactProviderReference(args.orderId),
    formUrlHost: formUrlHost(args.formUrl),
    hasOrderId: Boolean(args.orderId),
    hasFormUrl: Boolean(args.formUrl),
  };
  if (args.errorCode && args.errorCode !== "0") {
    logger.warn(ARCA_REGISTER_RESPONSE_LOG, fields);
    return;
  }
  logger.info(ARCA_REGISTER_RESPONSE_LOG, fields);
}

function interpretRegisterPayload(
  raw: unknown,
  allowedFormHosts: readonly string[],
): ArcaClientRegisterResult {
  const parsed = arcaRegisterResponseSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn(ARCA_REGISTER_RESPONSE_LOG, {
      provider: "arca",
      errorCode: "ARCA_MALFORMED_RESPONSE",
    });
    throw new ArcaMalformedResponseError();
  }

  const data = parsed.data;
  const errorCode = normalizeErrorCode(data.errorCode);
  const errorMessage = sanitizeArcaErrorMessage(data.errorMessage);
  logArcaRegisterResponse({
    httpStatus: 200,
    errorCode,
    errorMessage,
    orderId: data.orderId,
    formUrl: data.formUrl,
  });

  if (!isArcaSystemOk(data.errorCode)) {
    throw new ArcaBusinessError(
      errorCode ?? "unknown",
      "ARCA registration was rejected.",
      errorMessage,
    );
  }

  if (!data.orderId || !data.formUrl) {
    throw new ArcaMalformedResponseError();
  }

  if (!isFormUrlHostAllowed(data.formUrl, allowedFormHosts)) {
    logger.error("arca.form_url_rejected", {
      provider: "arca",
      providerReference: redactProviderReference(data.orderId),
    });
    throw new ArcaFormUrlRejectedError();
  }

  return {
    providerOrderId: data.orderId,
    formUrl: data.formUrl,
  };
}

function interpretMutationPayload(
  raw: unknown,
  operation: "reverse" | "refund",
): void {
  const parsed = arcaMutationResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ArcaMalformedResponseError();
  }

  const errorCode = normalizeErrorCode(parsed.data.errorCode);
  const errorMessage = sanitizeArcaErrorMessage(parsed.data.errorMessage);
  if (!isArcaSystemOk(parsed.data.errorCode)) {
    logger.warn("arca.mutation_rejected", {
      provider: "arca",
      operation,
      errorCode,
    });
    throw new ArcaBusinessError(
      errorCode ?? "unknown",
      `ARCA ${operation} was rejected.`,
      errorMessage,
    );
  }
}

/**
 * Official ARCA EPG REST client (Merchant Manual §7).
 * Never logs credentials or raw card data.
 * When E2E_PROVIDER_MODE=mock (non-production), returns the mock client.
 */
export function createArcaPaymentClient(
  config: ArcaRuntimeConfig = requireArcaConfig(),
): ArcaPaymentClient {
  if (isArcaMockModeEnabled()) {
    return createMockArcaPaymentClient();
  }

  return {
    async register(input) {
      const path = resolveRegisterPath(config.paymentMode);
      let raw: unknown;
      try {
        raw = await postArca(config, path, {
          userName: config.username,
          password: config.password,
          orderNumber: input.orderNumber,
          amount: formatArcaAmountParam(input.amountMinorUnits),
          currency: input.currencyCode,
          returnUrl: input.returnUrl,
          language: input.language ?? config.language,
          description: input.description,
          pageView: input.pageView,
          jsonParams: input.jsonParams
            ? JSON.stringify(input.jsonParams)
            : undefined,
          sessionTimeoutSecs:
            input.sessionTimeoutSecs != null
              ? String(input.sessionTimeoutSecs)
              : undefined,
        });
      } catch (error) {
        if (error instanceof ArcaHttpError) {
          logArcaRegisterResponse({
            httpStatus: error.httpStatus,
            errorCode: error.code,
            errorMessage: error.httpStatusText,
          });
        }
        throw error;
      }

      return interpretRegisterPayload(raw, config.allowedFormHosts);
    },

    async getOrderStatusExtended(input) {
      if (!input.orderId && !input.orderNumber) {
        throw new ArcaMalformedResponseError();
      }

      const raw = await postArca(config, ARCA_STATUS_PATH, {
        userName: config.username,
        password: config.password,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        language: input.language ?? config.language,
      });

      const parsed = arcaStatusResponseSchema.safeParse(raw);
      if (!parsed.success) {
        throw new ArcaMalformedResponseError();
      }

      const data = parsed.data;
      if (!isArcaSystemOk(data.errorCode)) {
        throw new ArcaBusinessError(
          normalizeErrorCode(data.errorCode) ?? "unknown",
          "ARCA status query was rejected.",
        );
      }

      return data;
    },

    async reverse(input) {
      const raw = await postArca(config, ARCA_REVERSE_PATH, {
        userName: config.username,
        password: config.password,
        orderId: input.orderId,
        language: input.language ?? config.language,
      });
      interpretMutationPayload(raw, "reverse");
    },

    async refund(input) {
      const raw = await postArca(config, ARCA_REFUND_PATH, {
        userName: config.username,
        password: config.password,
        orderId: input.orderId,
        amount: formatArcaAmountParam(input.amountMinorUnits),
        currency: config.currencyCode,
        language: input.language ?? config.language,
      });
      interpretMutationPayload(raw, "refund");
    },
  };
}
