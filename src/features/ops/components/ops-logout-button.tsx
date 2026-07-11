"use client";

import { Button } from "@/components/ui/button";
import { useOpsLogout } from "@/features/ops/hooks/use-ops";

export function OpsLogoutButton() {
  const logout = useOpsLogout();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
    >
      Salir
    </Button>
  );
}
