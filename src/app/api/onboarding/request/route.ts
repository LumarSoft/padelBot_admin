import type { NextRequest } from "next/server";
import { proxyPublicToApi } from "@/lib/api/proxy";

/**
 * The signup lead form. Public on purpose: whoever fills this in is a prospect, not a user,
 * so there is no session to attach — going through the authenticated proxy 401'd every
 * signup. The API leaves this route unguarded and rate-limits it (3/min per IP).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => undefined);
  return proxyPublicToApi("/onboarding/request", { method: "POST", body });
}
