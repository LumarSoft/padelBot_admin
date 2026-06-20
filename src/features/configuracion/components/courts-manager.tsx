"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/format";
import { CreateCourtDialog } from "@/features/turnos/components/create-court-dialog";
import {
  useCourts,
  useUpdateCourt,
  useDeleteCourt,
} from "@/features/turnos/hooks/use-courts";
import type { Court } from "@/types/api/turnos";
import { CalendarClock } from "lucide-react";

function EditCourtDialog({
  court,
  open,
  onOpenChange,
}: {
  court: Court;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(court.name);
  const [price, setPrice] = useState(String(court.priceCents / 100));
  const updateCourt = useUpdateCourt();

  const trimmed = name.trim();
  const priceNumber = Number(price);
  const priceValid = Number.isFinite(priceNumber) && priceNumber >= 0;
  const newPriceCents = Math.round(priceNumber * 100);
  const unchanged = trimmed === court.name && newPriceCents === court.priceCents;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!trimmed || !priceValid || unchanged) return;
    updateCourt.mutate(
      { id: court.id, body: { name: trimmed, priceCents: newPriceCents } },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar cancha</DialogTitle>
          <DialogDescription>
            Cambiá el nombre y el precio de “{court.name}”.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="court-rename">Nombre</Label>
            <Input
              id="court-rename"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              autoFocus
              disabled={updateCourt.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="court-price-edit">Precio del turno (ARS)</Label>
            <Input
              id="court-price-edit"
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={updateCourt.isPending}
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={updateCourt.isPending || !trimmed || !priceValid || unchanged}
            >
              {updateCourt.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CourtsManager() {
  const courtsQuery = useCourts();
  const deleteCourt = useDeleteCourt();
  const [renamingCourt, setRenamingCourt] = useState<Court | null>(null);

  const courts = courtsQuery.data ?? [];

  function handleDelete(court: Court): void {
    if (
      window.confirm(`¿Eliminar "${court.name}"? Se borrarán también sus turnos.`)
    ) {
      deleteCourt.mutate(court.id);
    }
  }

  if (courtsQuery.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando canchas…
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Canchas</h2>
          <p className="text-muted-foreground text-sm">
            Administrá las canchas disponibles para reservas.
          </p>
        </div>
        <CreateCourtDialog />
      </div>

      {courts.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Sin canchas"
          description="Creá la primera cancha para empezar a cargar turnos."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {courts.map((court) => (
                <TableRow key={court.id}>
                  <TableCell className="font-medium">{court.name}</TableCell>
                  <TableCell className="text-sm">{formatPrice(court.priceCents)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(court.createdAt).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${court.name}`}
                        onClick={() => setRenamingCourt(court)}
                        className="text-muted-foreground hover:text-foreground size-8"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Eliminar ${court.name}`}
                        onClick={() => handleDelete(court)}
                        disabled={deleteCourt.isPending}
                        className="text-muted-foreground hover:text-destructive size-8"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {renamingCourt && (
        <EditCourtDialog
          court={renamingCourt}
          open={!!renamingCourt}
          onOpenChange={(open) => {
            if (!open) setRenamingCourt(null);
          }}
        />
      )}
    </>
  );
}
