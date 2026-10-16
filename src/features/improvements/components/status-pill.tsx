import { cn } from "@/lib/utils";

/** Small colored pill for an improvement's or a suggestion's status. */
export function StatusPill({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] font-medium whitespace-nowrap",
        tone,
      )}
    >
      {label}
    </span>
  );
}
