import "server-only";

import type { NextRequest } from "next/server";
import { API_URL } from "@/lib/env";
import { getSessionToken } from "@/lib/session";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

/**
 * Binary BFF proxy for a booking's transfer-receipt image. Attaches the session JWT
 * (kept server-side) and streams the bytes back with their original Content-Type, so the
 * raw object-storage URL never reaches the browser. An <img> tag points at this route.
 */
export async function GET(_request: NextRequest, { params }: Context): Promise<Response> {
  const token = await getSessionToken();
  if (!token) {
    return new Response("No autorizado.", { status: 401 });
  }

  const { id } = await params;

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/bookings/${id}/receipt`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch (error) {
    logger.error("api.receipt", "Could not reach upstream receipt", { error: String(error) });
    return new Response("No se pudo obtener el comprobante.", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response("Comprobante no disponible.", { status: upstream.status || 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
      "Cache-Control": "private, max-age=60",
    },
  });
}
