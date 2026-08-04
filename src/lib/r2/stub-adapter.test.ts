import { describe, expect, it } from "vitest";

import { isR2Configured } from "@/lib/r2/is-configured";
import { createStubObjectStorageAdapter } from "@/lib/r2/stub-adapter";

describe("createStubObjectStorageAdapter", () => {
  it("builds relative public URLs when base is empty", () => {
    const storage = createStubObjectStorageAdapter("");
    expect(storage.buildPublicUrl("uploads/products/a.jpg")).toBe(
      "/uploads/products/a.jpg",
    );
  });

  it("builds absolute public URLs when base is set", () => {
    const storage = createStubObjectStorageAdapter(
      "https://cdn.example.com/",
    );
    expect(storage.buildPublicUrl("uploads/products/a.jpg")).toBe(
      "https://cdn.example.com/uploads/products/a.jpg",
    );
  });

  it("creates download URLs from the public base", async () => {
    const storage = createStubObjectStorageAdapter("https://cdn.example.com");
    const signed = await storage.createPresignedDownload({
      objectKey: "uploads/careers/applications/a/cv.pdf",
      fileName: "cv.pdf",
    });
    expect(signed.downloadUrl).toBe(
      "https://cdn.example.com/uploads/careers/applications/a/cv.pdf",
    );
  });
});

describe("isR2Configured", () => {
  it("requires every credential field", () => {
    expect(
      isR2Configured({
        accountId: "a",
        accessKeyId: "b",
        secretAccessKey: "c",
        bucketName: "d",
        publicBaseUrl: "https://cdn.example.com",
      }),
    ).toBe(true);

    expect(
      isR2Configured({
        accountId: "a",
        accessKeyId: "b",
        secretAccessKey: "c",
        bucketName: "d",
      }),
    ).toBe(false);
  });
});
