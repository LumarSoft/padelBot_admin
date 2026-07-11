import { NextResponse } from "next/server";
import { clearOpsSessionCookie } from "@/lib/ops-session";

export async function POST(): Promise<NextResponse> {
  await clearOpsSessionCookie();
  return new NextResponse(null, { status: 204 });
}
