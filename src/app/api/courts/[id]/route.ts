import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  return proxyToApi(`/courts/${id}`);
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const body = await request.json().catch(() => undefined);
  return proxyToApi(`/courts/${id}`, { method: "PATCH", body });
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  return proxyToApi(`/courts/${id}`, { method: "DELETE" });
}
