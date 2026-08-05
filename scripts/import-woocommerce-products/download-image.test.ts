import { describe, expect, it } from "vitest";

import {
  encodeImageSourceUrl,
  resolveImageRequestHeaders,
} from "./download-image";

describe("image URL encoding", () => {
  it("percent-encodes Armenian path segments without double encoding", () => {
    const raw =
      "https://grill.am/wp-content/uploads/2021/03/բում-առաջարկ-scaled.jpg";
    const encoded = encodeImageSourceUrl(raw);
    expect(encoded).toContain("%D5%");
    expect(encodeImageSourceUrl(encoded)).toBe(encoded);
  });

  it("preserves already encoded components", () => {
    const raw =
      "https://grill.am/wp-content/uploads/2021/03/%D5%A2%D5%B8%D6%82%D5%B4-scaled.jpg";
    expect(encodeImageSourceUrl(raw)).toBe(raw);
  });
});

describe("image request headers", () => {
  it("uses browser-compatible defaults and optional env overrides", () => {
    const defaults = resolveImageRequestHeaders({});
    expect(defaults.userAgent).toContain("Mozilla/5.0");
    expect(defaults.referer).toBe("https://grill.am/");
    expect(defaults.cookie).toBeUndefined();

    const custom = resolveImageRequestHeaders({
      WC_IMAGE_USER_AGENT: "CustomAgent/1.0",
      WC_IMAGE_REFERER: "https://example.com/",
      WC_IMAGE_COOKIE: "secret=1",
    });
    expect(custom.userAgent).toBe("CustomAgent/1.0");
    expect(custom.referer).toBe("https://example.com/");
    expect(custom.cookie).toBe("secret=1");
  });
});
