import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const body = await request.json().catch(() => undefined);
  return proxyToApi(`/recurring-bookings/${id}`, { method: "PATCH", body });
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  return proxyToApi(`/recurring-bookings/${id}`, { method: "DELETE" });
}
