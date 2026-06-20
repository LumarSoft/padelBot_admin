"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth-store";
import { logger } from "@/lib/logger";

export function LogoutButton() {
  const router = useRouter();
  const clear = useAuthStore((state) => state.clear);

  async function handleLogout(): Promise<void> {
    try {
      await authService.logout();
    } catch (error) {
      logger.error("auth.logout", "Logout request failed", {
        error: String(error),
      });
    } finally {
      clear();
      router.replace("/login");
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout}>
      <LogOut className="size-4" />
      Salir
    </Button>
  );
}
