import "server-only";

import { NextResponse } from "next/server";

import { processIdramConfirmation } from "@/features/payments/providers/idram/process-idram-confirmation";
import { processIdramPrecheck } from "@/features/payments/providers/idram/process-idram-precheck";
import { consumeRateLimit } from "@/features/payments/providers/arca/rate-limit";
import { requireIdramConfig } from "@/lib/payments/idram/config";
import { isIdramProtocolError } from "@/lib/payments/idram/errors";
import { logger } from "@/lib/observability/logger";
import {
  formDataToRecord,
  idramConfirmationSchema,
  idramPrecheckSchema,
} from "@/lib/payments/idram/schemas";
import { IDRAM_RESULT_FAIL_BODY } from "@/lib/payments/idram/types";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
};

const MAX_BODY_BYTES = 16_384;

function plainText(body: string, status = 200): NextResponse {
  return new NextResponse(body, {
    status,
    headers: {
      ...NO_STORE,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

/**
 * Shared RESULT_URL handler for modern and legacy WooCommerce paths.
 * Official protocol: POST only; exact plain-text OK/NO; never redirects.
 */
export async function handleIdramResultPost(
  request: Request,
): Promise<NextResponse> {
  try {
    requireIdramConfig();
  } catch {
    return plainText(IDRAM_RESULT_FAIL_BODY);
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const clientKey = forwarded?.split(",")[0]?.trim() || "idram-result";
  const rate = consumeRateLimit({
    key: `idram:result:${clientKey}`,
    limit: 120,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return plainText(IDRAM_RESULT_FAIL_BODY, 429);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return plainText(IDRAM_RESULT_FAIL_BODY);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return plainText(IDRAM_RESULT_FAIL_BODY);
  }

  let record: Record<string, string>;
  try {
    record = formDataToRecord(form);
  } catch {
    return plainText(IDRAM_RESULT_FAIL_BODY);
  }

  try {
    if (record.EDP_PRECHECK === "YES") {
      const parsed = idramPrecheckSchema.safeParse(record);
      if (!parsed.success) {
        return plainText(IDRAM_RESULT_FAIL_BODY);
      }
      const body = await processIdramPrecheck(parsed.data);
      return plainText(body);
    }

    const parsed = idramConfirmationSchema.safeParse(record);
    if (!parsed.success) {
      return plainText(IDRAM_RESULT_FAIL_BODY);
    }
    const body = await processIdramConfirmation(parsed.data);
    return plainText(body);
  } catch (error) {
    logger.error("idram.result.error", {
      provider: "idram",
      errorCode: isIdramProtocolError(error)
        ? error.code
        : "IDRAM_RESULT_ERROR",
    });
    return plainText(IDRAM_RESULT_FAIL_BODY);
  }
}

/** Reject non-POST methods — official protocol is POST only. */
export function handleIdramResultMethodNotAllowed(): NextResponse {
  return plainText(IDRAM_RESULT_FAIL_BODY, 405);
}
