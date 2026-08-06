import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config();

async function main(): Promise<void> {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT
      id::text AS id,
      order_id::text AS order_id,
      product_id::text AS product_id,
      delta,
      resulting_balance,
      correlation_id,
      created_at
    FROM stock_movements
    WHERE order_id = '019fca60-4a8f-7648-a661-56d4d5f69797'
      AND product_id = '019f88a8-ab18-777f-862f-7ca897f1feac'
      AND reason = 'ORDER'
    ORDER BY created_at ASC
  `;
  console.log(JSON.stringify(rows, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
