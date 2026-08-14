import { config as loadEnv } from "dotenv";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { eq } from "drizzle-orm";

import { products, storeSettings, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import {
  E2E_OPERATOR_EMAIL,
  E2E_OPERATOR_PASSWORD,
} from "@/lib/e2e/operator";
import { createId } from "@/lib/id";
import {
  E2E_PAYMENT_PRODUCT_PRICE,
  E2E_PAYMENT_PRODUCT_SKU,
  E2E_PAYMENT_PRODUCT_SLUG,
} from "@/lib/e2e/payment-product";
import { openPgDrizzle } from "../helpers/open-pg-drizzle";
import { resolveE2eDatabaseUrl } from "./helpers/db-guard";

loadEnv({ path: path.resolve(process.cwd(), ".env") });
loadEnv({ path: path.resolve(process.cwd(), ".env.e2e"), override: true });

/**
 * Prepares E2E DB before Next starts: migrate + deterministic product + min order.
 * Clears Next data cache so a prior product-detail miss cannot stick.
 */
async function seedE2eFixtures(connectionString: string): Promise<void> {
  const { db, close } = openPgDrizzle(connectionString);
  try {
    const now = new Date();
    const slug = E2E_PAYMENT_PRODUCT_SLUG;

    const [existingMin] = await db
      .select({ key: storeSettings.key })
      .from(storeSettings)
      .where(eq(storeSettings.key, "store.minimumOrder"))
      .limit(1);

    // amount: 0 parses as “no minimum” in store-settings.
    if (existingMin) {
      await db
        .update(storeSettings)
        .set({ value: { amount: 0 }, updatedAt: now })
        .where(eq(storeSettings.key, "store.minimumOrder"));
    } else {
      await db.insert(storeSettings).values({
        key: "store.minimumOrder",
        value: { amount: 0 },
        updatedAt: now,
      });
    }

    const translations = {
      hy: { title: "E2E Checkout Product", slug: `${slug}-hy` },
      en: { title: "E2E Checkout Product", slug },
      ru: { title: "E2E Checkout Product", slug: `${slug}-ru` },
    };

    const [existingProduct] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.sku, E2E_PAYMENT_PRODUCT_SKU))
      .limit(1);

    if (existingProduct) {
      await db
        .update(products)
        .set({
          status: "ACTIVE",
          priceAmount: E2E_PAYMENT_PRODUCT_PRICE,
          stockOnHand: 100,
          deletedAt: null,
          isFeatured: true,
          customization: null,
          translations,
          updatedAt: now,
        })
        .where(eq(products.id, existingProduct.id));
    } else {
      await db.insert(products).values({
        id: createId(),
        sku: E2E_PAYMENT_PRODUCT_SKU,
        status: "ACTIVE",
        priceAmount: E2E_PAYMENT_PRODUCT_PRICE,
        stockOnHand: 100,
        isFeatured: true,
        customization: null,
        translations,
        createdAt: now,
        updatedAt: now,
      });
    }

    const [verified] = await db
      .select({
        sku: products.sku,
        status: products.status,
        priceAmount: products.priceAmount,
        stockOnHand: products.stockOnHand,
        translations: products.translations,
      })
      .from(products)
      .where(eq(products.sku, E2E_PAYMENT_PRODUCT_SKU))
      .limit(1);

    const enSlug =
      verified &&
      typeof verified.translations?.en === "object" &&
      verified.translations.en &&
      "slug" in verified.translations.en
        ? String((verified.translations.en as { slug?: string }).slug ?? "")
        : "";

    if (
      !verified ||
      verified.status !== "ACTIVE" ||
      verified.stockOnHand < 1 ||
      verified.priceAmount !== E2E_PAYMENT_PRODUCT_PRICE ||
      enSlug !== slug
    ) {
      throw new Error(
        "E2E seed verification failed: product not purchasable after upsert.",
      );
    }

    const passwordHash = await hashPassword(E2E_OPERATOR_PASSWORD);
    const [existingOperator] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, E2E_OPERATOR_EMAIL))
      .limit(1);

    if (existingOperator) {
      await db
        .update(users)
        .set({
          passwordHash,
          passwordUpdatedAt: now,
          role: "OPERATOR",
          status: "ACTIVE",
          emailVerifiedAt: now,
          anonymizedAt: null,
          firstName: "E2E",
          lastName: "Operator",
          updatedAt: now,
        })
        .where(eq(users.id, existingOperator.id));
    } else {
      await db.insert(users).values({
        id: createId(),
        email: E2E_OPERATOR_EMAIL,
        emailVerifiedAt: now,
        passwordHash,
        passwordUpdatedAt: now,
        firstName: "E2E",
        lastName: "Operator",
        role: "OPERATOR",
        status: "ACTIVE",
        termsAcceptedAt: now,
        termsVersion: "1.0",
      });
    }

    console.log(
      `E2E seed OK: sku=${E2E_PAYMENT_PRODUCT_SKU} slug=${slug} price=${E2E_PAYMENT_PRODUCT_PRICE} minOrder=0 operator=${E2E_OPERATOR_EMAIL}`,
    );
  } finally {
    await close();
  }
}

function clearNextDataCache(): void {
  const cacheDir = path.resolve(process.cwd(), ".next/cache");
  try {
    rmSync(cacheDir, { recursive: true, force: true });
    console.log("E2E prepare: cleared .next/cache (product detail miss bust).");
  } catch {
    // Directory may not exist on first run.
  }
}

async function main(): Promise<void> {
  const url = resolveE2eDatabaseUrl();
  process.env.DATABASE_URL = url;

  const migrate = spawnSync("pnpm", ["db:migrate"], {
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
  if (migrate.status !== 0) {
    process.exit(migrate.status ?? 1);
  }

  await seedE2eFixtures(url);
  clearNextDataCache();
  console.log("E2E database prepare complete (URL redacted).");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "prepare_failed";
  console.error(message);
  process.exit(1);
});
