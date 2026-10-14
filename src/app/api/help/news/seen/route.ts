import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function GET() {
  return proxyToApi("/help/news/seen");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => undefined);
  return proxyToApi("/help/news/seen", { method: "POST", body });
}
