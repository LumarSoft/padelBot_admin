import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function GET() {
  return proxyToApi("/recurring-bookings");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => undefined);
  return proxyToApi("/recurring-bookings", { method: "POST", body });
}
