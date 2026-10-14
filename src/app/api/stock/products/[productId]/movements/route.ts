import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

type Context = { params: Promise<{ productId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { productId } = await params;
  const qs = request.nextUrl.searchParams.toString();
  return proxyToApi(`/stock/products/${productId}/movements${qs ? `?${qs}` : ""}`);
}
