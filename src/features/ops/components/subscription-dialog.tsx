"use client";

import { useState } from "react";
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
import { useUpdateSubscription } from "@/features/ops/hooks/use-ops";
import { SUBSCRIPTION_LABELS } from "@/features/ops/lib/labels";
import type { OpsClub, SubscriptionStatus } from "@/types/api/ops";

const STATUSES: SubscriptionStatus[] = [
  "ACTIVE",
  "TRIAL",
  "PAST_DUE",
  "CANCELLED",
];

interface SubscriptionDialogProps {
  club: OpsClub;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Manual billing, from the UI. Billing is still a transfer landing in our account and us
 * flipping a switch — this is that switch, so it doesn't require SSH access anymore.
 */
export function SubscriptionDialog({
  club,
  open,
  onOpenChange,
}: SubscriptionDialogProps) {
  const [status, setStatus] = useState<SubscriptionStatus>(
    club.subscription.subscriptionStatus,
  );
  const [months, setMonths] = useState(1);
  const [days, setDays] = useState(14);
  const update = useUpdateSubscription();

  function handleSave(): void {
    update.mutate(
      {
        id: club.id,
        payload: {
          status,
          ...(status === "ACTIVE" ? { months } : {}),
          ...(status === "TRIAL" ? { days } : {}),
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Suscripción de {club.name}</DialogTitle>
          <DialogDescription>
            El bot nunca se corta de golpe: después del vencimiento hay días de
            gracia con aviso antes de que deje de atender.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Estado</Label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={status === option ? "default" : "outline"}
                  onClick={() => setStatus(option)}
                  disabled={update.isPending}
                >
                  {SUBSCRIPTION_LABELS[option]}
                </Button>
              ))}
            </div>
          </div>

          {status === "ACTIVE" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="sub-months">Meses pagos</Label>
              <Input
                id="sub-months"
                type="number"
                min={1}
                max={24}
                value={months}
                onChange={(event) => setMonths(Number(event.target.value))}
                disabled={update.isPending}
              />
              <p className="text-muted-foreground text-xs">
                Corre desde hoy. Vencido eso, pasa a “vencido” con gracia.
              </p>
            </div>
          )}

          {status === "TRIAL" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="sub-days">Días de prueba</Label>
              <Input
                id="sub-days"
                type="number"
                min={1}
                max={180}
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
                disabled={update.isPending}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={update.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
