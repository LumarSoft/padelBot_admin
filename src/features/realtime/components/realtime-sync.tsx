"use client";

import { useRealtimeSync } from "../hooks/use-realtime-sync";
import { usePaymentReceiptAlerts } from "../hooks/use-payment-alerts";
import { useConversationAlerts } from "@/features/conversations/hooks/use-conversation-alerts";

/**
 * Mount once inside the dashboard so the live SSE subscription and the alerts (sound + toast)
 * for payment receipts and for WhatsApp chats waiting on a person persist across page
 * navigations. Renders nothing.
 */
export function RealtimeSync(): null {
  useRealtimeSync();
  usePaymentReceiptAlerts();
  useConversationAlerts();
  return null;
}
