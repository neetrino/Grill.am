import {
  handleIdramResultMethodNotAllowed,
  handleIdramResultPost,
} from "@/features/payments/providers/idram/handle-idram-result";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Legacy WooCommerce RESULT_URL compatibility:
 * https://grill.am/wc-api/idram_result
 * Same shared handler as /api/v1/payments/idram/result — no redirect.
 */
export async function POST(request: Request) {
  return handleIdramResultPost(request);
}

export async function GET() {
  return handleIdramResultMethodNotAllowed();
}
