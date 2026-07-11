"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useBookings } from "@/features/reservas/hooks/use-bookings";
import {
  bandsForDate,
  dateToKey,
  shiftDay,
  todayKey,
  wallTimeToUtc,
  weekdayOfKey,
} from "@/features/agenda/lib/schedule";
import type { Court } from "@/types/api/turnos";

const DAY_NAMES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/** Monday of the week containing dayKey (club-local calendar). */
function weekStart(dayKey: string): string {
  const weekday = weekdayOfKey(dayKey); // 0 = Sunday
  const daysFromMonday = (weekday + 6) % 7;
  return shiftDay(dayKey, -daysFromMonday);
}

/**
 * The week at a glance ("¿cómo viene el sábado?"): seven day chips with an
 * occupancy bar (confirmed + pending vs. the day's total bands across courts).
 * Clicking a day jumps the grid to it.
 */
export function WeekStrip({
  dayKey,
  courts,
  onSelectDay,
}: {
  dayKey: string;
  courts: Court[];
  onSelectDay: (dayKey: string) => void;
}) {
  const start = weekStart(dayKey);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => shiftDay(start, i)), [start]);

  // One query for the whole week; occupancy = bookings that hold a slot.
  const from = wallTimeToUtc(start, "00:00").toISOString();
  const to = wallTimeToUtc(shiftDay(start, 7), "06:00").toISOString();
  const confirmedQuery = useBookings({ from, to, status: "CONFIRMED" });
  const pendingQuery = useBookings({ from, to, status: "PENDING_PAYMENT" });

  const occupiedByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const booking of [...(confirmedQuery.data ?? []), ...(pendingQuery.data ?? [])]) {
      const key = dateToKey(new Date(booking.slot.startsAt));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [confirmedQuery.data, pendingQuery.data]);

  const totalBandsByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const day of days) {
      map.set(
        day,
        courts.reduce((sum, court) => sum + bandsForDate(court, day).length, 0),
      );
    }
    return map;
  }, [days, courts]);

  const today = todayKey();

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((day) => {
        const total = totalBandsByDay.get(day) ?? 0;
        const occupied = Math.min(occupiedByDay.get(day) ?? 0, total);
        const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
        const selected = day === dayKey;
        const [, , dd] = day.split("-");
        return (
          <button
            key={day}
            type="button"
            onClick={() => onSelectDay(day)}
            aria-label={`Ver ${day} (${pct}% ocupado)`}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border px-1 py-1.5 text-xs transition-colors",
              selected ? "border-brand bg-brand/10" : "hover:bg-accent/60",
              day === today && !selected && "border-brand/40",
            )}
          >
            <span className={cn("capitalize", selected && "text-brand font-semibold")}>
              {DAY_NAMES[weekdayOfKey(day)]} {dd}
            </span>
            <span className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
              <span
                className={cn(
                  "block h-full rounded-full",
                  pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-brand" : "bg-muted-foreground/40",
                )}
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className="text-muted-foreground tabular-nums">
              {occupied}/{total}
            </span>
          </button>
        );
      })}
    </div>
  );
}
