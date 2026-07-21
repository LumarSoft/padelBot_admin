import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function GET(request: NextRequest) {
  const qs = request.nextUrl.searchParams.toString();
  return proxyToApi(`/slots${qs ? `?${qs}` : ""}`);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => undefined);
  return proxyToApi("/slots", { method: "POST", body });
}
