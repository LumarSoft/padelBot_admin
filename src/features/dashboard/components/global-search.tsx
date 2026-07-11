"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { queryKeys } from "@/lib/query-keys";
import { bookingsService } from "@/services/bookings.service";
import { dateToKey } from "@/features/agenda/lib/schedule";
import type { Booking } from "@/types/api/bookings";

function useDebounced(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function resultLabel(booking: Booking): string {
  const start = new Date(booking.slot.startsAt);
  const date = start.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" });
  const time = start.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} ${time} · ${booking.slot.court.name}`;
}

/**
 * Header-wide search: "¿cuándo juega Martínez?" — type a name or phone, get their
 * bookings, click one and land on that day's agenda grid.
 */
export function GlobalSearch() {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounced = useDebounced(term.trim(), 300);

  const resultsQuery = useQuery({
    queryKey: queryKeys.bookings.list({ search: debounced }),
    queryFn: () => bookingsService.list({ search: debounced }),
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  });

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const results = resultsQuery.data ?? [];
  const showPanel = open && debounced.length >= 2;

  function goTo(booking: Booking) {
    setOpen(false);
    setTerm("");
    router.push(`/panel/agenda?date=${dateToKey(new Date(booking.slot.startsAt))}`);
  }

  return (
    <div ref={containerRef} className="relative hidden w-64 md:block">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar jugador o teléfono…"
        className="h-9 rounded-full pl-9 text-sm"
        aria-label="Buscar reservas por jugador"
      />
      {/* Solid (not glass): this dropdown lives inside the glass header, and a
          descendant's backdrop-filter can't sample the page behind it (CSS
          backdrop-root), so translucency here reads as cheap transparency. */}
      {showPanel && (
        <div className="animate-scale-in bg-popover ring-foreground/10 absolute top-11 right-0 left-0 z-30 max-h-80 origin-top overflow-y-auto rounded-xl p-1 shadow-[inset_0_1px_0_0_var(--glass-highlight),var(--glass-shadow-lg)] ring-1">
          {resultsQuery.isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 p-3 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Buscando…
            </div>
          ) : results.length === 0 ? (
            <p className="text-muted-foreground p-3 text-sm">Sin reservas para “{debounced}”.</p>
          ) : (
            results.map((booking) => (
              <button
                key={booking.id}
                type="button"
                onClick={() => goTo(booking)}
                className="flex w-full flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors duration-150 not-last:mb-0.5 hover:bg-foreground/[0.05] dark:hover:bg-white/[0.06]"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-medium">{booking.playerName}</span>
                  <Badge
                    variant={
                      booking.status === "CONFIRMED"
                        ? "default"
                        : booking.status === "CANCELLED"
                          ? "secondary"
                          : "outline"
                    }
                    className="text-[10px]"
                  >
                    {booking.status === "CONFIRMED"
                      ? "Confirmada"
                      : booking.status === "CANCELLED"
                        ? "Cancelada"
                        : "Pendiente"}
                  </Badge>
                </span>
                <span className="text-muted-foreground text-xs">{resultLabel(booking)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
