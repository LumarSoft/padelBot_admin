import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as z from "zod";
import { OPS_SESSION_COOKIE_NAME, OPS_SESSION_MAX_AGE } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { OpsAdmin } from "@/types/api/ops";

/**
 * Session for the Lumarsoft ops console. Deliberately a parallel implementation of
 * `lib/session.ts` rather than a generalization of it: the two sessions must not be able
 * to stand in for each other, and a shared helper with a "which one?" parameter is exactly
 * the kind of thing that gets called with the wrong argument once.
 *
 * As with the club session, the JWT is never verified here — that's the API's job. We only
 * decode it for optimistic UI.
 */

const opsClaimsSchema = z.object({
  sub: z.string(),
  email: z.string(),
  name: z.string(),
  scope: z.literal("platform"),
});

function decodeJwtPayload(token: string): unknown {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

/** Map an ops token's claims to an OpsAdmin, or null when the shape is wrong. */
export function decodeOpsAdmin(token: string): OpsAdmin | null {
  const claims = opsClaimsSchema.safeParse(decodeJwtPayload(token));
  if (!claims.success) {
    logger.warn("ops-session", "Ops token has unexpected claims");
    return null;
  }
  const { sub, email, name } = claims.data;
  return { id: sub, email, name };
}

export async function getOpsSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(OPS_SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getOpsSession(): Promise<OpsAdmin | null> {
  const token = await getOpsSessionToken();
  return token ? decodeOpsAdmin(token) : null;
}

/** Like getOpsSession, but bounces to the ops login when there's no session. */
export async function requireOpsSession(): Promise<OpsAdmin> {
  const admin = await getOpsSession();
  if (!admin) redirect("/ops/login");
  return admin;
}

export async function setOpsSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(OPS_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OPS_SESSION_MAX_AGE,
  });
}

export async function clearOpsSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(OPS_SESSION_COOKIE_NAME);
}
