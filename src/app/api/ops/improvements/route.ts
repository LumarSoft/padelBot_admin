import type { NextRequest } from "next/server";
import { proxyToOpsApi } from "@/lib/api/ops-proxy";

export async function GET() {
  return proxyToOpsApi("/ops/improvements");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => undefined);
  return proxyToOpsApi("/ops/improvements", { method: "POST", body });
}
