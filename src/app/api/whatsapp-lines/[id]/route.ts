import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  return proxyToApi(`/whatsapp-lines/${id}`, { method: "DELETE" });
}
