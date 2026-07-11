import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/env";

/**
 * Next.js 16 "Proxy" (formerly Middleware). Optimistic auth only: it just
 * checks for the presence of the session cookie to redirect early. Real
 * authorization happens in the API and in server components (see lib/session).
 */

// Open to everyone, signed in or not: the marketing landing and the signup flow. `/register`
// MUST be here — it's the landing's main CTA, and a prospect has no session by definition.
const PUBLIC_ROUTES = ["/", "/register"];
// Only for logged-out users; a signed-in visitor is bounced to the panel.
const AUTH_ROUTES = ["/login"];

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  // Signed in but on an auth route (login) → go to the panel.
  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL("/panel", request.url));
  }

  // Not signed in and trying to reach a protected route → go to /login.
  if (!hasSession && !isPublicRoute && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes, Next internals and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
