import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { OPS_SESSION_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/env";

/**
 * Next.js 16 "Proxy" (formerly Middleware). Optimistic auth only: it just
 * checks for the presence of the session cookie to redirect early. Real
 * authorization happens in the API and in server components (see lib/session).
 */

// Open to everyone, signed in or not: the marketing landing and the signup flow. `/register`
// MUST be here — it's the landing's main CTA, and a prospect has no session by definition.
// The legal/support pages are public too: Apple requires public Privacy Policy + Support URLs,
// and they must be reachable without a session.
const PUBLIC_ROUTES = [
  "/",
  "/register",
  "/privacidad",
  "/terminos",
  "/eliminar-datos",
  "/soporte",
];
// Only for logged-out users; a signed-in visitor is bounced to the panel.
const AUTH_ROUTES = ["/login"];
// A login form submitted before React hydrated used to fall back to a native GET and land as
// `?email=…&password=…`. The forms post now (see lib/api/login-form-post), but should one
// still arrive that way — a stale cached page, a hand-typed URL — it is bounced to the same
// URL without them, so the password doesn't linger in the address bar, history or a Referer.
const CREDENTIAL_PARAMS = ["email", "password"];

export function proxy(request: NextRequest): NextResponse {
  const { pathname, searchParams } = request.nextUrl;

  if (CREDENTIAL_PARAMS.some((name) => searchParams.has(name))) {
    const url = request.nextUrl.clone();
    CREDENTIAL_PARAMS.forEach((name) => url.searchParams.delete(name));
    return NextResponse.redirect(url);
  }

  // The Lumarsoft ops console is a world of its own: its own cookie, its own login, its
  // own redirect target. A club session grants nothing here (and vice versa), so it is
  // resolved BEFORE the panel's rules — otherwise a club owner's cookie would satisfy
  // the "hasSession" check below and walk straight into the cross-tenant console.
  if (pathname === "/ops" || pathname.startsWith("/ops/")) {
    const hasOpsSession = Boolean(
      request.cookies.get(OPS_SESSION_COOKIE_NAME)?.value,
    );
    const isOpsLogin = pathname === "/ops/login";

    if (hasOpsSession && isOpsLogin) {
      return NextResponse.redirect(new URL("/ops", request.url));
    }
    if (!hasOpsSession && !isOpsLogin) {
      return NextResponse.redirect(new URL("/ops/login", request.url));
    }
    return NextResponse.next();
  }

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
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|apple-icon|.*\\.svg$).*)",
  ],
};
