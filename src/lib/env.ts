/**
 * Centralized environment access. Read env vars here so the rest of the codebase
 * never touches `process.env` directly and the contract stays in one place.
 */

/** Base URL of padelbot_api (the real REST backend). */
export const API_URL: string =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * When `true`, auth route handlers return a canned session instead of calling
 * the real API. Lets the panel run before padelbot_api exposes its endpoints.
 * Toggle off (delete the env var) once the API is available.
 */
export const API_MOCK: boolean = process.env.API_MOCK === "true";

/** Name of the HttpOnly cookie that stores the API JWT. */
export const SESSION_COOKIE_NAME = "pb_session";

/** Session lifetime, in seconds, used for the cookie Max-Age (7 days). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
