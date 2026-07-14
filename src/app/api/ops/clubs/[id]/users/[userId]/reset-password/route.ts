import type { NextRequest } from "next/server";
import { proxyToOpsApi } from "@/lib/api/ops-proxy";

type Context = { params: Promise<{ id: string; userId: string }> };

export async function POST(_request: NextRequest, { params }: Context) {
  const { id, userId } = await params;
  return proxyToOpsApi(`/ops/clubs/${id}/users/${userId}/reset-password`, {
    method: "POST",
  });
}
