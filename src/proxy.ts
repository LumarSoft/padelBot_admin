import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/env";

/**
 * Next.js 16 "Proxy" (formerly Middleware). Optimistic auth only: it just
 * checks for the presence of the session cookie to redirect early. Real
 * authorization happens in the API and in server components (see lib/session).
 */

const PUBLIC_ROUTES = ["/login"];

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Not signed in and trying to reach a protected route → go to /login.
  if (!hasSession && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Signed in but on a public (auth) route → go to the dashboard.
  if (hasSession && isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes, Next internals and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
