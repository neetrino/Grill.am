#!/usr/bin/env node

/**
 * Uploads `public/assets/**` to Cloudflare R2 with keys matching public paths
 * (e.g. `assets/home/hero-chicken.webp`). Idempotent overwrite.
 *
 * Usage: pnpm sync:static-assets
 */

import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config as loadDotenv } from "dotenv";

const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
loadDotenv({ path: join(repoRoot, ".env") });

const CONTENT_TYPES = {
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
};

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function listFilesRecursive(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(full));
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function contentTypeFor(filePath) {
  const ext = extname(filePath).toLowerCase();
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

async function main() {
  const accountId = requireEnv("R2_ACCOUNT_ID");
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY");
  const bucketName = requireEnv("R2_BUCKET_NAME");
  const endpoint =
    process.env.R2_ENDPOINT?.trim().replace(/\/$/, "") ||
    `https://${accountId}.r2.cloudflarestorage.com`;

  const assetsRoot = join(repoRoot, "public", "assets");
  const publicRoot = join(repoRoot, "public");
  if (!existsSync(assetsRoot)) {
    throw new Error(`Assets directory not found: ${assetsRoot}`);
  }

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  const files = listFilesRecursive(assetsRoot);
  let uploaded = 0;
  let failed = 0;

  console.log(`Syncing ${files.length} files from public/assets → R2 bucket "${bucketName}"`);

  for (const filePath of files) {
    const objectKey = relative(publicRoot, filePath).split("\\").join("/");
    const contentType = contentTypeFor(filePath);
    const size = statSync(filePath).size;

    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
          Body: createReadStream(filePath),
          ContentType: contentType,
          ContentLength: size,
        }),
      );
      uploaded += 1;
      console.log(`uploaded  ${objectKey} (${contentType}, ${size} bytes)`);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`failed    ${objectKey}: ${message}`);
    }
  }

  console.log(`Done. uploaded=${uploaded} failed=${failed}`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
