"use client";

import { useState } from "react";
import { CalendarCheck, Loader2, X, CalendarClock, Phone } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
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
import { formatDay, formatTimeRange, formatPrice } from "@/lib/format";
import { useCourts } from "@/features/turnos/hooks/use-courts";
import { useBookings, useCancelBooking, useMarkNoShow } from "@/features/reservas/hooks/use-bookings";
import { AddProductsDialog } from "@/features/productos/components/add-products-dialog";
import { BookingStatusBadge } from "@/features/reservas/components/booking-status-badge";
import { RescheduleBookingDialog } from "@/features/reservas/components/reschedule-booking-dialog";
import { dateToKey, shiftDay } from "@/features/agenda/lib/schedule";
import type { Booking, BookingStatus } from "@/types/api/bookings";

export function BookingsList() {
  const [from, setFrom] = useState(() => dateToKey(new Date()));
  const [to, setTo] = useState(() => shiftDay(dateToKey(new Date()), 7));
  const [courtId, setCourtId] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);

  const courtsQuery = useCourts();
  const courts = courtsQuery.data ?? [];

  const bookingsQuery = useBookings({
    from: from ? new Date(`${from}T00:00`).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59`).toISOString() : undefined,
    courtId: courtId || undefined,
    status: statusFilter || undefined,
  });
  const bookings = bookingsQuery.data ?? [];

  const cancelBooking = useCancelBooking();
  const confirm = useConfirm();
  const markNoShow = useMarkNoShow();
  const [collectingBooking, setCollectingBooking] = useState<Booking | null>(null);

  async function handleCancel(booking: Booking) {
    const ok = await confirm({
      title: `¿Cancelar la reserva de ${booking.playerName}?`,
      description: `${booking.slot.court.name} · ${formatDay(booking.slot.startsAt)} · ${formatTimeRange(booking.slot.startsAt, booking.slot.endsAt)}. El turno queda libre para reasignar.`,
      confirmLabel: "Cancelar la reserva",
      cancelLabel: "No, volver",
      tone: "destructive",
    });
    if (ok) cancelBooking.mutate(booking.id);
  }

  async function handleNoShow(booking: Booking) {
    const ok = await confirm({
      title: `¿Marcar a ${booking.playerName} como ausente?`,
      description:
        "Suma una ausencia a su historial. Con varias, el bot le va a pedir el pago del total por adelantado.",
      confirmLabel: "Marcar ausente",
      cancelLabel: "No, volver",
      tone: "destructive",
    });
    if (ok) markNoShow.mutate(booking.id);
  }

  const hasFilters = !!courtId || !!statusFilter;

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">Desde</span>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">Hasta</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-40"
            />
          </div>
          {courts.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs font-medium">Cancha</span>
              <Select value={courtId} onValueChange={(v) => setCourtId(v ?? "")}>
                <SelectTrigger className="w-44">
                  <SelectValue>
                    {(v) =>
                      !v || v === ""
                        ? "Todas las canchas"
                        : (courts.find((c) => c.id === v)?.name ?? "")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las canchas</SelectItem>
                  {courts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">Estado</span>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter((v ?? "") as BookingStatus | "")}
            >
              <SelectTrigger className="w-40">
                <SelectValue>
                  {(v) => {
                    if (!v || v === "") return "Todos";
                    return v === "CONFIRMED" ? "Confirmadas" : "Canceladas";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="CONFIRMED">Confirmadas</SelectItem>
                <SelectItem value="CANCELLED">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCourtId("");
                setStatusFilter("");
              }}
              className="text-muted-foreground self-end"
            >
              <X className="size-3.5" />
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Table */}
        {bookingsQuery.isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-16 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Cargando reservas…
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="Sin reservas"
            description={
              hasFilters
                ? "No hay reservas que coincidan con los filtros aplicados."
                : "Cuando se creen reservas van a aparecer acá."
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Turno</TableHead>
                  <TableHead>Jugador</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden md:table-cell">Precio</TableHead>
                  <TableHead className="hidden lg:table-cell">Reservado</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{booking.slot.court.name}</span>
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                          <CalendarClock className="size-3" />
                          {formatDay(booking.slot.startsAt)} ·{" "}
                          {formatTimeRange(booking.slot.startsAt, booking.slot.endsAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{booking.playerName}</span>
                        {booking.playerPhone && (
                          <span className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Phone className="size-3" />
                            {booking.playerPhone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                      {booking.settledAt && (
                        <span className="mt-0.5 block text-xs font-medium text-emerald-600">
                          cuenta completa ✓
                        </span>
                      )}
                      {booking.depositOutcome && (
                        <span className="text-muted-foreground mt-0.5 block text-xs">
                          {booking.depositOutcome === "CREDITED"
                            ? "seña a crédito"
                            : booking.depositOutcome === "FORFEITED"
                              ? "seña perdida"
                              : "seña devuelta"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {formatPrice(booking.slot.priceCents)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                      {new Date(booking.createdAt).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      {booking.status === "CONFIRMED" && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCollectingBooking(booking)}
                            className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
                            title="Cuenta del turno: consumos y quién va pagando"
                          >
                            {booking.settledAt ? "Cuenta ✓" : "Cuenta"}
                          </Button>
                          {new Date(booking.slot.startsAt) < new Date() &&
                            (booking.noShowAt ? (
                              <span className="text-destructive px-2 text-xs font-medium">
                                Ausente
                              </span>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => void handleNoShow(booking)}
                                disabled={markNoShow.isPending}
                                className="text-muted-foreground hover:text-destructive h-7 px-2 text-xs"
                              >
                                Ausente
                              </Button>
                            ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReschedulingBooking(booking)}
                            className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
                          >
                            Reprogramar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void handleCancel(booking)}
                            disabled={cancelBooking.isPending}
                            className="text-muted-foreground hover:text-destructive h-7 px-2 text-xs"
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {reschedulingBooking && (
        <RescheduleBookingDialog
          booking={reschedulingBooking}
          open={!!reschedulingBooking}
          onOpenChange={(v) => {
            if (!v) setReschedulingBooking(null);
          }}
        />
      )}

      {collectingBooking && (
        <AddProductsDialog
          bookingId={collectingBooking.id}
          playerName={collectingBooking.playerName}
          courtPriceCents={collectingBooking.slot.priceCents}
          currentProducts={collectingBooking.bookingProducts}
          open={!!collectingBooking}
          onOpenChange={(open) => {
            if (!open) setCollectingBooking(null);
          }}
        />
      )}
    </>
  );
}
