import {
  MEDIA_IMAGE_MAX_BYTES,
  extensionForImageMime,
  validateImageBytes,
} from "@/lib/media/image-file";

import {
  IMAGE_FETCH_TIMEOUT_MS,
  IMAGE_MAX_REDIRECTS,
} from "./constants";

export type ImageFailureCode =
  | "http_403"
  | "http_404"
  | "http_error"
  | "timeout"
  | "invalid_mime"
  | "oversized_image"
  | "corrupted_image"
  | "network_error";

export type DownloadedImage = {
  body: Buffer;
  mimeType: string;
  extension: string;
  byteSize: number;
};

export type DownloadImageSuccess = {
  ok: true;
  image: DownloadedImage;
  serverHint: string | null;
};

export type DownloadImageFailure = {
  ok: false;
  code: ImageFailureCode;
  error: string;
  httpStatus: number | null;
  serverHint: string | null;
};

export type DownloadImageResult = DownloadImageSuccess | DownloadImageFailure;

const TRANSIENT_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36";
const DEFAULT_ACCEPT =
  "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8";
const DEFAULT_ACCEPT_LANGUAGE = "hy-AM,hy;q=0.9,en-US;q=0.8,en;q=0.7";
const DEFAULT_REFERER = "https://grill.am/";

export type ImageRequestHeaders = {
  userAgent: string;
  referer: string;
  cookie?: string;
};

export type ImageHeaderEnv = {
  WC_IMAGE_USER_AGENT?: string;
  WC_IMAGE_REFERER?: string;
  WC_IMAGE_COOKIE?: string;
};

/** Resolves browser-compatible image request headers from env (no secrets logged). */
export function resolveImageRequestHeaders(
  env: ImageHeaderEnv | NodeJS.ProcessEnv = process.env,
): ImageRequestHeaders {
  const source = env as ImageHeaderEnv;
  return {
    userAgent: source.WC_IMAGE_USER_AGENT?.trim() || DEFAULT_USER_AGENT,
    referer: source.WC_IMAGE_REFERER?.trim() || DEFAULT_REFERER,
    cookie: source.WC_IMAGE_COOKIE?.trim() || undefined,
  };
}

/**
 * Percent-encodes URL path segments for Armenian/Cyrillic/spaces while
 * avoiding double-encoding of already-encoded components.
 */
export function encodeImageSourceUrl(raw: string): string {
  const trimmed = raw.trim();
  const parsed = new URL(trimmed);

  parsed.pathname = parsed.pathname
    .split("/")
    .map((segment) => {
      if (!segment) return segment;
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join("/");

  return parsed.toString();
}

function buildRequestHeaders(headers: ImageRequestHeaders): HeadersInit {
  const result: Record<string, string> = {
    "User-Agent": headers.userAgent,
    Accept: DEFAULT_ACCEPT,
    "Accept-Language": DEFAULT_ACCEPT_LANGUAGE,
    Referer: headers.referer,
    "Cache-Control": "no-cache",
  };
  if (headers.cookie) {
    result.Cookie = headers.cookie;
  }
  return result;
}

function detectServerHint(response: Response): string | null {
  const server = response.headers.get("server")?.toLowerCase() ?? "";
  if (response.headers.has("cf-ray") || server.includes("cloudflare")) {
    return "cloudflare";
  }
  if (server.includes("nginx")) return "nginx";
  if (server.includes("apache")) return "apache";
  if (server) return server.slice(0, 64);
  return null;
}

function detectMimeFromMagic(body: Buffer): string | null {
  if (body.length >= 3 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    body.length >= 8 &&
    body[0] === 0x89 &&
    body[1] === 0x50 &&
    body[2] === 0x4e &&
    body[3] === 0x47
  ) {
    return "image/png";
  }
  if (body.length >= 6 && body.toString("ascii", 0, 6) === "GIF87a") {
    return "image/gif";
  }
  if (body.length >= 6 && body.toString("ascii", 0, 6) === "GIF89a") {
    return "image/gif";
  }
  if (
    body.length >= 12 &&
    body.toString("ascii", 0, 4) === "RIFF" &&
    body.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchGetWithRedirects(
  url: string,
  headers: ImageRequestHeaders,
  redirectsLeft: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: buildRequestHeaders(headers),
    });

    if ([301, 302, 303, 307, 308].includes(response.status) && redirectsLeft > 0) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error(`Redirect without Location header (${response.status})`);
      }
      const nextUrl = encodeImageSourceUrl(new URL(location, url).toString());
      if (!/^https?:\/\//i.test(nextUrl)) {
        throw new Error(`Unsafe redirect target`);
      }
      // Drain body to free the socket before following redirect.
      await response.arrayBuffer().catch(() => undefined);
      return fetchGetWithRedirects(nextUrl, headers, redirectsLeft - 1);
    }

    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function readBodyWithLimit(
  response: Response,
  maxBytes: number,
): Promise<
  | { ok: true; body: Buffer }
  | { ok: false; code: "oversized_image"; error: string }
> {
  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    const declared = Number(contentLength);
    if (Number.isFinite(declared) && declared > maxBytes) {
      await response.arrayBuffer().catch(() => undefined);
      return {
        ok: false,
        code: "oversized_image",
        error: `Image Content-Length ${declared} exceeds ${maxBytes} bytes.`,
      };
    }
  }

  if (!response.body) {
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > maxBytes) {
      return {
        ok: false,
        code: "oversized_image",
        error: `Image exceeds ${maxBytes} bytes.`,
      };
    }
    return { ok: true, body: Buffer.from(arrayBuffer) };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return {
        ok: false,
        code: "oversized_image",
        error: `Image exceeds ${maxBytes} bytes.`,
      };
    }
    chunks.push(value);
  }

  return { ok: true, body: Buffer.concat(chunks.map((c) => Buffer.from(c))) };
}

