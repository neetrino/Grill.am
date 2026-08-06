import { expect, type Page } from "@playwright/test";

import {
  E2E_OPERATOR_EMAIL,
  E2E_OPERATOR_PASSWORD,
} from "@/lib/e2e/operator";

/** Logs in as the seeded E2E operator and lands on an admin path. */
export async function loginAsE2eOperator(
  page: Page,
  nextPath: string,
): Promise<void> {
  const next = encodeURIComponent(nextPath);
  await page.goto(`/en/login?next=${next}`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="email"]').fill(E2E_OPERATOR_EMAIL);
  await page.locator('input[name="password"]').fill(E2E_OPERATOR_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(new RegExp(nextPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), {
    timeout: 60_000,
  });
}

export async function assertAdminRequiresReviewUx(
  page: Page,
  orderNumber: string,
): Promise<void> {
  const path = `/en/admin/orders/${encodeURIComponent(orderNumber)}`;
  await loginAsE2eOperator(page, path);
  await expect(page.getByRole("heading", { name: /requires review/i })).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByText(/payment was received \(captured\)|fulfillment is blocked/i),
  ).toBeVisible();
  await expect(page.getByText(/requires review/i).first()).toBeVisible();
}
