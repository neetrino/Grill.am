import { describe, expect, it } from "vitest";

import { CONTENT_SECURITY_POLICY } from "@/config/content-security-policy";

function directiveSources(name: string): string {
  const prefix = `${name} `;
  const directive = CONTENT_SECURITY_POLICY.split("; ").find((entry) =>
    entry.startsWith(prefix),
  );
  if (!directive) {
    throw new Error(`Missing CSP directive: ${name}`);
  }
  return directive.slice(prefix.length);
}

describe("CONTENT_SECURITY_POLICY", () => {
  it("allows Vercel Live feedback scripts on Vercel deployments", () => {
    expect(directiveSources("script-src")).toContain("https://vercel.live");
  });

  it("allows Vercel Live styles, fonts, and frames", () => {
    expect(directiveSources("style-src")).toContain("https://vercel.live");
    expect(directiveSources("font-src")).toContain("https://vercel.live");
    expect(directiveSources("font-src")).toContain("https://assets.vercel.com");
    expect(directiveSources("frame-src")).toContain("https://vercel.live");
  });

  it("keeps chat widget script hosts", () => {
    const scriptSrc = directiveSources("script-src");
    expect(scriptSrc).toContain("https://code.tidio.co");
    expect(scriptSrc).toContain("https://*.tidio.co");
    expect(scriptSrc).toContain("https://*.tidiochat.com");
    expect(scriptSrc).toContain("https://client.crisp.chat");
  });
});
