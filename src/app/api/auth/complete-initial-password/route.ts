import { NextResponse } from "next/server";
import * as z from "zod";
import { apiServerFetch } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/api-error";
import { getSessionToken, setSessionCookie } from "@/lib/session";
import { logger } from "@/lib/logger";
import type { ApiLoginResponse, LoginResponse } from "@/types/api/auth";

const schema = z.object({
  newPassword: z.string().min(8, "Mínimo 8 caracteres."),
});

/**
 * First-login password set for a user on a temporary password. Authenticated with the
 * current session token; the API returns a FRESH token with `mustChangePassword` cleared,
 * which we write back into the session cookie so the user stays logged in.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Datos inválidos.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 422 },
    );
  }

  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  try {
    const { token: newToken, user } = await apiServerFetch<ApiLoginResponse>(
      "/auth/me/complete-initial-password",
      {
        method: "POST",
        body: { newPassword: parsed.data.newPassword },
        token,
      },
    );

    await setSessionCookie(newToken);

    const body: LoginResponse = { user };
    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message, fieldErrors: error.fieldErrors },
        { status: error.status },
      );
    }
    logger.error("auth.completeInitialPassword", "Unexpected failure", {
      error: String(error),
    });
    return NextResponse.json(
      { message: "No pudimos actualizar la contraseña. Intentá de nuevo." },
      { status: 500 },
    );
  }
}
