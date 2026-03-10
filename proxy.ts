import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildAuthHref } from "@/lib/auth-redirect";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /dashboard routes — check for session cookie
  if (pathname.startsWith("/dashboard")) {
    const sessionCookie =
      request.cookies.get("better-auth.session_token") ??
      request.cookies.get("__Secure-better-auth.session_token");

    if (!sessionCookie) {
      const redirectTarget = `${pathname}${request.nextUrl.search}`;
      return NextResponse.redirect(
        new URL(buildAuthHref(redirectTarget), request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
