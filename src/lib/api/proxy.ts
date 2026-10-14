import "server-only";

import { NextResponse } from "next/server";
import { clearSessionCookie, getSessionToken } from "@/lib/session";
import { apiServerFetch } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/api-error";
import { SESSION_ENDED_HEADER } from "@/lib/api/session-ended";
import { logger } from "@/lib/logger";

interface ProxyOptions {
  method?: string;
  body?: unknown;
}

/**
 * Forwards a request to gtp_api, attaching the session JWT from the cookie.
 * Used by the internal BFF route handlers so the token never reaches the browser.
 */
export async function proxyToApi(
  apiPath: string,
  options: ProxyOptions = {},
): Promise<NextResponse> {
  const token = await getSessionToken();
  if (!token) {
    return endSessionResponse("No autorizado.");
  }
  return forward(apiPath, options, token);
}

/**
 * Same, for endpoints the API itself exposes publicly (the signup lead form). A prospect
 * has no session by definition, so requiring one here would 401 every signup — which is
 * exactly what it used to do.
 *
 * Only ever point this at routes that are unguarded in the API; it sends no credentials.
 */
export async function proxyPublicToApi(
  apiPath: string,
  options: ProxyOptions = {},
): Promise<NextResponse> {
  return forward(apiPath, options);
}

async function forward(
  apiPath: string,
  options: ProxyOptions,
  token?: string,
): Promise<NextResponse> {
  try {
    const data = await apiServerFetch<unknown>(apiPath, {
      method: options.method ?? "GET",
      body: options.body,
      token,
    });
    if (data === undefined) {
      return new NextResponse(null, { status: 204 });
    }
    return NextResponse.json(data);
  } catch (error) {
    // On an authenticated call the API answers 401 only when the session itself is no longer
    // valid: the token expired, or its user was deactivated or moved to another club (the API
    // checks that on every request). Drop the cookie, so the panel doesn't sit there with a
    // session whose every request fails, and tell the browser client to go to /login.
    if (token && error instanceof ApiError && error.status === 401) {
      return endSessionResponse(error.message);
    }
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message, fieldErrors: error.fieldErrors },
        { status: error.status },
      );
    }
    logger.error("api.proxy", "Unexpected proxy failure", {
      apiPath,
      error: String(error),
    });
    return NextResponse.json(
      { message: "Error inesperado. Intentá de nuevo." },
      { status: 500 },
    );
  }
}

/**
 * Drops the session cookie and answers the `401` that sends the browser client to /login.
 * For any BFF route whose authenticated call to the API came back `401`.
 */
export async function endSessionResponse(message: string): Promise<NextResponse> {
  await clearSessionCookie();
  return NextResponse.json(
    { message },
    { status: 401, headers: { [SESSION_ENDED_HEADER]: "1" } },
  );
}
