import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { parseCliArgs } from "./cli-args";
import { parseWooCommerceCategories } from "./category-parser";
import { DEFAULT_IMPORT_STOCK_ON_HAND, EXCLUDED_WOOCOMMERCE_ID } from "./constants";
import { generateProductSlug } from "./generate-slug";
import { parseProductImageUrls } from "./image-parser";
import { normalizeCsvRow } from "./normalize-row";
import { readWooCommerceCsv } from "./read-csv";
import {
  generateSku,
  isExcludedWooCommerceId,
  mapPublishedStatus,
  parseIntegerAmdPrice,
} from "./sku-and-price";
import { transliterateArmenianToLatin } from "./transliterate-hy";
import { CSV_HEADERS } from "./constants";
import type { RawCsvRow } from "./types";

function row(partial: Partial<RawCsvRow> = {}): RawCsvRow {
  return {
    [CSV_HEADERS.id]: "271",
    [CSV_HEADERS.type]: "simple",
    [CSV_HEADERS.sku]: "",
    [CSV_HEADERS.name]: "Հավի գրիլ",
    [CSV_HEADERS.published]: "1",
    [CSV_HEADERS.featured]: "0",
    [CSV_HEADERS.shortDescription]: "կարճ",
    [CSV_HEADERS.description]: "լրիվ",
    [CSV_HEADERS.stockStatus]: "1",
    [CSV_HEADERS.stockQty]: "",
    [CSV_HEADERS.regularPrice]: "2500",
    [CSV_HEADERS.salePrice]: "",
    [CSV_HEADERS.categories]: "Հավի գրիլ",
    [CSV_HEADERS.images]: "https://example.com/a.jpg",
    [CSV_HEADERS.yoastMetaDescription]: "",
    ...partial,
  };
}

describe("woocommerce csv import helpers", () => {
  it("reads UTF-8 BOM CSV", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "wc-import-"));
    const csvPath = path.join(dir, "bom.csv");
    const header = [
      CSV_HEADERS.id,
      CSV_HEADERS.type,
      CSV_HEADERS.sku,
      CSV_HEADERS.name,
      CSV_HEADERS.published,
      CSV_HEADERS.featured,
      CSV_HEADERS.shortDescription,
      CSV_HEADERS.description,
      CSV_HEADERS.stockStatus,
      CSV_HEADERS.stockQty,
      CSV_HEADERS.salePrice,
      CSV_HEADERS.regularPrice,
      CSV_HEADERS.categories,
      CSV_HEADERS.images,
      CSV_HEADERS.yoastMetaDescription,
    ].join(",");
    const line = `271,simple,,"Title",1,0,"short","desc",1,,,2500,"Cat",https://example.com/a.jpg,`;
    await writeFile(csvPath, `\uFEFF${header}\n${line}\n`, "utf8");

    const result = await readWooCommerceCsv(csvPath);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.[CSV_HEADERS.name]).toBe("Title");
  });

  it("reads quoted multiline fields", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "wc-import-"));
    const csvPath = path.join(dir, "multi.csv");
    const header = [
      CSV_HEADERS.id,
      CSV_HEADERS.type,
      CSV_HEADERS.sku,
      CSV_HEADERS.name,
      CSV_HEADERS.published,
      CSV_HEADERS.featured,
      CSV_HEADERS.shortDescription,
      CSV_HEADERS.description,
      CSV_HEADERS.stockStatus,
      CSV_HEADERS.stockQty,
      CSV_HEADERS.salePrice,
      CSV_HEADERS.regularPrice,
      CSV_HEADERS.categories,
      CSV_HEADERS.images,
      CSV_HEADERS.yoastMetaDescription,
    ].join(",");
    const content = `${header}\n271,simple,,"Name",1,0,"line1\nline2","desc",1,,,1000,"Cat",https://example.com/a.jpg,\n`;
    await writeFile(csvPath, content, "utf8");
    const result = await readWooCommerceCsv(csvPath);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.[CSV_HEADERS.shortDescription]).toContain("line1");
    expect(result.rows[0]?.[CSV_HEADERS.shortDescription]).toContain("line2");
  });

  it("parses escaped comma categories", () => {
    expect(
      parseWooCommerceCategories("Կոմբո առաջարկներ\\, ակցիաներ, Շաուրմա"),
    ).toEqual(["Կոմբո առաջարկներ, ակցիաներ", "Շաուրմա"]);
  });

  it("skips product ID 677", () => {
    expect(isExcludedWooCommerceId(EXCLUDED_WOOCOMMERCE_ID)).toBe(true);
    const result = normalizeCsvRow(
      row({
        [CSV_HEADERS.id]: "677",
        [CSV_HEADERS.name]: "Ալկոհոլային ըմպելիքներ",
        [CSV_HEADERS.published]: "-1",
        [CSV_HEADERS.regularPrice]: "",
        [CSV_HEADERS.categories]: "",
        [CSV_HEADERS.images]: "",
      }),
    );
    expect(result.kind).toBe("skipped");
    if (result.kind === "skipped") {
      expect(result.skipped.woocommerceId).toBe(677);
    }
  });

  it("generates WC-{id} SKUs", () => {
    expect(generateSku(271)).toBe("WC-271");
    expect(generateSku(31779)).toBe("WC-31779");
  });

  it("transliterates Armenian titles", () => {
    expect(transliterateArmenianToLatin("Հավի գրիլ")).toContain("havi");
  });

  it("falls back when transliteration is empty", () => {
    const slug = generateProductSlug({
      titleHy: "!!!",
      woocommerceId: 42,
    });
    expect(slug.slug).toBe("product-42");
    expect(slug.fallbackUsed).toBe(true);
  });

  it("appends woocommerce id on slug collision", () => {
    const slug = generateProductSlug({
      titleHy: "Հավի գրիլ",
      woocommerceId: 271,
      conflictWithOtherSku: true,
    });
    expect(slug.slug.endsWith("-271")).toBe(true);
    expect(slug.conflictSuffixApplied).toBe(true);
  });

  it("removes duplicate image URLs", () => {
    const parsed = parseProductImageUrls(
      "https://a/x.jpg, https://a/x.jpg, https://b/y.jpg",
    );
    expect(parsed.urls).toEqual(["https://a/x.jpg", "https://b/y.jpg"]);
    expect(parsed.duplicatesRemoved).toBe(1);
  });

  it("validates integer AMD prices", () => {
    expect(parseIntegerAmdPrice("9700")).toBe(9700);
    expect(parseIntegerAmdPrice("97.5")).toBeNull();
    expect(parseIntegerAmdPrice("-1")).toBeNull();
    expect(parseIntegerAmdPrice("")).toBeNull();
    expect(parseIntegerAmdPrice("abc")).toBeNull();
  });

  it("maps published status", () => {
    expect(mapPublishedStatus("1")).toBe("ACTIVE");
    expect(mapPublishedStatus("-1")).toBe("DRAFT");
    expect(mapPublishedStatus("0")).toBe("DRAFT");
  });

  it("defaults stock to 999", () => {
    const result = normalizeCsvRow(row({}));
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.product.stockOnHand).toBe(DEFAULT_IMPORT_STOCK_ON_HAND);
      expect(result.product.sku).toBe("WC-271");
    }
  });

  it("rejects invalid price as blocking row error", () => {
    const result = normalizeCsvRow(row({ [CSV_HEADERS.regularPrice]: "12.5" }));
    expect(result.kind).toBe("invalid");
    if (result.kind === "invalid") {
      expect(result.errors.some((e) => e.code === "invalid_price")).toBe(true);
    }
  });

  it("requires explicit confirmation for apply mode parsing path", () => {
    const options = parseCliArgs([
      "node",
      "cli.ts",
      "--mode",
      "apply",
    ]);
    expect(options.confirmImport).toBe(false);
    const confirmed = parseCliArgs([
      "node",
      "cli.ts",
      "--mode",
      "apply",
      "--confirm-import",
    ]);
    expect(confirmed.confirmImport).toBe(true);
  });
});

