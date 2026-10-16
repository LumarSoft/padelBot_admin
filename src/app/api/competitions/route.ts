import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function GET(request: NextRequest) {
  const params = new URLSearchParams();
  for (const key of ["kind", "status"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return proxyToApi(`/competitions${qs ? `?${qs}` : ""}`);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => undefined);
  return proxyToApi("/competitions", { method: "POST", body });
}
