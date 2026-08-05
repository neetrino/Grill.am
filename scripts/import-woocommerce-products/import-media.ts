import { and, asc, eq } from "drizzle-orm";

import { mediaAssets } from "@/db/schema";
import { createId } from "@/lib/id";
import type { ObjectStorageAdapter } from "@/lib/r2/types";

import { downloadProductImage } from "./download-image";
import { buildProductImageObjectKey } from "./image-parser";
import type { ImportDatabase } from "./db";
import type { ImportIssue, ParsedImagePlan } from "./types";

export type ImportMediaResult = {
  finalObjectKeys: string[];
  imagesUploaded: number;
  imagesReused: number;
  imagesDownloaded: number;
  imageFailures: ImportIssue[];
  primarySet: boolean;
};

async function findMediaByObjectKey(
  db: ImportDatabase,
  objectKey: string,
): Promise<{ id: string; productId: string | null } | null> {
  const [row] = await db
    .select({
      id: mediaAssets.id,
      productId: mediaAssets.productId,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.objectKey, objectKey))
    .limit(1);
  return row ?? null;
}

async function setPrimaryMedia(
  db: ImportDatabase,
  productId: string,
  mediaId: string,
): Promise<void> {
  await db
    .update(mediaAssets)
    .set({ isPrimary: false, role: "GALLERY", updatedAt: new Date() })
    .where(
      and(eq(mediaAssets.productId, productId), eq(mediaAssets.isPrimary, true)),
    );

  await db
    .update(mediaAssets)
    .set({
      isPrimary: true,
      role: "PRIMARY",
      updatedAt: new Date(),
    })
    .where(eq(mediaAssets.id, mediaId));
}

/**
 * Downloads WooCommerce images, uploads to R2 with deterministic keys,
 * and creates media_assets rows without duplicates.
 */
export async function importProductMedia(
  db: ImportDatabase,
  storage: ObjectStorageAdapter,
  input: {
    productId: string;
    woocommerceId: number;
    sku: string;
    images: ParsedImagePlan[];
  },
): Promise<ImportMediaResult> {
  const result: ImportMediaResult = {
    finalObjectKeys: [],
    imagesUploaded: 0,
    imagesReused: 0,
    imagesDownloaded: 0,
    imageFailures: [],
    primarySet: false,
  };

  if (input.images.length === 0) {
    return result;
  }

  const existing = await db
    .select({
      id: mediaAssets.id,
      objectKey: mediaAssets.objectKey,
      isPrimary: mediaAssets.isPrimary,
      sortOrder: mediaAssets.sortOrder,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.productId, input.productId))
    .orderBy(asc(mediaAssets.sortOrder));

  let firstSuccessfulMediaId: string | null =
    existing.find((row) => row.isPrimary)?.id ?? existing[0]?.id ?? null;

  for (const image of input.images) {
    // Extension unknown until download; try common extensions for reuse lookup
    // by hashing into known READY rows for this product.
    const reusedExisting = existing.find((row) =>
      row.objectKey.includes(
        `woocommerce-${input.woocommerceId}-${image.index}-${image.sourceHash}.`,
      ),
    );

    if (reusedExisting) {
      result.finalObjectKeys.push(reusedExisting.objectKey);
      result.imagesReused += 1;
      if (!firstSuccessfulMediaId) {
        firstSuccessfulMediaId = reusedExisting.id;
      }
      continue;
    }

    const downloaded = await downloadProductImage(image.sourceUrl);
    if (!downloaded.ok) {
      result.imageFailures.push({
        code: "image_download_failed",
        message: downloaded.error,
        woocommerceId: input.woocommerceId,
        sku: input.sku,
      });
      continue;
    }

    result.imagesDownloaded += 1;
    const objectKey = buildProductImageObjectKey({
      productId: input.productId,
      woocommerceId: input.woocommerceId,
      index: image.index,
      sourceUrl: image.sourceUrl,
      extension: downloaded.image.extension,
    });

    const existingByKey = await findMediaByObjectKey(db, objectKey);
    if (existingByKey) {
      result.finalObjectKeys.push(objectKey);
      result.imagesReused += 1;
      if (!firstSuccessfulMediaId) {
        firstSuccessfulMediaId = existingByKey.id;
      }
      continue;
    }

    let uploaded = false;
    try {
      await storage.putObject({
        objectKey,
        body: downloaded.image.body,
        contentType: downloaded.image.mimeType,
      });
      uploaded = true;

      const mediaId = createId();
      await db.insert(mediaAssets).values({
        id: mediaId,
        objectKey,
        mimeType: downloaded.image.mimeType,
        byteSize: downloaded.image.byteSize,
        uploadStatus: "READY",
        role: "GALLERY",
        sortOrder: image.index,
        isPrimary: false,
        productId: input.productId,
        checksum: image.sourceHash,
      });

      result.finalObjectKeys.push(objectKey);
      result.imagesUploaded += 1;
      if (!firstSuccessfulMediaId) {
        firstSuccessfulMediaId = mediaId;
      }
    } catch (error) {
      if (uploaded) {
        try {
          await storage.deleteObject(objectKey);
        } catch {
          result.imageFailures.push({
            code: "r2_cleanup_failed",
            message: `Failed to clean up R2 object after DB error: ${objectKey}`,
            woocommerceId: input.woocommerceId,
            sku: input.sku,
          });
        }
      }
      result.imageFailures.push({
        code: "image_upload_failed",
        message:
          error instanceof Error ? error.message : "Image upload/DB insert failed",
        woocommerceId: input.woocommerceId,
        sku: input.sku,
      });
    }
  }

  if (firstSuccessfulMediaId) {
    await setPrimaryMedia(db, input.productId, firstSuccessfulMediaId);
    result.primarySet = true;
  }

  return result;
}
