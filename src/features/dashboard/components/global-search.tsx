"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const date = start.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
  const time = start.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date} · ${time} · ${booking.slot.court.name}`;
}

const STATUS_META: Record<
  Booking["status"],
  { label: string; className: string }
> = {
  CONFIRMED: {
    label: "Confirmada",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  PENDING_PAYMENT: {
    label: "Pendiente",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  CANCELLED: {
    label: "Cancelada",
    className:
      "border-muted bg-muted/50 text-muted-foreground",
  },
};

/**
 * Header-wide search: "¿cuándo juega Martínez?" — type a name or phone, get
 * their bookings, click or arrow-navigate to jump to that day's agenda.
 *
 * UX upgrades:
 * - Pill input expands with a spring animation on focus
 * - Search icon shifts + tints when active
 * - Inline clear button fades in once there's text
 * - Results drop in with a stagger animation
 * - Full keyboard nav: ↑ ↓ Enter Escape
 * - Semantic status badges per booking state
 */
export function GlobalSearch() {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounced = useDebounced(term.trim(), 280);

  const resultsQuery = useQuery({
    queryKey: queryKeys.bookings.list({ search: debounced }),
    queryFn: () => bookingsService.list({ search: debounced }),
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  });

  // Close on click outside
  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setFocused(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const results = resultsQuery.data ?? [];
  const showPanel = focused && debounced.length >= 2;

  // Reset active index whenever results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  const goTo = useCallback(
    (booking: Booking) => {
      setFocused(false);
      setTerm("");
      setActiveIndex(-1);
      router.push(
        `/panel/agenda?date=${dateToKey(new Date(booking.slot.startsAt))}`,
      );
    },
    [router],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showPanel) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      goTo(results[activeIndex]);
    } else if (e.key === "Escape") {
      setFocused(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  }

  // Scroll the active item into view inside the dropdown
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const isActive = focused || term.length > 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative hidden md:block transition-[width] duration-300",
        isActive ? "w-72" : "w-56",
      )}
      style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.35, 0.64, 1)" }}
    >
      {/* Search icon — shifts slightly and tints when active */}
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 transition-all duration-300",
          isActive
            ? "text-brand translate-x-0"
            : "text-muted-foreground",
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.35, 0.64, 1)" }}
      />

      <input
        ref={inputRef}
        type="text"
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
        }}
        onFocus={() => setFocused(true)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar jugador o teléfono…"
        aria-label="Buscar reservas por jugador"
        autoComplete="off"
        className={cn(
          "w-full rounded-full border py-1.5 pr-8 pl-9 text-sm outline-none transition-all duration-300",
          "bg-card/60 backdrop-blur-sm",
          "placeholder:text-muted-foreground/60",
          isActive
            ? "border-brand/40 ring-2 ring-brand/15 shadow-[0_0_0_3px_oklch(var(--brand)/0.08)]"
            : "border-border/80 hover:border-border",
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.35, 0.64, 1)" }}
      />

      {/* Clear button — fades in when there's text */}
      <button
        type="button"
        aria-label="Limpiar búsqueda"
        onClick={() => {
          setTerm("");
          inputRef.current?.focus();
        }}
        className={cn(
          "absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-0.5 transition-all duration-200",
          "text-muted-foreground/60 hover:text-foreground hover:bg-muted/60",
          term.length > 0
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-75 pointer-events-none",
        )}
      >
        <X className="size-3" />
      </button>

      {/* Dropdown */}
      {showPanel && (
        <div
          className={cn(
            "animate-scale-in absolute top-[calc(100%+6px)] right-0 left-0 z-30",
            "bg-popover rounded-xl p-1",
            "shadow-[inset_0_1px_0_0_var(--glass-highlight),var(--glass-shadow-lg)]",
            "ring-foreground/10 ring-1",
            "max-h-80 overflow-y-auto",
          )}
        >
          {resultsQuery.isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 p-3 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Buscando…
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-3 py-5 text-center">
              <Search className="text-muted-foreground/40 size-7" />
              <p className="text-muted-foreground text-sm">
                Sin resultados para{" "}
                <span className="font-medium text-foreground">"{debounced}"</span>
              </p>
              <p className="text-muted-foreground/60 text-xs">
                Probá con otro nombre o teléfono
              </p>
            </div>
          ) : (
            <div ref={listRef} className="stagger-children flex flex-col">
              {results.map((booking, i) => {
                const statusMeta = STATUS_META[booking.status];
                return (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => goTo(booking)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn(
                      "group flex w-full flex-col gap-1 rounded-lg px-2.5 py-2 text-left transition-colors duration-150",
                      i === activeIndex
                        ? "bg-foreground/[0.07] dark:bg-white/[0.08]"
                        : "hover:bg-foreground/[0.04] dark:hover:bg-white/[0.05]",
                    )}
                  >
                    {/* Name row + status badge */}
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium leading-none">
                        {booking.playerName}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none backdrop-blur-sm",
                          statusMeta.className,
                        )}
                      >
                        {statusMeta.label}
                      </span>
                    </span>
                    {/* Date + court sub-line */}
                    <span className="text-muted-foreground text-xs leading-none">
                      {resultLabel(booking)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
