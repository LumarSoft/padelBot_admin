"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WeeklyHours } from "@/types/api/turnos";

const DAYS: { key: keyof WeeklyHours; label: string }[] = [
  { key: "1", label: "Lunes" },
  { key: "2", label: "Martes" },
  { key: "3", label: "Miércoles" },
  { key: "4", label: "Jueves" },
  { key: "5", label: "Viernes" },
  { key: "6", label: "Sábado" },
  { key: "0", label: "Domingo" },
];

type DayMode = "default" | "custom" | "closed";

const MODE_LABELS: Record<DayMode, string> = {
  default: "Horario general",
  custom: "Personalizado",
  closed: "Cerrado",
};

function modeOf(value: WeeklyHours, key: keyof WeeklyHours): DayMode {
  if (!(key in value)) return "default";
  return value[key] === null ? "closed" : "custom";
}

/**
 * Per-weekday opening-hours overrides. Each day is either on the court's general
 * hours (no key), custom hours, or closed (explicit null) — mirrors the API's
 * `weeklyHours` shape. A close time ≤ the open time means past-midnight close.
 */
export function WeeklyHoursEditor({
  value,
  onChange,
  defaultOpen,
  defaultClose,
  disabled,
}: {
  value: WeeklyHours;
  onChange: (next: WeeklyHours) => void;
  defaultOpen: string;
  defaultClose: string;
  disabled?: boolean;
}) {
  function setMode(key: keyof WeeklyHours, mode: DayMode) {
    const next = { ...value };
    if (mode === "default") delete next[key];
    else if (mode === "closed") next[key] = null;
    else next[key] = { open: defaultOpen, close: defaultClose };
    onChange(next);
  }

  function setHours(key: keyof WeeklyHours, field: "open" | "close", time: string) {
    const current = value[key];
    if (!current) return;
    onChange({ ...value, [key]: { ...current, [field]: time } });
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>Horarios por día</Label>
      <p className="text-muted-foreground text-xs">
        Los días sin ajuste usan el horario general. Un cierre menor a la apertura
        (ej. 01:00) significa que cierra pasada la medianoche.
      </p>
      <div className="flex flex-col gap-1.5">
        {DAYS.map(({ key, label }) => {
          const mode = modeOf(value, key);
          const hours = value[key];
          return (
            // The custom hours wrap onto their own line when the dialog is too narrow to
            // hold day + mode + both times — otherwise the time inputs push out of it.
            <div key={key} className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="w-20 shrink-0 text-sm">{label}</span>
              <Select
                value={mode}
                onValueChange={(v) => setMode(key, (v as DayMode) ?? "default")}
              >
                <SelectTrigger className="h-8 min-w-0 flex-1 text-xs" disabled={disabled}>
                  <SelectValue>{(v) => MODE_LABELS[v as DayMode]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(MODE_LABELS) as DayMode[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {MODE_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mode === "custom" && hours && (
                <div className="flex w-full items-center gap-1 pl-20 sm:w-auto sm:pl-0">
                  <Input
                    type="time"
                    value={hours.open}
                    onChange={(e) => setHours(key, "open", e.target.value)}
                    disabled={disabled}
                    className="h-8 min-w-0 flex-1 text-xs sm:w-24 sm:flex-none"
                    aria-label={`Apertura ${label}`}
                  />
                  <span className="text-muted-foreground text-xs">–</span>
                  <Input
                    type="time"
                    value={hours.close}
                    onChange={(e) => setHours(key, "close", e.target.value)}
                    disabled={disabled}
                    className="h-8 min-w-0 flex-1 text-xs sm:w-24 sm:flex-none"
                    aria-label={`Cierre ${label}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
