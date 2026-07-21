"use client";

import { useRealtimeSync } from "../hooks/use-realtime-sync";
import { usePaymentReceiptAlerts } from "../hooks/use-payment-alerts";

/**
 * Mount once inside the dashboard so the live SSE subscription and the payment-receipt
 * alert (sound + toast) persist across page navigations. Renders nothing.
 */
export function RealtimeSync(): null {
  useRealtimeSync();
  usePaymentReceiptAlerts();
  return null;
}
