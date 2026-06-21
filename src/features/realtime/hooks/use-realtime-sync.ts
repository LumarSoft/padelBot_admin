"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";

type BookingAction = "created" | "cancelled" | "rescheduled";

interface BookingChangedEvent {
  type: "booking.changed";
  action: BookingAction;
  summary: string;
}

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
    const source = new EventSource("/api/events");

    source.onmessage = (message) => {
      let event: BookingChangedEvent;
      try {
        event = JSON.parse(message.data) as BookingChangedEvent;
      } catch {
        return;
      }
      if (event.type !== "booking.changed") return;

      TOAST_BY_ACTION[event.action]?.(event.summary);

      // Coalesce bursts (e.g. a recurring booking applied to many days) into a
      // single refetch.
      clearTimeout(refetchTimer.current);
      refetchTimer.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.slots.all });
      }, 300);
    };

    // EventSource reconnects automatically on transient drops; swallow the error
    // so it doesn't spam the console.
    source.onerror = () => {};

    return () => {
      clearTimeout(refetchTimer.current);
      source.close();
    };
  }, [queryClient]);
}
