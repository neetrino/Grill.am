import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config();

/** Best-effort cleanup of leftover payment integration fixtures. */
async function main(): Promise<void> {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    DELETE FROM stock_movements
    WHERE order_id IN (
      SELECT id FROM orders WHERE contact_email = 'payment-test@example.com'
    )
  `;
  await sql`
    DELETE FROM order_events
    WHERE order_id IN (
      SELECT id FROM orders WHERE contact_email = 'payment-test@example.com'
    )
  `;
  await sql`
    DELETE FROM payments
    WHERE order_id IN (
      SELECT id FROM orders WHERE contact_email = 'payment-test@example.com'
    )
  `;
  await sql`
    DELETE FROM order_items
    WHERE order_id IN (
      SELECT id FROM orders WHERE contact_email = 'payment-test@example.com'
    )
  `;
  const carts = await sql`
    SELECT source_cart_id AS id
    FROM orders
    WHERE contact_email = 'payment-test@example.com'
      AND source_cart_id IS NOT NULL
  `;
  await sql`
    DELETE FROM orders WHERE contact_email = 'payment-test@example.com'
  `;
  for (const row of carts) {
    if (row.id) {
      await sql`DELETE FROM cart_items WHERE cart_id = ${row.id}`;
      await sql`DELETE FROM carts WHERE id = ${row.id}`;
    }
  }
  await sql`
    DELETE FROM products WHERE sku LIKE 'SKU-019%'
  `;
  console.log("cleanup done");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
