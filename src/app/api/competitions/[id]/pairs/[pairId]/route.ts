import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

type Context = { params: Promise<{ id: string; pairId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id, pairId } = await params;
  const body = await request.json().catch(() => undefined);
  return proxyToApi(`/competitions/${id}/pairs/${pairId}`, { method: "PATCH", body });
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id, pairId } = await params;
  return proxyToApi(`/competitions/${id}/pairs/${pairId}`, { method: "DELETE" });
}
