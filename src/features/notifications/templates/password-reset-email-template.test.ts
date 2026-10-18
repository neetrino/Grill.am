import { describe, expect, it } from "vitest";

import { renderPasswordResetEmail } from "@/features/notifications/templates/password-reset-email-template";
import { locales } from "@/lib/i18n/config";

const RESET_URL = "https://grill.am/en/reset-password?token=abc&x=1";

describe("renderPasswordResetEmail", () => {
  it("shows the link only as a button href in HTML", () => {
    const email = renderPasswordResetEmail({
      locale: "en",
      storeName: "Grill.am",
      resetUrl: RESET_URL,
      ttlMinutes: 60,
    });

    const escapedUrl = "https://grill.am/en/reset-password?token=abc&amp;x=1";
    expect(email.html).toContain(`href="${escapedUrl}"`);
    expect(email.html.split(escapedUrl)).toHaveLength(2);
    expect(email.html).toContain("Set new password");
    expect(email.text).toContain(RESET_URL);
    expect(email.subject).toBe("Reset your password — Grill.am");
  });

  it("escapes the store name", () => {
    const email = renderPasswordResetEmail({
      locale: "en",
      storeName: "Grill <script>",
      resetUrl: RESET_URL,
      ttlMinutes: 60,
    });

    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("Grill &lt;script&gt;");
  });

  it.each(locales)("renders %s copy with the TTL filled in", (locale) => {
    const email = renderPasswordResetEmail({
      locale,
      storeName: "Grill.am",
      resetUrl: RESET_URL,
      ttlMinutes: 60,
    });

    expect(email.html).toContain(`lang="${locale}"`);
    expect(email.text).toContain("60");
    expect(email.html).not.toMatch(/\{\w+\}/);
  });
});
