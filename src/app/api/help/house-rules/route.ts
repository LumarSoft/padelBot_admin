import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function GET() {
  return proxyToApi("/help/house-rules");
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => undefined);
  return proxyToApi("/help/house-rules", { method: "PATCH", body });
}
