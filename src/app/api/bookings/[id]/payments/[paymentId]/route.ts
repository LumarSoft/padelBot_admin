import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

type Context = { params: Promise<{ id: string; paymentId: string }> };

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id, paymentId } = await params;
  return proxyToApi(`/bookings/${id}/payments/${paymentId}`, { method: "DELETE" });
}
