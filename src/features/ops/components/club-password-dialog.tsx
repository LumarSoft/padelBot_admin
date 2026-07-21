"use client";

import { useState } from "react";
import { CopyIcon, KeyRoundIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/features/ops/lib/labels";
import {
  useClubUsers,
  useResetClubUserPassword,
} from "@/features/ops/hooks/use-ops";
import type { OpsClub, ResetPasswordResult } from "@/types/api/ops";

interface ClubPasswordDialogProps {
  club: OpsClub;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Support action: reset the password of any of a club's panel users. The new temporary
 * password is shown ONCE, right here, for ops to copy and pass to the club out-of-band — it
 * is never stored or emailed. The user is forced to change it on their next login.
 */
export function ClubPasswordDialog({
  club,
  open,
  onOpenChange,
}: ClubPasswordDialogProps) {
  // Only fetch the users while the dialog is actually open.
  const users = useClubUsers(club.id, open);
  const reset = useResetClubUserPassword(club.id);
  const [result, setResult] = useState<ResetPasswordResult | null>(null);

  function handleReset(userId: number): void {
    setResult(null);
    reset.mutate(userId, { onSuccess: setResult });
  }

  async function copyTempPassword(): Promise<void> {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.tempPassword);
      toast.success("Contraseña copiada");
    } catch {
      toast.error("No se pudo copiar. Copiala a mano.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setResult(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contraseñas de {club.name}</DialogTitle>
          <DialogDescription>
            Reseteá el acceso de un usuario del club. Se genera una contraseña
            temporal que le pasás vos; la va a tener que cambiar al entrar.
          </DialogDescription>
        </DialogHeader>

        {result && (
          <div className="border-brand/40 bg-brand/5 flex flex-col gap-2 rounded-xl border p-3">
            <p className="text-xs">
              Nueva contraseña temporal para{" "}
              <span className="font-medium">{result.email}</span>:
            </p>
            <div className="flex items-center gap-2">
              <code className="bg-background flex-1 rounded-lg px-2.5 py-1.5 font-mono text-sm select-all">
                {result.tempPassword}
              </code>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label="Copiar contraseña"
                onClick={copyTempPassword}
              >
                <CopyIcon className="size-4" />
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Copiala ahora: no se vuelve a mostrar.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {users.isLoading ? (
            <p className="text-muted-foreground text-sm">Cargando usuarios…</p>
          ) : users.data && users.data.length > 0 ? (
            users.data.map((user) => {
              const pending = reset.isPending && reset.variables === user.id;
              return (
                <div
                  key={user.id}
                  className="border-border/60 flex items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {user.name}
                      </p>
                      <Badge
                        variant={user.role === "OWNER" ? "secondary" : "outline"}
                      >
                        {user.role === "OWNER" ? "Dueño" : "Staff"}
                      </Badge>
                      {!user.isActive && (
                        <Badge variant="destructive">Inactivo</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground truncate text-xs">
                      {user.email} · último ingreso {timeAgo(user.lastLoginAt)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={reset.isPending}
                    onClick={() => handleReset(user.id)}
                  >
                    <KeyRoundIcon className="size-4" />
                    {pending ? "Reseteando…" : "Resetear"}
                  </Button>
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground text-sm">
              Este club no tiene usuarios.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
