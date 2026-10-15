import type { NextRequest } from "next/server";
import { proxyToOpsApi } from "@/lib/api/ops-proxy";

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month");
  return proxyToOpsApi(
    `/ops/profitability${month ? `?month=${encodeURIComponent(month)}` : ""}`,
  );
}
