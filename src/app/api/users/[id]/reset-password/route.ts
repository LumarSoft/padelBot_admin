import type { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToApi(`/users/${id}/reset-password`, { method: "POST" });
}
