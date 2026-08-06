import "dotenv/config";

import { processOutboxOnce } from "@/features/outbox/application/process-outbox";
import { logger } from "@/lib/observability/logger";
import { createId } from "@/lib/id";

const POLL_MS = Number(process.env.OUTBOX_POLL_MS ?? 2000);
const BATCH_SIZE = Number(process.env.OUTBOX_BATCH_SIZE ?? 20);

let stopping = false;

function requestStop(): void {
  stopping = true;
}

process.on("SIGINT", requestStop);
process.on("SIGTERM", requestStop);

async function main(): Promise<void> {
  const workerId = `loop-${createId().slice(0, 8)}`;
  logger.info("outbox.work.start", { workerId, pollMs: POLL_MS });

  while (!stopping) {
    const summary = await processOutboxOnce({
      workerId,
      batchSize: BATCH_SIZE,
    });
    if (summary.claimed > 0) {
      logger.info("outbox.work.batch", {
        workerId,
        claimed: summary.claimed,
        sent: summary.sent,
        retried: summary.retried,
        failed: summary.failed,
      });
    }
    if (stopping) break;
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }

  logger.info("outbox.work.stop", { workerId });
}

main().catch((error: unknown) => {
  logger.error("outbox.work.fatal", {
    errorCode: error instanceof Error ? error.name : "UNKNOWN",
  });
  process.exitCode = 1;
});
