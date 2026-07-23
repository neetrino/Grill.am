DROP INDEX "cart_items_cart_product_uidx";--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "modifiers" jsonb DEFAULT '{"optionChoices":{},"addonIds":[],"exclusionIds":[]}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "selection_key" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "modifiers_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "customization" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "cart_items_cart_product_selection_uidx" ON "cart_items" USING btree ("cart_id","product_id","selection_key");