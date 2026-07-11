import type { NextRequest } from "next/server";
import { proxyToOpsApi } from "@/lib/api/ops-proxy";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  return proxyToOpsApi(`/ops/leads${status ? `?status=${status}` : ""}`);
}
