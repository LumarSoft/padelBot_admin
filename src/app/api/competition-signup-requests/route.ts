import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function GET(request: NextRequest) {
  const params = new URLSearchParams();
  for (const key of ["status", "competitionId"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return proxyToApi(`/competition-signup-requests${qs ? `?${qs}` : ""}`);
}
