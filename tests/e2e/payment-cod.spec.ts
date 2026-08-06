import { expect, test } from "@playwright/test";

import {
  fillCheckoutContact,
  seedCartViaUi,
  selectCod,
} from "./helpers/seed-cart";

/**
 * Single critical COD browser path. Must stay green before expanding the matrix.
 */
test.describe("COD checkout E2E", () => {
  test.describe.configure({ mode: "serial" });

  test("COD place order from seeded cart", async ({
    page,
    request,
    baseURL,
  }) => {
    test.setTimeout(120_000);
    await seedCartViaUi(page, request, baseURL!);

    await selectCod(page);
    await fillCheckoutContact(page, "Cod");

    const place = page.getByRole("button", { name: /place order/i });
    await expect(place).toBeEnabled();
    await place.click();

    await page.waitForURL(/\/checkout\/success\//, {
      timeout: 60_000,
      waitUntil: "domcontentloaded",
    });
    const successUrl = page.url();
    expect(successUrl).toMatch(/\/checkout\/success\/[^/?#]+/);

    await expect(
      page.getByText(/pay cash when you receive|pay when/i),
    ).toBeVisible();
    await expect(
      page.getByText(/paid successfully|payment completed/i),
    ).toHaveCount(0);

    // Reload must not invent a paid claim.
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(
      page.getByText(/pay cash when you receive|pay when/i),
    ).toBeVisible();
    await expect(
      page.getByText(/paid successfully|payment completed/i),
    ).toHaveCount(0);
  });

  test("COD double-submit creates one confirmation flow", async ({
    page,
    request,
    baseURL,
  }) => {
    test.setTimeout(120_000);
    await seedCartViaUi(page, request, baseURL!);
    await selectCod(page);
    await fillCheckoutContact(page, "Dbl");

    const place = page.getByRole("button", { name: /place order/i });
    await expect(place).toBeEnabled();

    await Promise.all([
      page.waitForURL(/\/checkout\/success\//, {
        timeout: 60_000,
        waitUntil: "domcontentloaded",
      }),
      (async () => {
        await place.click();
        // Second click must not wait for enabled — button disables / detaches after submit.
        await place.click({ force: true, timeout: 1_000 }).catch(() => undefined);
      })(),
    ]);

    const orderNumber = page.url().match(/success\/([^/?#]+)/)?.[1];
    expect(orderNumber).toBeTruthy();

    await expect(
      page.getByText(/pay cash when you receive|pay when/i),
    ).toBeVisible();
    await expect(
      page.getByText(/paid successfully|payment completed/i),
    ).toHaveCount(0);
  });
});
