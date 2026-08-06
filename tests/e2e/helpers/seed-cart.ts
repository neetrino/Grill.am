import { expect, type APIRequestContext, type Page } from "@playwright/test";

import {
  E2E_PAYMENT_PRODUCT_SLUG,
  E2E_PAYMENT_PRODUCT_SKU,
} from "@/lib/e2e/payment-product";

export type SeedCartResult = {
  slug: string;
  productTitle: string;
};

function excerpt(html: string): string {
  return html.replace(/\s+/g, " ").slice(0, 280);
}

/**
 * Deterministic cart seed for payment E2E. Throws with diagnostics on failure.
 * Never silently returns false.
 */
export async function seedCartViaUi(
  page: Page,
  request: APIRequestContext,
  baseURL: string,
): Promise<SeedCartResult> {
  const fixtureResponse = await request.get(`${baseURL}/api/e2e/fixture`);
  if (!fixtureResponse.ok()) {
    throw new Error(
      `E2E fixture probe failed: status=${fixtureResponse.status()} body=${(await fixtureResponse.text()).slice(0, 200)}`,
    );
  }
  const fixture = (await fixtureResponse.json()) as {
    ok: boolean;
    product?: { slug: string; title: string; priceAmount: number };
  };
  if (!fixture.ok || !fixture.product) {
    throw new Error(
      `E2E fixture missing product for sku=${E2E_PAYMENT_PRODUCT_SKU}`,
    );
  }

  const slug = fixture.product.slug || E2E_PAYMENT_PRODUCT_SLUG;
  const productUrl = `/en/products/${slug}`;
  await page.goto(productUrl, { waitUntil: "domcontentloaded" });

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading, `PDP heading missing at ${page.url()}`).toBeVisible({
    timeout: 30_000,
  });
  const titleText = (await heading.innerText()).trim();
  if (!/E2E Checkout Product/i.test(titleText)) {
    const html = await page.content();
    throw new Error(
      [
        "E2E PDP title mismatch.",
        `url=${page.url()}`,
        `expectedSlug=${slug}`,
        `heading=${titleText}`,
        `html=${excerpt(html)}`,
      ].join(" "),
    );
  }

  const add = page.getByRole("button", {
    name: /add to cart|ավելացնել|добавить/i,
  });
  await expect(add, `Add to Cart not found at ${page.url()}`).toBeVisible({
    timeout: 15_000,
  });
  await expect(add).toBeEnabled();
  await add.click();
  // Toast can flake under Neon load; checkout line-item assert below is authoritative.
  const toastVisible = await page
    .getByText(/added to cart|ավելացվ|добавлен/i)
    .waitFor({ state: "visible", timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  if (!toastVisible) {
    // Continue — missing toast is only fatal if checkout has no line item.
  }

  await page.goto("/en/checkout", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByText(/E2E Checkout Product/i).first(),
    `Checkout missing seeded line item at ${page.url()}`,
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/minimum order is/i)).toHaveCount(0);
  await expect(
    page.locator('input[name="paymentMethod"]').first(),
  ).toBeVisible({ timeout: 15_000 });

  return { slug, productTitle: titleText };
}

export async function fillCheckoutContact(
  page: Page,
  suffix: string,
): Promise<void> {
  await page.getByLabel(/first name/i).fill(`E2E${suffix}`);
  await page.getByLabel(/last name/i).fill(`User${suffix}`);
  await page
    .getByLabel(/email/i)
    .fill(`e2e-${suffix.toLowerCase()}@example.com`);
  await page.getByLabel(/phone/i).fill("+37491111111");

  // Prefer pickup so address/delivery-rule fields are not required.
  const pickup = page.locator('input[name="shippingMethod"][value="pickup"]');
  await expect(pickup).toBeVisible({ timeout: 15_000 });
  await pickup.check();
  await expect(
    page.locator('input[name="shippingMethod"][value="pickup"]'),
  ).toBeChecked();
}

export async function selectCod(page: Page): Promise<void> {
  await page
    .locator('input[name="paymentMethod"][value="cash_on_delivery"]')
    .check();
  await expect(page.getByText(/pay when receiving the order/i)).toBeVisible();
}
