import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as z from "zod";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/lib/env";
import { logger } from "@/lib/logger";
import type { SessionUser } from "@/types/api/auth";

/**
 * Session management for the panel. The API's JWT lives in an HttpOnly cookie.
 * We never verify the signature here — verification is the API's job. We only
 * decode the payload for optimistic UI (showing the user's club, name, role).
 * Every real data request is authorized by the API against the same token.
 */

const sessionClaimsSchema = z.object({
  sub: z.string(),
  email: z.string(),
  name: z.string(),
  clubId: z.string(),
  clubName: z.string(),
  role: z.enum(["owner", "staff"]),
  // Older tokens (issued before the claim existed) simply default to false.
  mustChangePassword: z.boolean().default(false),
});

function decodeJwtPayload(token: string): unknown {
  const payload = token.split(".")[1];
  if (!payload) {
    return null;
  }
  try {
    const json = Buffer.from(payload, "base64url").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Map a token's JWT claims to a SessionUser, or null if the shape is invalid. */
export function decodeSessionUser(token: string): SessionUser | null {
  const claims = sessionClaimsSchema.safeParse(decodeJwtPayload(token));
  if (!claims.success) {
    logger.warn("session", "Session token has unexpected claims");
    return null;
  }
  const { sub, email, name, clubId, clubName, role, mustChangePassword } = claims.data;
  return { id: sub, email, name, clubId, clubName, role, mustChangePassword };
}

/** Read the raw JWT from the session cookie (or null). */
export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/** Read and decode the current session user (or null when not signed in). */
export async function getSession(): Promise<SessionUser | null> {
  const token = await getSessionToken();
  return token ? decodeSessionUser(token) : null;
}

/** Like getSession, but redirects to /login when there is no valid session. */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/** Store the API JWT as an HttpOnly session cookie. */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Remove the session cookie (logout). */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

/**
 * Build a fake JWT for mock mode (API_MOCK=true). Not signed — purely a
 * base64url payload so the rest of the code can decode it like a real token.
 */
export function createMockSessionToken(user: SessionUser): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.name,
      clubId: user.clubId,
      clubName: user.clubName,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    }),
  ).toString("base64url");
  return `${header}.${payload}.`;
}
