"use client";

import { useState, type FormEvent } from "react";
import { CalendarClock, DollarSign, Loader2, Pencil, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/format";
import { CreateCourtDialog } from "@/features/turnos/components/create-court-dialog";
import { BulkPriceDialog } from "@/features/configuracion/components/bulk-price-dialog";
import { PriceRulesDialog } from "@/features/configuracion/components/price-rules-dialog";
import { WeeklyHoursEditor } from "@/features/configuracion/components/weekly-hours-editor";
import {
  useCourts,
  useUpdateCourt,
  useDeleteCourt,
} from "@/features/turnos/hooks/use-courts";
import type { Court, WeeklyHours } from "@/types/api/turnos";

const DURATION_OPTIONS = [60, 90, 120] as const;

function durationLabel(minutes: number): string {
  return minutes % 60 === 0 ? `${minutes / 60} h` : `${minutes} min`;
}

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
  const [openTime, setOpenTime] = useState(court.openTime);
  const [closeTime, setCloseTime] = useState(court.closeTime);
  const [duration, setDuration] = useState(String(court.slotDurationMinutes));
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours>(court.weeklyHours ?? {});
  const [courtType, setCourtType] = useState<"INDOOR" | "OUTDOOR">(court.courtType);
  const updateCourt = useUpdateCourt();

  const trimmed = name.trim();
  const priceNumber = Number(price);
  const priceValid = Number.isFinite(priceNumber) && priceNumber >= 0;
  const newPriceCents = Math.round(priceNumber * 100);
  const weeklyUnchanged =
    JSON.stringify(weeklyHours) === JSON.stringify(court.weeklyHours ?? {});
  const unchanged =
    trimmed === court.name &&
    newPriceCents === court.priceCents &&
    openTime === court.openTime &&
    closeTime === court.closeTime &&
    duration === String(court.slotDurationMinutes) &&
    weeklyUnchanged &&
    courtType === court.courtType;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!trimmed || !priceValid || unchanged) return;
    updateCourt.mutate(
      {
        id: court.id,
        body: {
          name: trimmed,
          priceCents: newPriceCents,
          openTime,
          closeTime,
          slotDurationMinutes: Number(duration),
          // {} means "no overrides" — persist as null to clear them.
          weeklyHours: Object.keys(weeklyHours).length > 0 ? weeklyHours : null,
          courtType,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar cancha</DialogTitle>
          <DialogDescription>
            Modificá los datos de “{court.name}”.
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
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="court-open-edit">Apertura</Label>
              <Input
                id="court-open-edit"
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                disabled={updateCourt.isPending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="court-close-edit">Cierre</Label>
              <Input
                id="court-close-edit"
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                disabled={updateCourt.isPending}
              />
              <p className="text-muted-foreground text-xs">
                00:00 = medianoche · menor a la apertura = cierra al día siguiente
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Duración del turno</Label>
            <Select value={duration} onValueChange={(v) => setDuration(v ?? "90")}>
              <SelectTrigger disabled={updateCourt.isPending}>
                <SelectValue>{(v) => durationLabel(Number(v))}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {durationLabel(minutes)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              90 min es el estándar de pádel; usá 60 min para fútbol 5 u otros deportes.
            </p>
          </div>
          <WeeklyHoursEditor
            value={weeklyHours}
            onChange={setWeeklyHours}
            defaultOpen={openTime}
            defaultClose={closeTime}
            disabled={updateCourt.isPending}
          />
          <div className="flex flex-col gap-2">
            <Label>Tipo</Label>
            <div className="flex gap-4">
              {(["INDOOR", "OUTDOOR"] as const).map((type) => (
                <label key={type} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="court-type-edit"
                    value={type}
                    checked={courtType === type}
                    onChange={() => setCourtType(type)}
                    disabled={updateCourt.isPending}
                    className="accent-[var(--brand)]"
                  />
                  {type === "INDOOR" ? "Interior" : "Exterior"}
                </label>
              ))}
            </div>
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
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [pricingCourt, setPricingCourt] = useState<Court | null>(null);

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
            Administrá las canchas, precios y horarios del club.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BulkPriceDialog />
          <CreateCourtDialog />
        </div>
      </div>

      {courts.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Sin canchas"
          description="Creá la primera cancha para empezar a recibir reservas."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {courts.map((court) => (
                <TableRow key={court.id}>
                  <TableCell className="font-medium">{court.name}</TableCell>
                  <TableCell className="text-sm">{formatPrice(court.priceCents)}</TableCell>
                  <TableCell className="text-sm tabular-nums">
                    <div className="flex flex-col gap-0.5">
                      <span>
                        {court.openTime} – {court.closeTime}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        turnos de {durationLabel(court.slotDurationMinutes)}
                        {court.weeklyHours &&
                          Object.keys(court.weeklyHours).length > 0 &&
                          " · horario especial por día"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {court.courtType === "INDOOR" ? "Interior" : "Exterior"}
                  </TableCell>
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
                        aria-label={`Precios por horario de ${court.name}`}
                        onClick={() => setPricingCourt(court)}
                        className="text-muted-foreground hover:text-foreground size-8"
                      >
                        <DollarSign className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${court.name}`}
                        onClick={() => setEditingCourt(court)}
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

      {editingCourt && (
        <EditCourtDialog
          court={editingCourt}
          open={!!editingCourt}
          onOpenChange={(open) => {
            if (!open) setEditingCourt(null);
          }}
        />
      )}

      {pricingCourt && (
        <PriceRulesDialog
          court={pricingCourt}
          open={!!pricingCourt}
          onOpenChange={(open) => {
            if (!open) setPricingCourt(null);
          }}
        />
      )}
    </>
  );
}
