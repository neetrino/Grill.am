import "dotenv/config";

import { withTransaction } from "@/db/transaction";
import { getOutboxStats } from "@/features/outbox/application/claim-outbox";

async function main(): Promise<void> {
  const stats = await withTransaction((tx) => getOutboxStats(tx));
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "outbox_stats_failed");
  process.exitCode = 1;
});
