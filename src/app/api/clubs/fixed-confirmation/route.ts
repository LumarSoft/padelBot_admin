import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function GET() {
  return proxyToApi("/clubs/me/fixed-confirmation");
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => undefined);
  return proxyToApi("/clubs/me/fixed-confirmation", { method: "PATCH", body });
}
