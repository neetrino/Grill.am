import "server-only";

import type { ArcaRuntimeConfig } from "@/lib/payments/arca/config";
import {
  ArcaHttpError,
  ArcaMalformedResponseError,
  ArcaTimeoutError,
} from "@/lib/payments/arca/errors";
import { logger } from "@/lib/observability/logger";

/**
 * ARCA returns JSON as `text/plain`. `Accept: application/json` triggers HTTP 406
 * on the production gateway (WebLogic content negotiation).
 */
export const ARCA_REQUEST_ACCEPT = "*/*";

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

/** Official EPG form POST. Never logs credentials or raw card data. */
export async function postArca(
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
        Accept: ARCA_REQUEST_ACCEPT,
        "Cache-Control": "no-store",
      },
      body: buildFormBody(fields),
      signal: controller.signal,
      redirect: "error",
      cache: "no-store",
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      logger.warn("arca.http_error", {
        provider: "arca",
        endpointPath: path,
        httpStatus: response.status,
        httpStatusText: response.statusText || undefined,
        responseContentType: contentType,
      });
      throw new ArcaHttpError({
        httpStatus: response.status,
        httpStatusText: response.statusText || undefined,
        responseContentType: contentType,
        endpointPath: path,
      });
    }

    const text = await response.text();
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new ArcaMalformedResponseError();
    }
  } catch (error) {
    if (
      error instanceof ArcaHttpError ||
      error instanceof ArcaMalformedResponseError
    ) {
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
