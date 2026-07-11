"use client";

import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProvisionLead } from "@/features/ops/hooks/use-ops";
import type { Lead } from "@/types/api/ops";

interface ProvisionDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** A temporary password the owner changes on first login (`mustChangePassword`). */
function suggestPassword(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "");
}

/**
 * Turns a lead into a club. The fields come pre-filled from what the prospect told us at
 * signup — they're editable because an `info@` address or a "S.R.L." in the club name is
 * common, and fixing it here beats fixing it in the DB later.
 */
export function ProvisionDialog({
  lead,
  open,
  onOpenChange,
}: ProvisionDialogProps) {
  const [clubName, setClubName] = useState(lead.clubName);
  const [ownerName, setOwnerName] = useState(lead.ownerName);
  const [email, setEmail] = useState(lead.email);
  const [password, setPassword] = useState(suggestPassword);
  const provision = useProvisionLead();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    provision.mutate(
      { id: lead.id, payload: { clubName, ownerName, email, password } },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Provisionar club</DialogTitle>
          <DialogDescription>
            Crea el club vacío y su usuario dueño, en período de prueba. Las
            canchas, precios y cobros se cargan después en la puesta a punto,
            sentados con el complejo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="prov-club">Nombre del club</Label>
            <Input
              id="prov-club"
              value={clubName}
              onChange={(event) => setClubName(event.target.value)}
              disabled={provision.isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="prov-owner">Dueño</Label>
            <Input
              id="prov-owner"
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
              disabled={provision.isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="prov-email">Email de acceso</Label>
            <Input
              id="prov-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={provision.isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="prov-password">Contraseña temporal</Label>
            <Input
              id="prov-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={provision.isPending}
            />
            <p className="text-muted-foreground text-xs">
              Copiala antes de crear: se la pasás al dueño y la cambia cuando
              entra.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={provision.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={provision.isPending || password.length < 8}
            >
              {provision.isPending ? "Creando…" : "Crear club"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
