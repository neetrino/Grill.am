import { handleIdramBrowserReturn } from "@/features/payments/providers/idram/browser-return";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Legacy WooCommerce SUCCESS_URL compatibility:
 * https://grill.am/wc-api/idram_complete
 * UX only — never captures payment.
 */
export async function GET(request: Request) {
  return handleIdramBrowserReturn(request, "success");
}

export async function POST(request: Request) {
  return handleIdramBrowserReturn(request, "success");
}
