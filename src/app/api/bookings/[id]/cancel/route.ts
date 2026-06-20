import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  return proxyToApi(`/bookings/${id}/cancel`, { method: "PATCH" });
}
