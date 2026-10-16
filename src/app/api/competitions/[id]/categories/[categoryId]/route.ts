import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

type Context = { params: Promise<{ id: string; categoryId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id, categoryId } = await params;
  const body = await request.json().catch(() => undefined);
  return proxyToApi(`/competitions/${id}/categories/${categoryId}`, { method: "PATCH", body });
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id, categoryId } = await params;
  return proxyToApi(`/competitions/${id}/categories/${categoryId}`, { method: "DELETE" });
}
