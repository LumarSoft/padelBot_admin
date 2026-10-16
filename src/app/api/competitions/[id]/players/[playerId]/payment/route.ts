import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

type Context = { params: Promise<{ id: string; playerId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id, playerId } = await params;
  const body = await request.json().catch(() => undefined);
  return proxyToApi(`/competitions/${id}/players/${playerId}/payment`, { method: "PATCH", body });
}
