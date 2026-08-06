import "server-only";

import {
  formatArcaAmountParam,
} from "@/lib/payments/arca/amount";
import {
  isFormUrlHostAllowed,
  requireArcaConfig,
  resolveRegisterPath,
  type ArcaRuntimeConfig,
  ARCA_STATUS_PATH,
} from "@/lib/payments/arca/config";
import {
  ArcaBusinessError,
  ArcaFormUrlRejectedError,
  ArcaHttpError,
  ArcaMalformedResponseError,
  ArcaTimeoutError,
} from "@/lib/payments/arca/errors";
import { logger } from "@/lib/observability/logger";
import { redactProviderReference } from "@/lib/payments/arca/redaction";
import {
  arcaRegisterResponseSchema,
  arcaStatusResponseSchema,
  isArcaSystemOk,
  normalizeErrorCode,
  type ArcaStatusResponse,
} from "@/lib/payments/arca/schemas";
import type {
  ArcaClientRegisterInput,
  ArcaClientRegisterResult,
  ArcaClientStatusInput,
} from "@/lib/payments/arca/types";
import { createMockArcaPaymentClient, isArcaMockModeEnabled } from "@/lib/payments/arca/mock-client";

export type ArcaPaymentClient = {
  register(
    input: ArcaClientRegisterInput,
  ): Promise<ArcaClientRegisterResult>;
  getOrderStatusExtended(
    input: ArcaClientStatusInput,
  ): Promise<ArcaStatusResponse>;
};

function buildFormBody(
  fields: Record<string, string | undefined>,
): URLSearchParams {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      body.set(key, value);
    }
  }
  return body;
}

async function postArca(
  config: ArcaRuntimeConfig,
  path: string,
  fields: Record<string, string | undefined>,
): Promise<unknown> {
  const url = `${config.apiBaseUrl}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    config.requestTimeoutMs,
  );

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        Accept: "application/json",
        "Cache-Control": "no-store",
      },
      body: buildFormBody(fields),
      signal: controller.signal,
      redirect: "error",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new ArcaHttpError(response.status);
    }

    const text = await response.text();
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new ArcaMalformedResponseError();
    }
  } catch (error) {
    if (error instanceof ArcaHttpError || error instanceof ArcaMalformedResponseError) {
      throw error;
    }
    if (
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("aborted"))
    ) {
      throw new ArcaTimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timeout);
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
      const raw = await postArca(config, path, {
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

      const parsed = arcaRegisterResponseSchema.safeParse(raw);
      if (!parsed.success) {
        throw new ArcaMalformedResponseError();
      }

      const data = parsed.data;
      const errorCode = normalizeErrorCode(data.errorCode);

      if (!isArcaSystemOk(data.errorCode)) {
        throw new ArcaBusinessError(
          errorCode ?? "unknown",
          "ARCA registration was rejected.",
        );
      }

      if (!data.orderId || !data.formUrl) {
        throw new ArcaMalformedResponseError();
      }

      if (!isFormUrlHostAllowed(data.formUrl, config.allowedFormHosts)) {
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
  };
}
