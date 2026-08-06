import "dotenv/config";

import { processOutboxOnce } from "@/features/outbox/application/process-outbox";
import { getOutboxStats } from "@/features/outbox/application/claim-outbox";
import { withTransaction } from "@/db/transaction";
import { logger } from "@/lib/observability/logger";

async function main(): Promise<void> {
  const summary = await processOutboxOnce({
    batchSize: Number(process.env.OUTBOX_BATCH_SIZE ?? 20),
  });
  const stats = await withTransaction((tx) => getOutboxStats(tx));
  logger.info("outbox.once.summary", {
    claimed: summary.claimed,
    sent: summary.sent,
    retried: summary.retried,
    failed: summary.failed,
    workerId: summary.workerId,
    pending: stats.PENDING,
    processing: stats.PROCESSING,
    completed: stats.COMPLETED,
    failedTotal: stats.FAILED,
  });
  console.log(JSON.stringify({ summary, stats }, null, 2));
}

main().catch((error: unknown) => {
  logger.error("outbox.once.fatal", {
    errorCode: error instanceof Error ? error.name : "UNKNOWN",
    safeMessage: error instanceof Error ? error.message : "unknown",
  });
  process.exitCode = 1;
});
