import { handleIdramBrowserReturn } from "@/features/payments/providers/idram/browser-return";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Official FAIL_URL — browser UX only (Merchant API §1). Never calls failPayment. */
export async function GET(request: Request) {
  return handleIdramBrowserReturn(request, "fail");
}

export async function POST(request: Request) {
  return handleIdramBrowserReturn(request, "fail");
}
