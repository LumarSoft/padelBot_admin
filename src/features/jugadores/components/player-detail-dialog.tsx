"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format";
import { usePlayerDetail, useUpdatePlayer } from "@/features/jugadores/hooks/use-players";
import type { PlayerBooking } from "@/types/api/players";

function bookingLabel(booking: PlayerBooking): string {
  const start = new Date(booking.slot.startsAt);
  const date = start.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
  const time = start.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} ${time} · ${booking.slot.court.name}`;
}

function bookingBadge(booking: PlayerBooking) {
  if (booking.noShowAt) return <Badge variant="destructive">Ausente</Badge>;
  if (booking.status === "CONFIRMED") return <Badge variant="default">Confirmada</Badge>;
  if (booking.status === "CANCELLED") return <Badge variant="secondary">Cancelada</Badge>;
  return <Badge variant="outline">Pendiente</Badge>;
}

export function PlayerDetailDialog({
  playerId,
  open,
  onOpenChange,
}: {
  playerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const detailQuery = usePlayerDetail(open ? playerId : null);
  const updatePlayer = useUpdatePlayer();
  const player = detailQuery.data;

  function toggleBlocked() {
    if (!player) return;
    updatePlayer.mutate(
      { id: player.id, body: { isBlocked: !player.isBlocked } },
      {
        onSuccess: () =>
          toast.success(player.isBlocked ? "Jugador desbloqueado" : "Jugador bloqueado"),
      },
    );
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {detailQuery.isLoading || !player ? (
          <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Cargando ficha…
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {player.name ?? "Sin nombre"}
                {player.isBlocked && <Badge variant="destructive">Bloqueado</Badge>}
              </DialogTitle>
              <DialogDescription>
                {player.phone}
                {player.dni ? ` · DNI ${player.dni}` : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border p-3">
                <p className="text-lg font-semibold tabular-nums">{player.bookings.length}</p>
                <p className="text-muted-foreground text-xs">últimas reservas</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-lg font-semibold tabular-nums">{player.noShowCount}</p>
                <p className="text-muted-foreground text-xs">ausencias</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-lg font-semibold tabular-nums">
                  {player.creditCents > 0 ? formatPrice(player.creditCents) : "—"}
                </p>
                <p className="text-muted-foreground text-xs">crédito a favor</p>
              </div>
            </div>

            {player.noShowCount >= 3 && !player.isBlocked && (
              <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs">
                Por acumular ausencias, el bot le exige el precio total como seña.
              </p>
            )}

            <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
              {player.bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm"
                >
                  <span>{bookingLabel(booking)}</span>
                  {bookingBadge(booking)}
                </div>
              ))}
              {player.bookings.length === 0 && (
                <p className="text-muted-foreground py-2 text-sm">Sin reservas registradas.</p>
              )}
            </div>

            <NotesEditor
              key={player.id}
              initialNotes={player.notes ?? ""}
              saving={updatePlayer.isPending}
              onSave={(notes) =>
                updatePlayer.mutate(
                  { id: player.id, body: { notes } },
                  { onSuccess: () => toast.success("Notas guardadas") },
                )
              }
            />

            <div className="flex justify-end">
              <Button
                variant={player.isBlocked ? "outline" : "destructive"}
                size="sm"
                onClick={toggleBlocked}
                disabled={updatePlayer.isPending}
              >
                {player.isBlocked ? "Desbloquear jugador" : "Bloquear jugador"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Notes with local draft state; remounted per player via `key` so it never syncs in an effect. */
function NotesEditor({
  initialNotes,
  saving,
  onSave,
}: {
  initialNotes: string;
  saving: boolean;
  onSave: (notes: string) => void;
}) {
  const [notes, setNotes] = useState(initialNotes);

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="player-notes">Notas del club</Label>
      <textarea
        id="player-notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        maxLength={2000}
        className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
        placeholder="Ej: siempre paga en efectivo, pide la 2 techada…"
      />
      {notes !== initialNotes && (
        <Button size="sm" variant="outline" onClick={() => onSave(notes)} disabled={saving}>
          Guardar notas
        </Button>
      )}
    </div>
  );
}
