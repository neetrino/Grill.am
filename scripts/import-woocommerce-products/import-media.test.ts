import { describe, expect, it, vi } from "vitest";

import type { ObjectStorageAdapter } from "@/lib/r2/types";

import type { ImportDatabase } from "./db";

describe("import media primary selection", () => {
  it("sets the first successful image as primary", async () => {
    const inserted: Array<{ id: string; isPrimary: boolean; sortOrder: number }> =
      [];
    let primaryAssigned = false;

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
        values: async (value: {
          id: string;
          isPrimary: boolean;
          sortOrder: number;
        }) => {
          inserted.push(value);
        },
      }),
      update: () => ({
        set: (value: { isPrimary?: boolean; role?: string }) => ({
          where: async () => {
            if (value.isPrimary === true) {
              primaryAssigned = true;
            }
          },
        }),
      }),
    } as unknown as ImportDatabase;

    const storage: ObjectStorageAdapter = {
      name: "test",
      async createPresignedUpload() {
        throw new Error("unused");
      },
      async createPresignedDownload() {
        throw new Error("unused");
      },
      async putObject() {
        return;
      },
      buildPublicUrl() {
        return "";
      },
      async deleteObject() {
        return;
      },
    };

    vi.resetModules();
    vi.doMock("./download-image", () => ({
      downloadProductImage: vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          code: "http_404",
          error: "fail first",
          httpStatus: 404,
          serverHint: null,
        })
        .mockResolvedValueOnce({
          ok: true,
          image: {
            body: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
            mimeType: "image/jpeg",
            extension: "jpg",
            byteSize: 4,
          },
          serverHint: null,
        }),
    }));

    const { importProductMedia } = await import("./import-media");
    const result = await importProductMedia(db, storage, {
      productId: "00000000-0000-7000-8000-000000000099",
      woocommerceId: 100,
      sku: "WC-100",
      images: [
        {
          sourceUrl: "https://example.com/1.jpg",
          index: 0,
          sourceHash: "hash00000001",
          plannedObjectKeyTemplate: "a",
        },
        {
          sourceUrl: "https://example.com/2.jpg",
          index: 1,
          sourceHash: "hash00000002",
          plannedObjectKeyTemplate: "b",
        },
      ],
    });

    expect(result.imagesUploaded).toBe(1);
    expect(result.imageFailures).toHaveLength(1);
    expect(result.primarySet).toBe(true);
    expect(primaryAssigned).toBe(true);
  });
});

describe("dry-run write guard", () => {
  it("documents dry-run as read-only mode in CLI options", async () => {
    const { parseCliArgs } = await import("./cli-args");
    const options = parseCliArgs(["node", "cli.ts", "--mode", "dry-run"]);
    expect(options.mode).toBe("dry-run");
    expect(options.confirmImport).toBe(false);
  });
});
