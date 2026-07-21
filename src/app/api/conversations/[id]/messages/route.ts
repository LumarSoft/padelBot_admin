import { type NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  return proxyToApi(`/conversations/${id}/messages`);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const body = await req.json();
  return proxyToApi(`/conversations/${id}/messages`, { method: "POST", body });
}
