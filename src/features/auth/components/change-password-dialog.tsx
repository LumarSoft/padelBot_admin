"use client";

import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  PasswordInput,
  PasswordRequirements,
} from "@/components/ui/password-input";
import { isPasswordValid } from "@/lib/password";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usersService } from "@/services/users.service";

/** Own-password change, available to OWNER and STAFF from the header. */
export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const changePassword = useMutation({
    mutationFn: usersService.changePassword,
    onSuccess: () => {
      toast.success("Contraseña actualizada");
      setOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const mismatch = confirm.length > 0 && next !== confirm;
  const weak = next.length > 0 && !isPasswordValid(next);
  const canSubmit =
    current.length > 0 &&
    isPasswordValid(next) &&
    next === confirm &&
    !changePassword.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Never fail silently: say what's missing instead of leaving a dead button.
    if (!current) {
      toast.error("Escribí tu contraseña actual");
      return;
    }
    if (!isPasswordValid(next)) {
      toast.error("La nueva contraseña no cumple los requisitos");
      return;
    }
    if (next !== confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (changePassword.isPending) return;
    changePassword.mutate({ currentPassword: current, newPassword: next });
  }

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Cambiar contraseña" title="Cambiar contraseña" />
        }
      >
        <KeyRound className="size-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            Elegí una contraseña que cumpla los tres requisitos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pw-current">Contraseña actual</Label>
            <PasswordInput
              id="pw-current"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              disabled={changePassword.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pw-next">Nueva contraseña</Label>
            <PasswordInput
              id="pw-next"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              aria-invalid={weak || undefined}
              aria-describedby="pw-rules"
              disabled={changePassword.isPending}
            />
            <PasswordRequirements id="pw-rules" value={next} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pw-confirm">Repetir nueva contraseña</Label>
            <PasswordInput
              id="pw-confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              aria-invalid={mismatch || undefined}
              disabled={changePassword.isPending}
            />
            {mismatch && <p className="text-destructive text-xs">Las contraseñas no coinciden.</p>}
          </div>
          <DialogFooter>
            {/* Enabled on purpose even when invalid: pressing it says what's missing. */}
            <Button type="submit" disabled={changePassword.isPending} aria-disabled={!canSubmit}>
              {changePassword.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
