import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface OptionCardProps {
  name: string;
  value: string;
  checked: boolean;
  onSelect: () => void;
  label: string;
  hint?: ReactNode;
  disabled?: boolean;
}

/**
 * A radio rendered as a selectable tile. The settings that decide how the club takes money
 * are the ones an owner reads twice before touching, and a bare `<input type="radio">` next
 * to grey 12px text gives the selected choice no weight at all. The tile keeps the native
 * radio (so labels, keyboard and screen readers behave) and adds a legible surface with a
 * clear selected state.
 */
export function OptionCard({
  name,
  value,
  checked,
  onSelect,
  label,
  hint,
  disabled = false,
}: OptionCardProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors duration-200 ease-fluid",
        checked
          ? "border-brand/50 bg-brand/[0.07]"
          : "border-border/70 hover:border-border hover:bg-foreground/[0.02]",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        disabled={disabled}
        className="accent-brand mt-0.5 size-4 shrink-0"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {hint && (
          <span className="text-muted-foreground mt-0.5 block text-xs text-pretty">{hint}</span>
        )}
      </span>
    </label>
  );
}
