/**
 * Storefront Content-Security-Policy.
 *
 * Vercel Live (`https://vercel.live`) is required for Comments / Toolbar
 * scripts injected on Vercel deployments. Chat hosts cover Crisp.
 *
 * @see https://vercel.com/docs/vercel-toolbar/managing-toolbar#using-a-content-security-policy
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://client.crisp.chat https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://client.crisp.chat https://vercel.live",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://client.crisp.chat https://vercel.live https://assets.vercel.com",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https://www.google.com https://maps.google.com https://yandex.ru https://yandex.com https://*.yandex.ru https://*.yandex.com https://*.crisp.chat https://game.crisp.chat https://vercel.live",
  "worker-src 'self' blob: https://client.crisp.chat",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://banking.idram.am",
].join("; ");
