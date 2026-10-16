import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") ?? "";
  return proxyToApi(`/products/by-barcode?code=${encodeURIComponent(code)}`);
}
