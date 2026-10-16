"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SessionInput } from "@/types/api/competitions";

/**
 * The time windows of the event: one row per day (fecha, desde, hasta). A "hasta" at or before
 * the "desde" ends past midnight. A peña uses a single row.
 */
export function SessionRows({
  value,
  onChange,
  single,
  disabled,
}: {
  value: SessionInput[];
  onChange: (sessions: SessionInput[]) => void;
  /** Only one window (peña). */
  single?: boolean;
  disabled?: boolean;
}) {
  function patch(index: number, change: Partial<SessionInput>) {
    onChange(value.map((s, i) => (i === index ? { ...s, ...change } : s)));
  }

  function addDay() {
    const last = value[value.length - 1];
    onChange([...value, { dateKey: last?.dateKey ?? "", startTime: last?.startTime ?? "09:00", endTime: last?.endTime ?? "23:00" }]);
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((session, index) => (
        <div key={index} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
          <Input
            type="date"
            aria-label="Fecha"
            value={session.dateKey}
            onChange={(e) => patch(index, { dateKey: e.target.value })}
            disabled={disabled}
          />
          <Input
            type="time"
            aria-label="Desde"
            value={session.startTime}
            onChange={(e) => patch(index, { startTime: e.target.value })}
            disabled={disabled}
            className="w-28"
          />
          <Input
            type="time"
            aria-label="Hasta"
            value={session.endTime}
            onChange={(e) => patch(index, { endTime: e.target.value })}
            disabled={disabled}
            className="w-28"
          />
          {single ? (
            <span />
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Quitar día"
              disabled={disabled || value.length === 1}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              <X />
            </Button>
          )}
        </div>
      ))}
      {!single && (
        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={addDay} disabled={disabled}>
          <Plus />
          Agregar día
        </Button>
      )}
    </div>
  );
}
