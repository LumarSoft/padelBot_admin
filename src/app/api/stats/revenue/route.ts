import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function GET(request: NextRequest) {
  const qs = request.nextUrl.searchParams.toString();
  return proxyToApi(`/stats/revenue${qs ? `?${qs}` : ""}`);
}
