import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import type { LoginResponse } from "@/types/api/auth";

export async function GET(): Promise<NextResponse> {
  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      { message: "No hay sesión activa." },
      { status: 401 },
    );
  }

  const body: LoginResponse = { user };
  return NextResponse.json(body, { status: 200 });
}
