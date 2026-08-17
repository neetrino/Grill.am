import "server-only";

import { getEnv } from "@/config/env";
import { pendingTimeoutMsFromMinutes } from "@/features/payments/domain/payment-job-settings";

/** Local ARCA PENDING attempt TTL from `PAYMENT_PENDING_TIMEOUT_MINUTES`. */
export function getArcaPendingTimeoutMs(): number {
  return pendingTimeoutMsFromMinutes(getEnv().PAYMENT_PENDING_TIMEOUT_MINUTES);
}
