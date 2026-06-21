"use client";

import { useRealtimeSync } from "../hooks/use-realtime-sync";

/**
 * Mount once inside the dashboard so the live SSE subscription persists across
 * page navigations. Renders nothing.
 */
export function RealtimeSync(): null {
  useRealtimeSync();
  return null;
}
