import { cn } from "@/lib/utils";

/** A button's shortcut key, only where there is a mouse: a tablet has no F keys. */
export function KeyHint({ shortcut, className }: { shortcut: string; className?: string }) {
  return (
    <kbd
      aria-hidden
      className={cn(
        "hidden h-4.5 shrink-0 items-center rounded border border-current/25 px-1 font-mono text-[10px] leading-none font-medium opacity-70 pointer-fine:inline-flex",
        className,
      )}
    >
      {shortcut}
    </kbd>
  );
}
