import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

type Context = { params: Promise<{ id: string; categoryId: string }> };

export async function POST(_request: NextRequest, { params }: Context) {
  const { id, categoryId } = await params;
  return proxyToApi(`/competitions/${id}/categories/${categoryId}/fixture`, { method: "POST" });
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id, categoryId } = await params;
  return proxyToApi(`/competitions/${id}/categories/${categoryId}/fixture`, { method: "DELETE" });
}
