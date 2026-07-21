import { NextResponse } from "next/server";
import * as z from "zod";
import { API_MOCK } from "@/lib/env";
import { apiServerFetch } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/api-error";
import {
  createMockSessionToken,
  setSessionCookie,
} from "@/lib/session";
import { logger } from "@/lib/logger";
import type {
  ApiLoginResponse,
  LoginResponse,
  SessionUser,
} from "@/types/api/auth";

const loginSchema = z.object({
  email: z.email("Ingresá un email válido."),
  password: z.string().min(1, "La contraseña es obligatoria."),
});

/** Canned session used only while API_MOCK is on. */
function buildMockSession(email: string): { token: string; user: SessionUser } {
  const user: SessionUser = {
    id: "mock-user-1",
    email,
    name: "Staff Demo",
    clubId: "mock-club-1",
    clubName: "Club Demo Pádel",
    role: "owner",
    mustChangePassword: false,
  };
  return { token: createMockSessionToken(user), user };
}

export async function POST(request: Request): Promise<NextResponse> {
  const json = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Datos de ingreso inválidos.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 422 },
    );
  }

  const { email, password } = parsed.data;

  try {
    const { token, user } = API_MOCK
      ? buildMockSession(email)
      : await apiServerFetch<ApiLoginResponse>("/auth/login", {
          method: "POST",
          body: { email, password },
        });

    await setSessionCookie(token);

    const body: LoginResponse = { user };
    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message, fieldErrors: error.fieldErrors },
        { status: error.status },
      );
    }
    logger.error("auth.login", "Unexpected login failure", {
      error: String(error),
    });
    return NextResponse.json(
      { message: "No pudimos procesar el ingreso. Intentá de nuevo." },
      { status: 500 },
    );
  }
}
