import "server-only";

import { NextResponse } from "next/server";
import { getOpsSessionToken } from "@/lib/ops-session";
import { apiServerFetch } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/api-error";
import { logger } from "@/lib/logger";

interface OpsProxyOptions {
  method?: string;
  body?: unknown;
}

/**
 * Forwards a request to the API's `/ops/*` routes with the OPS token from the ops cookie.
 *
 * Separate from `proxyToApi` on purpose: that one attaches the CLUB session token, which
 * the API's ops guard cannot verify at all (different secret). Pointing an ops BFF route at
 * the club proxy therefore fails closed with a 401 rather than leaking anything — but it
 * would still be a bug, and having two named functions makes it an obvious one.
 */
export async function proxyToOpsApi(
  apiPath: string,
  options: OpsProxyOptions = {},
): Promise<NextResponse> {
  const token = await getOpsSessionToken();
  if (!token) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

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
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message, fieldErrors: error.fieldErrors },
        { status: error.status },
      );
    }
    logger.error("ops.proxy", "Unexpected ops proxy failure", {
      apiPath,
      error: String(error),
    });
    return NextResponse.json(
      { message: "Error inesperado. Intentá de nuevo." },
      { status: 500 },
    );
  }
}
