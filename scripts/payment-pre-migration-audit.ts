import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config();

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("NO_URL");
    process.exit(1);
  }

  const sql = neon(url);

  const dupAttempts = await sql`
    SELECT order_id::text AS order_id, attempt_number, COUNT(*)::int AS cnt
    FROM payments
    GROUP BY order_id, attempt_number
    HAVING COUNT(*) > 1
  `;
  const dupRefs = await sql`
    SELECT provider, provider_reference, COUNT(*)::int AS cnt
    FROM payments
    WHERE provider_reference IS NOT NULL AND provider_reference <> ''
    GROUP BY provider, provider_reference
    HAVING COUNT(*) > 1
  `;
  const invalidAttempts = await sql`
    SELECT COUNT(*)::int AS cnt FROM payments
    WHERE attempt_number IS NULL OR attempt_number <= 0
  `;
  const multiPending = await sql`
    SELECT order_id::text AS order_id, COUNT(*)::int AS cnt
    FROM payments WHERE status = 'PENDING'
    GROUP BY order_id HAVING COUNT(*) > 1
  `;
  const multiCaptured = await sql`
    SELECT order_id::text AS order_id, COUNT(*)::int AS cnt
    FROM payments WHERE status = 'CAPTURED'
    GROUP BY order_id HAVING COUNT(*) > 1
  `;
  const amountMismatch = await sql`
    SELECT p.id::text AS payment_id
    FROM payments p
    JOIN orders o ON o.id = p.order_id
    WHERE p.amount <> o.total_amount OR p.currency <> o.base_currency
    LIMIT 20
  `;
  const capturedUnpaid = await sql`
    SELECT p.id::text AS payment_id
    FROM payments p
    JOIN orders o ON o.id = p.order_id
    WHERE p.status = 'CAPTURED' AND o.payment_status <> 'CAPTURED'
    LIMIT 20
  `;
  const paidNoCapture = await sql`
    SELECT o.id::text AS order_id
    FROM orders o
    WHERE o.payment_status = 'CAPTURED'
      AND NOT EXISTS (
        SELECT 1 FROM payments p WHERE p.order_id = o.id AND p.status = 'CAPTURED'
      )
    LIMIT 20
  `;
  const emptyRefs = await sql`
    SELECT COUNT(*)::int AS cnt FROM payments WHERE provider_reference = ''
  `;
  const statusCounts = await sql`
    SELECT status::text AS status, COUNT(*)::int AS cnt FROM payments GROUP BY status
  `;
  const paymentCount = await sql`SELECT COUNT(*)::int AS cnt FROM payments`;
  const orderCount = await sql`SELECT COUNT(*)::int AS cnt FROM orders`;
  const metaCart = await sql`
    SELECT COUNT(*)::int AS cnt FROM payments
    WHERE metadata ? 'sourceCartId'
  `;
  const stockDups = await sql`
    SELECT order_id::text AS order_id, product_id::text AS product_id, COUNT(*)::int AS cnt
    FROM stock_movements
    WHERE reason = 'ORDER' AND order_id IS NOT NULL
    GROUP BY order_id, product_id
    HAVING COUNT(*) > 1
  `;
  const providerEventCount = await sql`
    SELECT COUNT(*)::int AS cnt
    FROM order_events
    WHERE provider_event_id IS NOT NULL
  `;

  console.log(
    JSON.stringify(
      {
        paymentCount: paymentCount[0]?.cnt,
        orderCount: orderCount[0]?.cnt,
        statusCounts,
        dupAttempts,
        dupRefs,
        invalidAttempts: invalidAttempts[0]?.cnt,
        multiPending,
        multiCaptured,
        amountMismatch,
        capturedUnpaid,
        paidNoCapture,
        emptyRefs: emptyRefs[0]?.cnt,
        metaCart: metaCart[0]?.cnt,
        stockDups,
        providerEventCount: providerEventCount[0]?.cnt,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
