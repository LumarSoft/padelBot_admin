import { ApiError, type FieldErrors } from "@/lib/api/api-error";
import {
  SESSION_ENDED_HEADER,
  SESSION_ENDED_LOGIN_PATH,
} from "@/lib/api/session-ended";

/**
 * Browser-side HTTP client. Talks to this app's own internal route handlers
 * (the BFF under `/api/...`), never to gtp_api directly — that keeps the
 * JWT in an HttpOnly cookie, out of reach of client JavaScript.
 */

interface ErrorBody {
  message?: string;
  fieldErrors?: FieldErrors;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    // Send/receive the session cookie on same-origin BFF calls.
    credentials: "include",
  });

  if (response.status === 401 && response.headers.has(SESSION_ENDED_HEADER)) {
    endSession();
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorBody;
    throw new ApiError(
      response.status,
      body.message ?? `Error en la solicitud (estado ${response.status})`,
      body.fieldErrors,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

let endingSession = false;

/**
 * The BFF said the session is over (and already dropped the cookie): an expired token, or the
 * owner deactivated this user. A full navigation, not a router push, so nothing of the old
 * session survives in memory — cached queries, the auth store. Several requests usually fail
 * together; the first one navigates.
 */
function endSession(): void {
  if (endingSession || typeof window === "undefined") return;
  endingSession = true;
  window.location.assign(SESSION_ENDED_LOGIN_PATH);
}

export const apiClient = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: "GET" });
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
  del<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" });
  },
};
