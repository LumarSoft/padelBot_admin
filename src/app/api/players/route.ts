import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search");
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return proxyToApi(`/players${qs}`);
}
