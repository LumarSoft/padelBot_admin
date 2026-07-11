import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function GET() {
  return proxyToApi("/users");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => undefined);
  return proxyToApi("/users", { method: "POST", body });
}
