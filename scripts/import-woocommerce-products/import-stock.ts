import { eq } from "drizzle-orm";

import { products, stockMovements } from "@/db/schema";
import { createId } from "@/lib/id";

import { DEFAULT_IMPORT_STOCK_ON_HAND } from "./constants";
import { hasImportStockMovement } from "./conflicts";
import type { ImportDatabase } from "./db";
import { stockCorrelationId } from "./sku-and-price";

export type ApplyStockResult = {
  applied: boolean;
  movementCreated: boolean;
  stockOnHand: number;
};

/**
 * Sets stockOnHand to 999 once with a single IMPORT ledger row.
 * Re-runs skip when `wc-import:{sku}` already exists (unless forceStock).
 */
export async function applyImportStock(
  db: ImportDatabase,
  input: {
    productId: string;
    sku: string;
    previousStockOnHand: number;
    forceStock?: boolean;
  },
): Promise<ApplyStockResult> {
  const target = DEFAULT_IMPORT_STOCK_ON_HAND;
  const alreadyImported = await hasImportStockMovement(
    db,
    input.productId,
    input.sku,
  );

  if (alreadyImported && !input.forceStock) {
    return {
      applied: false,
      movementCreated: false,
      stockOnHand: input.previousStockOnHand,
    };
  }

  const delta = target - input.previousStockOnHand;

  await db
    .update(products)
    .set({ stockOnHand: target, updatedAt: new Date() })
    .where(eq(products.id, input.productId));

  if (alreadyImported && input.forceStock) {
    if (delta === 0) {
      return {
        applied: false,
        movementCreated: false,
        stockOnHand: target,
      };
    }
    await db.insert(stockMovements).values({
      id: createId(),
      productId: input.productId,
      delta,
      reason: "IMPORT",
      resultingBalance: target,
      correlationId: `${stockCorrelationId(input.sku)}:force`,
    });
    return { applied: true, movementCreated: true, stockOnHand: target };
  }

  await db.insert(stockMovements).values({
    id: createId(),
    productId: input.productId,
    delta,
    reason: "IMPORT",
    resultingBalance: target,
    correlationId: stockCorrelationId(input.sku),
  });

  return { applied: true, movementCreated: true, stockOnHand: target };
}
