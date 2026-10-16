"use client";

import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useUpdateLead } from "@/features/ops/hooks/use-ops";
import type { Lead } from "@/types/api/ops";

/** Argentina is UTC−3 all year: club-local days without a timezone library. */
const OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Club-local "YYYY-MM-DD", `days` from today. */
function dayKey(days: number): string {
  return new Date(Date.now() - OFFSET_MS + days * DAY_MS).toISOString().slice(0, 10);
}

/** The club-local day of a stored instant. */
function keyOf(iso: string): string {
  return new Date(new Date(iso).getTime() - OFFSET_MS).toISOString().slice(0, 10);
}

const QUICK: { label: string; days: number }[] = [
  { label: "Mañana", days: 1 },
  { label: "En 3 días", days: 3 },
  { label: "En una semana", days: 7 },
];

/**
 * "Volver a llamar": the day to call this lead back. It lands in the leads screen's "Para hoy"
 * list on that day and stays there, marked overdue, until it's moved or the lead closes.
 */
export function LeadFollowUp({ lead }: { lead: Lead }) {
  const update = useUpdateLead();
  const today = dayKey(0);
  const due = lead.followUpAt ? keyOf(lead.followUpAt) : null;

  // Stored as 9:00 club-local of that day.
  function set(key: string | null): void {
    update.mutate({
      id: lead.id,
      payload: { followUpAt: key ? `${key}T09:00:00-03:00` : null },
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground flex items-center gap-1.5">
        <CalendarClock className="size-4" />
        Volver a llamar
      </span>
      <Input
        type="date"
        aria-label="Fecha para volver a llamar"
        value={due ?? ""}
        min={today}
        onChange={(event) => set(event.target.value || null)}
        disabled={update.isPending}
        className="h-8 w-auto"
      />
      {due && due <= today && (
        <span
          className={cn(
            "text-xs font-medium",
            due < today ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400",
          )}
        >
          {due < today ? "Atrasado" : "Hoy"}
        </span>
      )}
      {QUICK.map((option) => (
        <Button
          key={option.days}
          variant="ghost"
          size="sm"
          onClick={() => set(dayKey(option.days))}
          disabled={update.isPending}
        >
          {option.label}
        </Button>
      ))}
      {due && (
        <Button variant="ghost" size="sm" onClick={() => set(null)} disabled={update.isPending}>
          Quitar
        </Button>
      )}
    </div>
  );
}
