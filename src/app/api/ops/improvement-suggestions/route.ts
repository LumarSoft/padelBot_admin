import type { NextRequest } from "next/server";
import { proxyToOpsApi } from "@/lib/api/ops-proxy";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return proxyToOpsApi(`/ops/improvement-suggestions${qs}`);
}
