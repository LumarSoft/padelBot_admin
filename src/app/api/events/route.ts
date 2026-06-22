import "server-only";

import type { NextRequest } from "next/server";
import { API_URL } from "@/lib/env";
import { getSessionToken } from "@/lib/session";
import { logger } from "@/lib/logger";

// An SSE stream must stay open and must never be cached or statically rendered.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Streaming BFF endpoint: opens an SSE connection to padelbot_api with the
 * session JWT (kept server-side) and pipes it straight to the browser. The
 * browser's EventSource talks only to this same-origin route, so the token
 * never reaches the client. When the browser disconnects, `request.signal`
 * aborts the upstream fetch and the API tears the stream down.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const token = await getSessionToken();
  if (!token) {
    return new Response("No autorizado.", { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/events`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
      signal: request.signal,
      cache: "no-store",
    });
  } catch (error) {
    logger.error("api.events", "Could not reach upstream SSE", {
      error: String(error),
    });
    return new Response("No se pudo conectar al stream de eventos.", {
      status: 502,
    });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response("Stream no disponible.", {
      status: upstream.status || 502,
    });
  }

  // Pipe the upstream SSE through manually: when the API restarts or the client
  // disconnects, close the stream cleanly instead of letting the socket error
  // bubble up as a noisy "failed to pipe response". The browser's EventSource
  // then simply reconnects.
  const reader = upstream.body.getReader();
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(value);
      } catch {
        controller.close();
      }
    },
    cancel() {
      void reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Disable proxy buffering (e.g. nginx) so events flush immediately.
      "X-Accel-Buffering": "no",
    },
  });
}
