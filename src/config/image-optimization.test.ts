import { describe, expect, it } from "vitest";

import {
  IMAGE_DEVICE_SIZES,
  IMAGE_INLINE_SIZES,
  IMAGE_OPTIMIZATION_FORMATS,
  IMAGE_QUALITY,
} from "@/config/image-optimization";

describe("image optimization allowlists", () => {
  it("serves a single webp format and one quality", () => {
    expect(IMAGE_OPTIMIZATION_FORMATS).toEqual(["image/webp"]);
    expect(IMAGE_QUALITY).toBe(75);
  });

  it("keeps one wide breakpoint and drops unused 2K/4K widths", () => {
    expect(IMAGE_DEVICE_SIZES).toContain(1920);
    expect(IMAGE_DEVICE_SIZES).not.toContain(2048);
    expect(IMAGE_DEVICE_SIZES).not.toContain(3840);
    expect(Math.max(...IMAGE_DEVICE_SIZES)).toBe(1920);
  });

  it("keeps thumbnail widths used by cart and gallery thumbs", () => {
    expect(IMAGE_INLINE_SIZES).toContain(48);
    expect(IMAGE_INLINE_SIZES).toContain(256);
  });
});
