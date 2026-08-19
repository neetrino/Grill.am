import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CONTENT_SECURITY_POLICY } from "./src/config/content-security-policy";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** LAN IPv4s so a phone can load `/_next/*` when the Mac DHCP address changes. */
function lanDevOrigins(): string[] {
  const origins = new Set(["127.0.0.1", "localhost"]);
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal) {
        origins.add(address.address);
      }
    }
  }
  return [...origins];
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: CONTENT_SECURITY_POLICY,
  },
];

function buildImageRemotePatterns(): NonNullable<
  NextConfig["images"]
>["remotePatterns"] {
  // `remotePatterns` is evaluated at build time. Always allow R2 public hosts so
  // Vercel builds work even when R2_PUBLIC_BASE_URL is only set at runtime.
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    {
      protocol: "https",
      hostname: "images.pexels.com",
    },
    {
      protocol: "https",
      hostname: "**.r2.dev",
      pathname: "/**",
    },
  ];

  const r2Base =
    process.env.R2_PUBLIC_BASE_URL || process.env.R2_PUBLIC_URL;
  if (r2Base) {
    try {
      const url = new URL(r2Base);
      if (url.protocol === "https:" || url.protocol === "http:") {
        patterns.push({
          protocol: url.protocol.replace(":", "") as "http" | "https",
          hostname: url.hostname,
          pathname: "/**",
        });
      }
    } catch {
      // Invalid R2 public base — wildcard *.r2.dev still covers default public URLs.
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  // Allow LAN access in `next dev` (phone / other Mac via local IP).
  // Without this, Next blocks `/_next/*` (JS/CSS/HMR) and the UI looks blank.
  // Playwright E2E uses http://127.0.0.1:3100 — must be allowlisted too.
  allowedDevOrigins: lanDevOrigins(),
  turbopack: {
    root: projectRoot,
  },
  // Match MEDIA_IMAGE_MAX_BYTES (5MB) × up to 12 product images + multipart overhead.
  experimental: {
    serverActions: {
      bodySizeLimit: "64mb",
    },
  },
  images: {
    remotePatterns: buildImageRemotePatterns(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
