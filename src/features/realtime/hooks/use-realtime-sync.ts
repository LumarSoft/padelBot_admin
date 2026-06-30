"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { primeAudio, playCashSound } from "@/features/realtime/lib/play-cash-sound";
import { useSoundStore } from "@/features/realtime/stores/sound-store";

type BookingAction = "created" | "cancelled" | "rescheduled";

interface BookingChangedEvent {
  type: "booking.changed";
  action: BookingAction;
  summary: string;
}

interface ConversationMessageEvent {
  type: "conversation.message";
  sessionId: string;
  waId: string;
  playerName: string | null;
}

interface PaymentReceiptEvent {
  type: "payment.receipt";
  bookingId: string;
  summary: string;
}

interface PaymentConfirmedEvent {
  type: "payment.confirmed";
  summary: string;
  source: "AUTO" | "MANUAL";
}

type AppEvent =
  | BookingChangedEvent
  | ConversationMessageEvent
  | PaymentReceiptEvent
  | PaymentConfirmedEvent;

const TOAST_BY_ACTION: Record<BookingAction, (summary: string) => void> = {
  created: (s) => toast.success(`Nueva reserva: ${s}`),
  cancelled: (s) => toast.info(`Reserva cancelada: ${s}`),
  rescheduled: (s) => toast.info(`Reserva reprogramada: ${s}`),
};

/**
 * Subscribes to the server's SSE stream so bookings made elsewhere (the WhatsApp
 * bot, another admin) show up in the dashboard live — no manual reload. Each
 * event surfaces a toast and invalidates the booking/slot queries; React Query
 * then refetches whatever is on screen from the API (the single source of truth).
 */
export function useRealtimeSync(): void {
  const queryClient = useQueryClient();
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // Unlock audio on the first real interaction so the cash sound is allowed to play later.
    const unlock = () => primeAudio();
    window.addEventListener("pointerdown", unlock, { once: true });

    const source = new EventSource("/api/events");

    source.onmessage = (message) => {
      let event: AppEvent;
      try {
        event = JSON.parse(message.data) as AppEvent;
      } catch {
        return;
      }

      if (event.type === "payment.receipt") {
        // Just refresh the data — the sound + toast are owned by usePaymentReceiptAlerts,
        // which fires off the refreshed bookings (instant here, polled as a fallback). This
        // keeps a single, reliable alert path and avoids double-ringing.
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
        return;
      }

      if (event.type === "payment.confirmed") {
        // A payment just landed (auto-reconciled or confirmed by hand) — always ring the cash
        // alert so staff hear it on any screen, then refresh the bookings/slots views.
        if (!useSoundStore.getState().muted) playCashSound();
        toast.success(`💰 ¡Pago confirmado! ${event.summary}`, {
          description:
            event.source === "AUTO"
              ? "Se acreditó la transferencia y la reserva quedó asegurada."
              : "La reserva quedó asegurada.",
          duration: 8_000,
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.slots.all });
        return;
      }

      if (event.type === "booking.changed") {
        TOAST_BY_ACTION[event.action]?.(event.summary);
        // Coalesce bursts (e.g. a recurring booking applied to many days) into a
        // single refetch.
        clearTimeout(refetchTimer.current);
        refetchTimer.current = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.slots.all });
        }, 300);
        return;
      }

      if (event.type === "conversation.message") {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.list });
        queryClient.invalidateQueries({
          queryKey: queryKeys.conversations.messages(event.sessionId),
        });
      }
    };

    // EventSource reconnects automatically on transient drops; swallow the error
    // so it doesn't spam the console.
    source.onerror = () => {};

    return () => {
      clearTimeout(refetchTimer.current);
      window.removeEventListener("pointerdown", unlock);
      source.close();
    };
  }, [queryClient]);
}
