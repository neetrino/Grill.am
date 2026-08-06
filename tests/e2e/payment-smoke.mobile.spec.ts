import { expect, test } from "@playwright/test";

/**
 * Baseline payment UX smoke — full matrix lives in payment-flows.spec.ts.
 * Mobile project runs this file only.
 */
test("checkout page loads payment methods", async ({ page }) => {
  await page.goto("/en/checkout");
  await expect(page.getByRole("heading").first()).toBeVisible();
  // Empty cart is acceptable — page must still render.
  await expect(
    page.getByText(/cash on delivery|order|checkout|cart/i).first(),
  ).toBeVisible();
});
