"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
import { toast } from "sonner";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * The front desk's computer loses Wi-Fi: say so plainly, under the header, instead of letting
 * saves fail one by one. When it comes back a toast confirms it (TanStack Query refetches what's
 * on screen by itself on reconnect).
 */
export function ConnectionStatus() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      toast.success("Volvió la conexión", { description: "Ya se está actualizando lo que cambió." });
    }
  }, [online]);

  if (online) return null;
  return (
    <div
      role="status"
      className="sticky top-14 z-10 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white"
    >
      <WifiOff className="size-4 shrink-0" />
      Sin conexión a internet. Lo que hagas no se guarda hasta que vuelva.
    </div>
  );
}
