"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { authService } from "@/services/auth.service";

/**
 * Blocking first-login gate for accounts on a temporary password
 * (`mustChangePassword`): a club owner we just provisioned, or a STAFF member the
 * owner created. It cannot be dismissed — no close button,
 * `disablePointerDismissal`, and `open` is pinned to true with a no-op
 * `onOpenChange`, so neither Escape nor an outside click can get past it.
 *
 * The user just authenticated with the temporary password to get here, so we don't
 * ask for it again — only the new one. On success the session is kept (the BFF swaps
 * the cookie for a token with the flag cleared) and we refresh the route so this gate
 * disappears without a re-login.
 */
export function ForcePasswordChangeDialog() {
  const router = useRouter();
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const setPassword = useMutation({
    mutationFn: () => authService.completeInitialPassword(next),
    onSuccess: () => {
      toast.success("Contraseña actualizada");
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit =
    next.length >= 8 && next === confirm && !setPassword.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setPassword.mutate();
  }

  return (
    <Dialog open disablePointerDismissal onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4" />
            Elegí tu contraseña
          </DialogTitle>
          <DialogDescription>
            Estás usando una contraseña temporal. Creá una propia para continuar.
            Mínimo 8 caracteres.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fpw-next">Nueva contraseña</Label>
            <Input
              id="fpw-next"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              autoFocus
              disabled={setPassword.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fpw-confirm">Repetir nueva contraseña</Label>
            <Input
              id="fpw-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              disabled={setPassword.isPending}
            />
            {mismatch && (
              <p className="text-destructive text-xs">
                Las contraseñas no coinciden.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              {setPassword.isPending ? "Guardando…" : "Guardar y continuar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
