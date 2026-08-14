-- LOW risk: nullable customer checkout note on orders (expand-only).
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_note" text;
