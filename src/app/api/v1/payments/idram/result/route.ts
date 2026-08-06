import {
  handleIdramResultMethodNotAllowed,
  handleIdramResultPost,
} from "@/features/payments/providers/idram/handle-idram-result";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Official iDram RESULT_URL (Merchant API §4).
 * Two POST stages: precheck (EDP_PRECHECK=YES) and payment confirmation.
 * Returns exact "OK" without HTML/JSON on success.
 */
export async function POST(request: Request) {
  return handleIdramResultPost(request);
}

export async function GET() {
  return handleIdramResultMethodNotAllowed();
}
