import { describe, expect, it } from "vitest";

import {
  parseTidioPublicKey,
  tidioWidgetScriptUrl,
} from "@/lib/tidio/public-key";

describe("parseTidioPublicKey", () => {
  it("accepts a typical 32-character widget id", () => {
    expect(parseTidioPublicKey("fouwfr0cnygz4sj8kttyv0cz1rpaayva")).toBe(
      "fouwfr0cnygz4sj8kttyv0cz1rpaayva",
    );
  });

  it("trims whitespace", () => {
    expect(parseTidioPublicKey("  abcdefghijklmnop  ")).toBe("abcdefghijklmnop");
  });

  it("extracts the id from an official embed URL or script snippet", () => {
    expect(
      parseTidioPublicKey(
        "https://code.tidio.co/fouwfr0cnygz4sj8kttyv0cz1rpaayva.js",
      ),
    ).toBe("fouwfr0cnygz4sj8kttyv0cz1rpaayva");
    expect(
      parseTidioPublicKey(
        '<script src="//code.tidio.co/fouwfr0cnygz4sj8kttyv0cz1rpaayva.js" async></script>',
      ),
    ).toBe("fouwfr0cnygz4sj8kttyv0cz1rpaayva");
  });

  it("rejects empty, short, or non-alphanumeric values", () => {
    expect(parseTidioPublicKey("")).toBeUndefined();
    expect(parseTidioPublicKey("short")).toBeUndefined();
    expect(parseTidioPublicKey("not_a_valid_tidio_key!")).toBeUndefined();
    expect(parseTidioPublicKey("../evil")).toBeUndefined();
  });
});

describe("tidioWidgetScriptUrl", () => {
  it("builds the official embed URL", () => {
    expect(tidioWidgetScriptUrl("abcdefghijklmnop")).toBe(
      "https://code.tidio.co/abcdefghijklmnop.js",
    );
  });

  it("returns undefined for an invalid id", () => {
    expect(tidioWidgetScriptUrl("nope")).toBeUndefined();
  });
});