describe("woocommerce import idempotency pure rules", () => {
  it("keeps SKU stable across repeated normalization", () => {
    const first = normalizeCsvRow(row({ [CSV_HEADERS.id]: "459" }));
    const second = normalizeCsvRow(row({ [CSV_HEADERS.id]: "459" }));
    expect(first.kind).toBe("ok");
    expect(second.kind).toBe("ok");
    if (first.kind === "ok" && second.kind === "ok") {
      expect(first.product.sku).toBe(second.product.sku);
      expect(first.product.slug).toBe(second.product.slug);
    }
  });

  it("treats apply without confirmation as unsafe", async () => {
    const { runApply } = await import("./apply");
    await expect(
      runApply({
        mode: "apply",
        csvPath: "missing.csv",
        confirmImport: false,
        skipImageCheck: true,
        allowImageFailures: false,
        forceStock: false,
        imageConcurrency: 2,
      }),
    ).rejects.toThrow(/confirm/i);
  });
});

describe("woocommerce import media failure isolation", () => {
  it("records image failure without aborting product result shape", async () => {
    vi.resetModules();
    const download = await import("./download-image");
    vi.spyOn(download, "downloadProductImage").mockResolvedValue({
      ok: false,
      code: "http_404",
      error: "HTTP 404 downloading image",
      httpStatus: 404,
      serverHint: null,
    });

    const { importProductMedia } = await import("./import-media");

    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: async () => [],
            limit: async () => [],
          }),
        }),
      }),
      insert: () => ({
        values: async () => undefined,
      }),
      update: () => ({
        set: () => ({
          where: async () => undefined,
        }),
      }),
    };

    const storage = {
      name: "test",
      createPresignedUpload: async () => {
        throw new Error("unused");
      },
      createPresignedDownload: async () => {
        throw new Error("unused");
      },
      putObject: async () => undefined,
      buildPublicUrl: () => "",
      deleteObject: async () => undefined,
    };

    const result = await importProductMedia(
      db as never,
      storage,
      {
        productId: "00000000-0000-7000-8000-000000000001",
        woocommerceId: 271,
        sku: "WC-271",
        images: [
          {
            sourceUrl: "https://example.com/missing.jpg",
            index: 0,
            sourceHash: "abc123abc123",
            plannedObjectKeyTemplate: "x",
          },
        ],
      },
    );

    expect(result.imagesUploaded).toBe(0);
    expect(result.imageFailures).toHaveLength(1);
    expect(result.primarySet).toBe(false);
  });
});
