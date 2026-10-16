"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Court } from "@/types/api/turnos";

/** The courts the event takes, as on/off chips (lleno = la usa). */
export function CourtToggles({
  courts,
  value,
  onChange,
  disabled,
}: {
  courts: Court[];
  value: string[];
  onChange: (courtIds: string[]) => void;
  disabled?: boolean;
}) {
  function toggle(courtId: string) {
    onChange(value.includes(courtId) ? value.filter((id) => id !== courtId) : [...value, courtId]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {courts.map((court) => {
        const active = value.includes(court.id);
        return (
          <button
            key={court.id}
            type="button"
            disabled={disabled}
            onClick={() => toggle(court.id)}
            aria-pressed={active}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-brand bg-brand/20 text-foreground"
                : "text-muted-foreground border-dashed hover:border-solid hover:text-foreground",
            )}
          >
            {active && <Check className="text-brand size-3.5" />}
            {court.name}
          </button>
        );
      })}
    </div>
  );
}
