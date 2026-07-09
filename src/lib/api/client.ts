import { ApiError, type FieldErrors } from "@/lib/api/api-error";

/**
 * Browser-side HTTP client. Talks to this app's own internal route handlers
 * (the BFF under `/api/...`), never to padelbot_api directly — that keeps the
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

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorBody;
    throw new ApiError(
      response.status,
      body.message ?? `Request failed with status ${response.status}`,
      body.fieldErrors,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
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
