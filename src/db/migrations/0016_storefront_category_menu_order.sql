-- LOW risk: data-only storefront category menu order.
-- Signature grill food first (խորոված → քաբաբ → հավի գրիլ), drinks last.
UPDATE "categories"
SET "sort_order" = 1, "updated_at" = now()
WHERE "deleted_at" IS NULL AND "translations"->'hy'->>'title' = 'Խորոված';
--> statement-breakpoint
UPDATE "categories"
SET "sort_order" = 2, "updated_at" = now()
WHERE "deleted_at" IS NULL AND "translations"->'hy'->>'title' = 'Քաբաբ';
--> statement-breakpoint
UPDATE "categories"
SET "sort_order" = 3, "updated_at" = now()
WHERE "deleted_at" IS NULL AND "translations"->'hy'->>'title' = 'Հավի գրիլ';
--> statement-breakpoint
UPDATE "categories"
SET "sort_order" = 4, "updated_at" = now()
WHERE "deleted_at" IS NULL AND "translations"->'hy'->>'title' = 'Շաուրմա';
--> statement-breakpoint
UPDATE "categories"
SET "sort_order" = 5, "updated_at" = now()
WHERE "deleted_at" IS NULL AND "translations"->'hy'->>'title' = 'Կոմբո առաջարկներ, ակցիաներ';
--> statement-breakpoint
UPDATE "categories"
SET "sort_order" = 6, "updated_at" = now()
WHERE "deleted_at" IS NULL AND "translations"->'hy'->>'title' = 'Աղցան';
--> statement-breakpoint
UPDATE "categories"
SET "sort_order" = 7, "updated_at" = now()
WHERE "deleted_at" IS NULL AND "translations"->'hy'->>'title' = 'Նախուտեստ, սոուս';
--> statement-breakpoint
UPDATE "categories"
SET "sort_order" = 8, "updated_at" = now()
WHERE "deleted_at" IS NULL AND "translations"->'hy'->>'title' = 'Ըմպելիքներ';
--> statement-breakpoint
UPDATE "categories"
SET "sort_order" = 9, "updated_at" = now()
WHERE "deleted_at" IS NULL AND "translations"->'hy'->>'title' = 'Ալկոհոլային ըմպելիքներ';
