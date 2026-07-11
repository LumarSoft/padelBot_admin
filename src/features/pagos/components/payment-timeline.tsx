"use client";

import { cn } from "@/lib/utils";
import type { Booking } from "@/types/api/bookings";

function at(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
  const time = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day} ${time}`;
}

interface Step {
  label: string;
  done: boolean;
  danger?: boolean;
}

/**
 * The payment's reasoning, visible: pendiente → (comprobante / crédito) → confirmada
 * (automática por transferencia, o manual) → vence. Turning the black box into steps
 * is what makes the owner trust the automatic reconciliation.
 */
export function PaymentTimeline({ booking }: { booking: Booking }) {
  const steps: Step[] = [{ label: `Creada ${at(booking.createdAt)}`, done: true }];

  if (booking.creditAppliedCents > 0) {
    steps.push({ label: "Crédito del jugador aplicado", done: true });
  }
  if (booking.receiptUploadedAt) {
    steps.push({ label: `Comprobante recibido ${at(booking.receiptUploadedAt)}`, done: true });
  }

  if (booking.status === "CONFIRMED") {
    steps.push({
      label: booking.mpPaymentId
        ? `Confirmada ${at(booking.updatedAt)} — transferencia detectada (MP #${booking.mpPaymentId})`
        : `Confirmada ${at(booking.updatedAt)} — a mano desde el panel`,
      done: true,
    });
  } else if (booking.status === "PENDING_PAYMENT" && booking.paymentExpiresAt) {
    const expired = new Date(booking.paymentExpiresAt) < new Date();
    steps.push({
      label: expired
        ? `Venció ${at(booking.paymentExpiresAt)}`
        : `Esperando transferencia — vence ${at(booking.paymentExpiresAt)}`,
      done: false,
      danger: expired,
    });
  } else if (booking.status === "CANCELLED") {
    steps.push({
      label:
        booking.depositOutcome === "CREDITED"
          ? "Cancelada — seña a crédito del jugador"
          : booking.depositOutcome === "FORFEITED"
            ? "Cancelada — seña perdida"
            : booking.depositOutcome === "REFUNDED"
              ? "Cancelada — seña devuelta"
              : "Cancelada sin pago",
      done: true,
      danger: true,
    });
  }

  return (
    <ol className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
      {steps.map((step, i) => (
        <li key={step.label} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden>→</span>}
          <span
            aria-hidden
            className={cn(
              "size-1.5 rounded-full",
              step.danger ? "bg-red-500" : step.done ? "bg-emerald-500" : "bg-amber-500",
            )}
          />
          <span className={cn(step.danger && "text-red-600")}>{step.label}</span>
        </li>
      ))}
    </ol>
  );
}
