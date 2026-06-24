"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth-store";
import { ApiError } from "@/lib/api/api-error";
import type { LoginRequest, SessionUser } from "@/types/api/auth";

/** Drives the login mutation: stores the user, redirects, and surfaces errors. */
export function useLogin() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation<SessionUser, ApiError, LoginRequest>({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: (user) => {
      setUser(user);
      toast.success(`Bienvenido, ${user.name}`);
      router.replace("/panel");
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "No pudimos iniciar sesión. Intentá de nuevo.";
      toast.error(message);
    },
  });
}
