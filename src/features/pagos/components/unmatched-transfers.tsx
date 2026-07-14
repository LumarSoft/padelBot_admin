"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Banknote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPriceExact } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { paymentsService } from "@/services/payments.service";
import { bookingsService } from "@/services/bookings.service";
import { useBookings } from "@/features/reservas/hooks/use-bookings";
import { useAuthStore } from "@/stores/auth-store";
import type { MoneyInMovement } from "@/types/api/payments";

function movementLabel(movement: MoneyInMovement): string {
  const time = new Date(movement.dateCreated).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const day = new Date(movement.dateCreated).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${day} ${time}`;
}

function AssignRow({ movement }: { movement: MoneyInMovement }) {
  const pendingQuery = useBookings({ status: "PENDING_PAYMENT" });
  const [bookingId, setBookingId] = useState(movement.pendingMatch?.bookingId ?? "");
  const [assigning, setAssigning] = useState(false);
  const queryClient = useQueryClient();

  const pendings = pendingQuery.data ?? [];

  async function assign() {
    if (!bookingId) return;
    setAssigning(true);
    try {
      await bookingsService.confirmPayment(bookingId, {
        paymentRef: movement.id,
        payerCuit: movement.payerCuit ?? undefined,
        payerEmail: movement.payerEmail ?? undefined,
        payerMpUserId: movement.payerMpUserId ?? undefined,
      });
      toast.success("Transferencia asignada — reserva confirmada");
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments.moneyIn });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo asignar");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm">
      <span className="font-medium tabular-nums">{formatPriceExact(movement.amountCents)}</span>
      <span className="text-muted-foreground truncate text-xs">
        {movementLabel(movement)}
        {movement.payerName && ` · ${movement.payerName}`}
        {movement.derivedDni && ` · DNI ${movement.derivedDni}`}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <Select value={bookingId} onValueChange={(v) => setBookingId(v ?? "")}>
          <SelectTrigger size="sm" className="w-52">
            <SelectValue>
              {(v) => {
                const b = pendings.find((p) => p.id === v);
                return b
                  ? `${b.playerName} — ${formatPriceExact(b.transferAmountCents ?? b.depositCents)}`
                  : "Asignar a…";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {pendings.map((booking) => (
              <SelectItem key={booking.id} value={booking.id}>
                {booking.playerName} — {formatPriceExact(booking.transferAmountCents ?? booking.depositCents)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="sm" onClick={assign} disabled={!bookingId || assigning}>
          {assigning ? "Asignando…" : "Asignar"}
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

/**
 * The "casi-match" queue: recent incoming transfers that did NOT auto-reconcile
 * (different amount, unknown DNI…), shown next to the pending bookings so staff
 * assigns them in one click instead of guessing in the MercadoPago app. Owner-only
 * (the underlying diagnostics expose payer identity).
 *
 * Scoped to the last hour on purpose. Most money landing in the club's account is people
 * paying for the match they just played, not señas — over 24 h those drown the one transfer
 * that actually needs assigning, which is always a recent one (a seña expires in 30 min).
 */
const UNMATCHED_WINDOW_MINUTES = 60;

export function UnmatchedTransfers() {
  const role = useAuthStore((state) => state.user?.role);
  const moneyInQuery = useQuery({
    queryKey: queryKeys.payments.moneyIn,
    queryFn: () => paymentsService.getMoneyIn(UNMATCHED_WINDOW_MINUTES),
    enabled: role === "owner",
    refetchInterval: 60_000,
  });
  const pendingQuery = useBookings({ status: "PENDING_PAYMENT" });

  if (role !== "owner") return null;
  const hasPendings = (pendingQuery.data ?? []).length > 0;
  const unmatched = (moneyInQuery.data?.movements ?? []).filter(
    (m) => !m.alreadyUsed && (!m.pendingMatch || !m.pendingMatch.dniMatches),
  );
  if (!hasPendings || unmatched.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Banknote className="text-muted-foreground size-4 shrink-0" />
        <h2 className="text-sm font-semibold">Transferencias sin asignar (última hora)</h2>
        <span className="text-muted-foreground text-xs">
          Entraron pero no matchearon solas
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {unmatched.map((movement) => (
          <AssignRow key={movement.id} movement={movement} />
        ))}
      </div>
    </section>
  );
}
