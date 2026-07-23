import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

/** GTP brand mark: a rounded brand tile with a "ball" + optional wordmark. */
export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="bg-brand ring-brand/20 relative flex size-7 items-center justify-center rounded-lg shadow-sm ring-1">
        <span className="bg-brand-foreground size-2.5 rounded-full" />
      </span>
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-tight">
          Padel<span className="text-brand">Bot</span>
        </span>
      )}
    </span>
  );
}
