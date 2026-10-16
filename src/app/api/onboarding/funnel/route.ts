import type { NextRequest } from "next/server";
import { proxyPublicToApi } from "@/lib/api/proxy";

/**
 * The signup counts each screen a visitor reaches (once per page load), anonymously, so ops
 * can see where prospects drop out. Public like the signup itself.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => undefined);
  return proxyPublicToApi("/onboarding/funnel", { method: "POST", body });
}
