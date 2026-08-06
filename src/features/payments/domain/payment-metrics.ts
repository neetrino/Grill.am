/**
 * Lightweight provider-independent payment metrics.
 * Implementations may no-op; labels stay low-cardinality.
 */

export type PaymentMetricLabels = {
  provider?: string;
  operation?: string;
  normalizedStatus?: string;
  environment?: string;
  resultClass?: string;
};

export type PaymentMetrics = {
  increment(name: string, labels?: PaymentMetricLabels): void;
  observeDurationMs(
    name: string,
    durationMs: number,
    labels?: PaymentMetricLabels,
  ): void;
};

type CounterKey = string;

const counters = new Map<CounterKey, number>();
const durations: Array<{
  name: string;
  durationMs: number;
  labels: PaymentMetricLabels;
}> = [];

function keyOf(name: string, labels?: PaymentMetricLabels): CounterKey {
  return [
    name,
    labels?.provider ?? "",
    labels?.operation ?? "",
    labels?.normalizedStatus ?? "",
    labels?.environment ?? "",
    labels?.resultClass ?? "",
  ].join("|");
}

/** In-process metrics sink (ops summary / tests). Replace later with OTel. */
export const paymentMetrics: PaymentMetrics = {
  increment(name, labels = {}) {
    const key = keyOf(name, labels);
    counters.set(key, (counters.get(key) ?? 0) + 1);
  },
  observeDurationMs(name, durationMs, labels = {}) {
    durations.push({ name, durationMs, labels });
    if (durations.length > 500) {
      durations.splice(0, durations.length - 500);
    }
  },
};

export function resetPaymentMetricsForTests(): void {
  counters.clear();
  durations.length = 0;
}

export function getPaymentMetricsSnapshot(): {
  counters: Record<string, number>;
  recentDurations: number;
} {
  return {
    counters: Object.fromEntries(counters.entries()),
    recentDurations: durations.length,
  };
}

export const PAYMENT_METRIC_NAMES = {
  attemptCreated: "payment_attempts_created",
  initSuccess: "payment_provider_init_success",
  initFailure: "payment_provider_init_failure",
  arcaRegisterUncertain: "payment_arca_register_uncertain",
  arcaVerifySuccess: "payment_arca_verify_success",
  arcaVerifyFailure: "payment_arca_verify_failure",
  idramPrecheckAccepted: "payment_idram_precheck_accepted",
  idramPrecheckRejected: "payment_idram_precheck_rejected",
  idramChecksumValid: "payment_idram_checksum_valid",
  idramChecksumInvalid: "payment_idram_checksum_invalid",
  captured: "payment_captured",
  failed: "payment_failed",
  cancelled: "payment_cancelled",
  replay: "payment_callback_replay",
  requiresReview: "payment_requires_review",
  pendingStale: "payment_pending_stale",
  retry: "payment_retry",
  latency: "payment_provider_latency_ms",
} as const;
