import { handleIdramBrowserReturn } from "@/features/payments/providers/idram/browser-return";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Legacy WooCommerce FAIL_URL compatibility:
 * https://grill.am/wc-api/idram_fail
 * UX only — never fails/captures payment.
 */
export async function GET(request: Request) {
  return handleIdramBrowserReturn(request, "fail");
}

export async function POST(request: Request) {
  return handleIdramBrowserReturn(request, "fail");
}
