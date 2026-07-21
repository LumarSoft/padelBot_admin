import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => undefined);
  return proxyToApi(`/users/${id}`, { method: "PATCH", body });
}
