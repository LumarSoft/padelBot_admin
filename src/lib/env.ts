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

/**
 * The Lumarsoft ops console (`/ops`) keeps its OWN cookie, separate from the club session.
 * Two reasons: the tokens verify against different secrets API-side and are not
 * interchangeable, and being signed into a club panel must never imply being signed into
 * the console that sees every club.
 */
export const OPS_SESSION_COOKIE_NAME = "pb_ops_session";

/** Shorter than a club session on purpose — this token reads across every tenant (12h). */
export const OPS_SESSION_MAX_AGE = 60 * 60 * 12;
