import type { NextRequest } from "next/server";
import { proxyToOpsApi } from "@/lib/api/ops-proxy";

export async function GET(request: NextRequest) {
  const days = request.nextUrl.searchParams.get("days");
  return proxyToOpsApi(`/ops/signup-funnel${days ? `?days=${encodeURIComponent(days)}` : ""}`);
}
