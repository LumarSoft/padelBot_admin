import { type NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const body = await req.json();
  return proxyToApi(`/conversations/${id}/mode`, { method: "PATCH", body });
}
