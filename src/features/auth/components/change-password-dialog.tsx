"use client";

import { useState, type FormEvent } from "react";
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
  const canSubmit =
    current.length > 0 && next.length >= 8 && next === confirm && !changePassword.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
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
          <DialogDescription>Mínimo 8 caracteres.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pw-current">Contraseña actual</Label>
            <Input
              id="pw-current"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              disabled={changePassword.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pw-next">Nueva contraseña</Label>
            <Input
              id="pw-next"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              disabled={changePassword.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pw-confirm">Repetir nueva contraseña</Label>
            <Input
              id="pw-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              disabled={changePassword.isPending}
            />
            {mismatch && <p className="text-destructive text-xs">Las contraseñas no coinciden.</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              {changePassword.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
