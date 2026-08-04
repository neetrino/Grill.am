import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getProviders } from "@/config/providers";
import { getDb } from "@/db/client";
import { jobApplications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

type CvDownloadRouteContext = {
  params: Promise<{ id: string }>;
};

function toAbsoluteUrl(request: Request, target: string): string {
  if (/^https?:\/\//i.test(target)) {
    return target;
  }
  const origin = new URL(request.url).origin;
  return `${origin}${target.startsWith("/") ? target : `/${target}`}`;
}

/** Admin-only CV download via short-lived signed object URL. */
export async function GET(
  request: Request,
  context: CvDownloadRouteContext,
): Promise<Response> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const [application] = await getDb()
    .select({
      cvObjectKey: jobApplications.cvObjectKey,
      cvFileName: jobApplications.cvFileName,
      cvMimeType: jobApplications.cvMimeType,
    })
    .from(jobApplications)
    .where(eq(jobApplications.id, id))
    .limit(1);

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const signed = await getProviders().storage.createPresignedDownload({
    objectKey: application.cvObjectKey,
    fileName: application.cvFileName,
    contentType: application.cvMimeType,
  });

  return NextResponse.redirect(toAbsoluteUrl(request, signed.downloadUrl), 302);
}
