import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => undefined);
  return proxyToApi("/slots/bulk-unblock", { method: "POST", body });
}