function failureFromStatus(
  status: number,
  serverHint: string | null,
): DownloadImageFailure {
  if (status === 403) {
    return {
      ok: false,
      code: "http_403",
      error: `HTTP 403 Forbidden${serverHint ? ` (server: ${serverHint})` : ""}`,
      httpStatus: 403,
      serverHint,
    };
  }
  if (status === 404) {
    return {
      ok: false,
      code: "http_404",
      error: "HTTP 404 Not Found",
      httpStatus: 404,
      serverHint,
    };
  }
  return {
    ok: false,
    code: "http_error",
    error: `HTTP ${status}${serverHint ? ` (server: ${serverHint})` : ""}`,
    httpStatus: status,
    serverHint,
  };
}

async function downloadOnce(
  encodedUrl: string,
  headers: ImageRequestHeaders,
  maxBytes: number,
): Promise<DownloadImageResult> {
  try {
    const response = await fetchGetWithRedirects(
      encodedUrl,
      headers,
      IMAGE_MAX_REDIRECTS,
    );
    const serverHint = detectServerHint(response);

    if (!response.ok) {
      await response.arrayBuffer().catch(() => undefined);
      return failureFromStatus(response.status, serverHint);
    }

    const bodyResult = await readBodyWithLimit(response, maxBytes);
    if (!bodyResult.ok) {
      return {
        ok: false,
        code: bodyResult.code,
        error: bodyResult.error,
        httpStatus: response.status,
        serverHint,
      };
    }

    const body = bodyResult.body;
    if (body.byteLength === 0) {
      return {
        ok: false,
        code: "corrupted_image",
        error: "Downloaded image is empty.",
        httpStatus: response.status,
        serverHint,
      };
    }

    const magicMime = detectMimeFromMagic(body);
    if (!magicMime) {
      return {
        ok: false,
        code: "invalid_mime",
        error: "Unrecognized or corrupted image bytes (magic-byte check failed).",
        httpStatus: response.status,
        serverHint,
      };
    }

    const validationError = validateImageBytes(magicMime, body.byteLength, maxBytes);
    if (validationError) {
      const code: ImageFailureCode = validationError.includes("MB or smaller")
        ? "oversized_image"
        : "invalid_mime";
      return {
        ok: false,
        code,
        error: validationError,
        httpStatus: response.status,
        serverHint,
      };
    }

    return {
      ok: true,
      image: {
        body,
        mimeType: magicMime,
        extension: extensionForImageMime(magicMime),
        byteSize: body.byteLength,
      },
      serverHint,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image download failed";
    const isTimeout =
      (error instanceof Error && error.name === "AbortError") ||
      /aborted|timeout/i.test(message);
    return {
      ok: false,
      code: isTimeout ? "timeout" : "network_error",
      error: isTimeout ? "Image download timed out." : message,
      httpStatus: null,
      serverHint: null,
    };
  }
}

/**
 * Downloads and validates a remote WooCommerce product image via GET.
 * Used by both dry-run validation and apply-mode upload.
 */
export async function downloadProductImage(
  sourceUrl: string,
  options?: {
    headers?: ImageRequestHeaders;
    maxBytes?: number;
  },
): Promise<DownloadImageResult> {
  const headers = options?.headers ?? resolveImageRequestHeaders();
  const maxBytes = options?.maxBytes ?? MEDIA_IMAGE_MAX_BYTES;
  const encodedUrl = encodeImageSourceUrl(sourceUrl);

  let attempt = 0;
  let lastFailure: DownloadImageFailure | null = null;
  let retried403 = false;

  while (attempt < MAX_RETRIES) {
    attempt += 1;
    const result = await downloadOnce(encodedUrl, headers, maxBytes);
    if (result.ok) return result;

    lastFailure = result;

    if (result.code === "http_404") {
      return result;
    }

    if (result.code === "http_403" && !retried403) {
      retried403 = true;
      // Retry once with the same browser-compatible headers (explicit second attempt).
      await sleep(250);
      continue;
    }

    if (
      result.httpStatus != null &&
      TRANSIENT_STATUS.has(result.httpStatus) &&
      attempt < MAX_RETRIES
    ) {
      await sleep(250 * 2 ** (attempt - 1));
      continue;
    }

    if (result.code === "timeout" && attempt < MAX_RETRIES) {
      await sleep(250 * 2 ** (attempt - 1));
      continue;
    }

    return result;
  }

  return (
    lastFailure ?? {
      ok: false,
      code: "network_error",
      error: "Image download failed after retries.",
      httpStatus: null,
      serverHint: null,
    }
  );
}

/** Dry-run alias: same GET + byte validation path as apply downloads. */
export async function validateRemoteImage(
  sourceUrl: string,
): Promise<DownloadImageResult> {
  return downloadProductImage(sourceUrl);
}
