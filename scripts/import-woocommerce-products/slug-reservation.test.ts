import { describe, expect, it, vi } from "vitest";

import { SlugReservationRegistry } from "./generate-slug";

describe("slug reservation registry", () => {
  it("assigns unique slugs for two new CSV rows with the same base slug", () => {
    const registry = new SlugReservationRegistry();
    const first = registry.allocate({
      titleHy: "Օղի 0.5լ",
      woocommerceId: 680,
      sku: "WC-680",
    });
    const second = registry.allocate({
      titleHy: "Օղի 0.5լ",
      woocommerceId: 683,
      sku: "WC-683",
    });

    expect(first.slug).toBe("oghi-0-5l");
    expect(second.slug).toBe("oghi-0-5l-683");
    expect(second.conflictSuffixApplied).toBe(true);
    expect(
      registry.findDuplicateFinalSlugs([
        { sku: "WC-680", slug: first.slug },
        { sku: "WC-683", slug: second.slug },
      ]),
    ).toEqual([]);
  });

  it("collides with an existing database product from another SKU", () => {
    const registry = new SlugReservationRegistry();
    registry.seedExisting([{ slug: "oghi-0-5l", sku: "MANUAL-1" }]);

    const allocated = registry.allocate({
      titleHy: "Օղի 0.5լ",
      woocommerceId: 680,
      sku: "WC-680",
    });

    expect(allocated.slug).toBe("oghi-0-5l-680");
    expect(allocated.conflictSuffixApplied).toBe(true);
  });

  it("keeps identical final slugs across repeated dry-run allocations", () => {
    function runOnce(): string[] {
      const registry = new SlugReservationRegistry();
      const a = registry.allocate({
        titleHy: "Օղի 0.5լ",
        woocommerceId: 680,
        sku: "WC-680",
      });
      const b = registry.allocate({
        titleHy: "Օղի 0.5լ",
        woocommerceId: 683,
        sku: "WC-683",
      });
      return [a.slug, b.slug];
    }

    expect(runOnce()).toEqual(runOnce());
    expect(runOnce()).toEqual(["oghi-0-5l", "oghi-0-5l-683"]);
  });

  it("allows the same SKU to reclaim its existing slug on re-run", () => {
    const registry = new SlugReservationRegistry();
    registry.seedExisting([{ slug: "oghi-0-5l", sku: "WC-680" }]);
    const allocated = registry.allocate({
      titleHy: "Օղի 0.5լ",
      woocommerceId: 680,
      sku: "WC-680",
    });
    expect(allocated.slug).toBe("oghi-0-5l");
    expect(allocated.conflictSuffixApplied).toBe(false);
  });
});

describe("apply refuses duplicate final slugs", () => {
  it("throws when duplicate slugs somehow remain after dry-run", async () => {
    vi.resetModules();
    vi.doMock("./dry-run", () => ({
      runDryRun: async () => ({
        hasBlockingErrors: false,
        markdownPath: "",
        jsonPath: "",
        report: {
          applyReadiness: {
            ready: true,
            blockingReasons: [],
            inaccessibleSourceImages: 0,
            duplicateGeneratedSlugs: 0,
            invalidRows: 0,
          },
          summary: {
            productsPlannedCreates: 2,
            imagesDiscovered: 0,
            uniqueImageUrls: 0,
            duplicateImageUrlsRemoved: 0,
            imagesValidated: 0,
            productsWithoutImages: 0,
            totalCsvRows: 2,
            skippedRows: 0,
            validRows: 2,
            invalidRows: 0,
          },
          skipped: [],
          categories: [],
          conflicts: [],
          warnings: [],
          errors: [],
          products: [
            {
              plannedMutation: "created",
              sku: "WC-680",
              slug: "oghi-0-5l",
              woocommerceId: 680,
              titleHy: "A",
              categories: [],
              warnings: [],
              errors: [],
              sourceImageUrls: [],
              images: [],
              status: "ACTIVE",
              priceAmount: 1000,
              stockOnHand: 999,
            },
            {
              plannedMutation: "created",
              sku: "WC-683",
              slug: "oghi-0-5l",
              woocommerceId: 683,
              titleHy: "B",
              categories: [],
              warnings: [],
              errors: [],
              sourceImageUrls: [],
              images: [],
              status: "ACTIVE",
              priceAmount: 1000,
              stockOnHand: 999,
            },
          ],
        },
      }),
    }));

    const { runApply } = await import("./apply");
    await expect(
      runApply({
        mode: "apply",
        csvPath: "x.csv",
        confirmImport: true,
        skipImageCheck: false,
        allowImageFailures: false,
        forceStock: false,
        imageConcurrency: 2,
      }),
    ).rejects.toThrow(/duplicate final slugs/i);
  });
});
