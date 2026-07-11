import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  // Optional body: assigning a concrete detected transfer (casi-match queue).
  const body = await request.json().catch(() => undefined);
  return proxyToApi(`/bookings/${id}/confirm-payment`, { method: "PATCH", body });
}
