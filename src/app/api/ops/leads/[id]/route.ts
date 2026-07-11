import type { NextRequest } from "next/server";
import { proxyToOpsApi } from "@/lib/api/ops-proxy";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  return proxyToOpsApi(`/ops/leads/${id}`);
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const body = await request.json().catch(() => undefined);
  return proxyToOpsApi(`/ops/leads/${id}`, { method: "PATCH", body });
}
