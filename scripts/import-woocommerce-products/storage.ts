import { createR2ObjectStorageAdapter } from "@/lib/r2/r2-adapter";
import { isR2Configured } from "@/lib/r2/is-configured";
import { createStubObjectStorageAdapter } from "@/lib/r2/stub-adapter";
import type { ObjectStorageAdapter } from "@/lib/r2/types";

import { getImportEnv } from "./env";

/** Builds the project storage adapter for apply-mode image uploads. */
export function createImportStorage(): ObjectStorageAdapter {
  const env = getImportEnv();
  const publicBaseUrl = env.R2_PUBLIC_BASE_URL ?? env.R2_PUBLIC_URL;
  const r2 = {
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucketName: env.R2_BUCKET_NAME,
    publicBaseUrl,
  };

  if (isR2Configured(r2)) {
    return createR2ObjectStorageAdapter({
      ...r2,
      endpoint: env.R2_ENDPOINT,
    });
  }

  return createStubObjectStorageAdapter(publicBaseUrl ?? "");
}
