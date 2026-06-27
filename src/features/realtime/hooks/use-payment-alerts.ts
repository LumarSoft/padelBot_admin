"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useBookings } from "@/features/reservas/hooks/use-bookings";
import { useSoundStore } from "@/features/realtime/stores/sound-store";
import { playCashSound } from "@/features/realtime/lib/play-cash-sound";

/** How often to re-check for new receipts, as a fallback if a live SSE event is missed. */
const POLL_MS = 15_000;

/**
 * Rings the cash alert when a NEW transfer receipt arrives. Unlike the fire-and-forget SSE
 * event, this is driven by the bookings data the panel already polls, so the alert survives a
 * missed event (SSE reconnect, API restart, the panel opened after the receipt landed). The
 * SSE handler still invalidates this query, so when the live event works the alert is near
 * instant; otherwise the poll catches it within ~15s. Receipts already present on first load
 * are seeded silently (no ring) — the pulsing badge already flags them visually.
 */
export function usePaymentReceiptAlerts(): void {
  const { data } = useBookings({ status: "PENDING_PAYMENT" }, { refetchInterval: POLL_MS });
  // null = not yet seeded; a Set once we've seen the first snapshot.
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!data) return;
    const withReceipt = data.filter((b) => b.hasReceipt).map((b) => b.id);

    // First snapshot: remember what's already there without alerting.
    if (seen.current === null) {
      seen.current = new Set(withReceipt);
      return;
    }

    const fresh = withReceipt.filter((id) => !seen.current!.has(id));
    // Reset the baseline to the current set (so confirmed/rejected ids drop out and a future
    // re-pending of the same slot can alert again).
    seen.current = new Set(withReceipt);

    if (fresh.length === 0) return;
    if (!useSoundStore.getState().muted) playCashSound();
    toast.success(
      fresh.length === 1
        ? "💸 Nuevo comprobante para revisar"
        : `💸 ${fresh.length} comprobantes nuevos para revisar`,
      { description: "Abrí Pagos para confirmar o rechazar.", duration: 10_000 },
    );
  }, [data]);
}
