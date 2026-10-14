import { NextResponse } from "next/server";
import * as z from "zod";
import { apiServerFetch } from "@/lib/api/server-client";
import { ApiError } from "@/lib/api/api-error";
import { setOpsSessionCookie } from "@/lib/ops-session";
import { logger } from "@/lib/logger";
import { withLoginFormPost } from "@/lib/api/login-form-post";
import type { OpsAdmin } from "@/types/api/ops";

const loginSchema = z.object({
  email: z.email("Ingresá un email válido."),
  password: z.string().min(1, "La contraseña es obligatoria."),
});

interface ApiOpsLoginResponse {
  token: string;
  admin: OpsAdmin;
}

/**
 * Ops login. No API_MOCK path here, unlike the club login: a mock that hands out a
 * cross-tenant console session is not a convenience, it's a footgun.
 */
export function POST(request: Request): Promise<NextResponse> {
  return withLoginFormPost(request, { home: "/ops", login: "/ops/login" }, login);
}

async function login(body: unknown): Promise<NextResponse> {
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Datos de ingreso inválidos.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 422 },
    );
  }

  try {
    const { token, admin } = await apiServerFetch<ApiOpsLoginResponse>(
      "/ops/auth/login",
      { method: "POST", body: parsed.data },
    );

    await setOpsSessionCookie(token);
    return NextResponse.json({ admin }, { status: 200 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message, fieldErrors: error.fieldErrors },
        { status: error.status },
      );
    }
    logger.error("ops.login", "Unexpected ops login failure", {
      error: String(error),
    });
    return NextResponse.json(
      { message: "No pudimos procesar el ingreso. Intentá de nuevo." },
      { status: 500 },
    );
  }
}
