import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { defaultLocale, isLocale } from "@/lib/i18n/config";

function nextWithPathname(request: NextRequest, pathname: string): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

const PUBLIC_ASSET =
  /\.(?:ico|png|jpg|jpeg|webp|svg|gif|txt|xml|json|webmanifest)$/i;

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/wc-api") ||
    pathname.startsWith("/assets/") ||
    pathname === "/og-image.png" ||
    pathname === "/apple-icon.png" ||
    pathname === "/icon.png" ||
    PUBLIC_ASSET.test(pathname)
  ) {
    return nextWithPathname(request, pathname);
  }

  const pathLocale = pathname.split("/")[1];

  if (pathLocale && isLocale(pathLocale)) {
    return nextWithPathname(request, pathname);
  }

  const url = request.nextUrl.clone();
  url.pathname =
    pathname === "/"
      ? `/${defaultLocale}`
      : `/${defaultLocale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|og-image.png|apple-icon.png|icon.png|assets/).*)",
  ],
};
