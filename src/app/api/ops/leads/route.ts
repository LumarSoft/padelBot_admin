import type { NextRequest } from "next/server";
import { proxyToOpsApi } from "@/lib/api/ops-proxy";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const due = params.get("due");
  const status = params.get("status");
  const qs = due ? `?due=${encodeURIComponent(due)}` : status ? `?status=${encodeURIComponent(status)}` : "";
  return proxyToOpsApi(`/ops/leads${qs}`);
}
