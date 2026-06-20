import "server-only";

import { API_URL } from "@/lib/env";
import { ApiError, type FieldErrors } from "@/lib/api/api-error";

/**
 * Server-side HTTP client. Used only by route handlers / server components to
 * reach padelbot_api. Attaches the JWT (read from the session cookie) as a
 * Bearer token. The token never crosses to the browser.
 */

interface ErrorBody {
  message?: string;
  fieldErrors?: FieldErrors;
}

interface ServerFetchOptions extends Omit<RequestInit, "body"> {
  /** JWT to send as `Authorization: Bearer <token>`. */
  token?: string;
  /** JSON body; serialized automatically. */
  body?: unknown;
}

export async function apiServerFetch<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<T> {
  const { token, body, headers, ...init } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as ErrorBody;
    throw new ApiError(
      response.status,
      errorBody.message ?? `Upstream API failed with status ${response.status}`,
      errorBody.fieldErrors,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
