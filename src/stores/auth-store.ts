import { create } from "zustand";
import type { SessionUser } from "@/types/api/auth";

/**
 * Holds the current session user for client components (nav, headers, role
 * gating). Data only — no API calls or business logic live here. The token is
 * never stored client-side; it stays in the HttpOnly cookie.
 */
interface AuthState {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
}));
