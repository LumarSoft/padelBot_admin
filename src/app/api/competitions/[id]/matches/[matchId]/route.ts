import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

type Context = { params: Promise<{ id: string; matchId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id, matchId } = await params;
  const body = await request.json().catch(() => undefined);
  return proxyToApi(`/competitions/${id}/matches/${matchId}`, { method: "PATCH", body });
}
