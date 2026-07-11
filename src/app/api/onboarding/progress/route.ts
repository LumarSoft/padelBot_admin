import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => undefined);
  return proxyToApi("/onboarding/progress", { method: "PATCH", body });
}
