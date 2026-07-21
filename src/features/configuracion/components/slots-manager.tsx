"use client";

import { useState } from "react";
import { CalendarClock, Loader2, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDay, formatPrice, formatTimeRange } from "@/lib/format";
import { useCourts } from "@/features/turnos/hooks/use-courts";
import { useSlots, useDeleteSlot } from "@/features/turnos/hooks/use-slots";
import { CreateSlotDialog } from "@/features/turnos/components/create-slot-dialog";
import { SlotStatusBadge } from "@/features/turnos/components/slot-status-badge";

export function SlotsManager() {
  const [courtFilter, setCourtFilter] = useState("all");

  const courtsQuery = useCourts();
  const deleteSlot = useDeleteSlot();

  const courts = courtsQuery.data ?? [];
  const slotsQuery = useSlots(courtFilter === "all" ? {} : { courtId: courtFilter });
  const slots = slotsQuery.data ?? [];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-medium">Horarios y precios</h2>
          <p className="text-muted-foreground text-xs">
            La oferta de turnos del club: horarios y precios por cancha.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {courts.length > 0 && (
            <Select
              value={courtFilter}
              onValueChange={(value) => setCourtFilter(value ?? "all")}
            >
              <SelectTrigger className="w-48">
                <SelectValue>
                  {(value) =>
                    value === "all" || !value
                      ? "Todas las canchas"
                      : (courts.find((court) => court.id === value)?.name ?? "")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las canchas</SelectItem>
                {courts.map((court) => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {courts.length > 0 && <CreateSlotDialog courts={courts} />}
        </div>
      </div>

      {slotsQuery.isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Cargando turnos…
        </div>
      ) : slots.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No hay turnos"
          description={
            courts.length === 0
              ? "Creá una cancha primero y después cargá tus primeros turnos."
              : 'Cargá tu primer turno con el botón "Nuevo turno".'
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cancha</TableHead>
                <TableHead>Día</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {slots.map((slot) => (
                <TableRow key={slot.id}>
                  <TableCell className="font-medium">{slot.court.name}</TableCell>
                  <TableCell className="capitalize">{formatDay(slot.startsAt)}</TableCell>
                  <TableCell>{formatTimeRange(slot.startsAt, slot.endsAt)}</TableCell>
                  <TableCell>{formatPrice(slot.priceCents)}</TableCell>
                  <TableCell>
                    <SlotStatusBadge status={slot.status} />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Eliminar turno"
                      onClick={() => deleteSlot.mutate(slot.id)}
                      className="text-muted-foreground hover:text-destructive size-8"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
