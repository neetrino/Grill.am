import { handleIdramBrowserReturn } from "@/features/payments/providers/idram/browser-return";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Official SUCCESS_URL — browser UX only (Merchant API §1). */
export async function GET(request: Request) {
  return handleIdramBrowserReturn(request, "success");
}

export async function POST(request: Request) {
  return handleIdramBrowserReturn(request, "success");
}
