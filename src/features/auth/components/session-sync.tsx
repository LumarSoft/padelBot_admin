"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import type { SessionUser } from "@/types/api/auth";

/**
 * Hydrates the client auth store with the session resolved on the server.
 * Rendered once inside the protected layout so client components can read the
 * current user/club without an extra round trip.
 */
export function SessionSync({ user }: { user: SessionUser }) {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  return null;
}
