import { cn } from "@/lib/utils";

/**
 * GTP brand mark for the public landing — a rounded brand tile with a
 * "ball" plus the product wordmark. Mirrors the in-app Logo visual language.
 */
export function BrandWordmark({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="bg-brand ring-brand/20 relative flex size-8 items-center justify-center rounded-xl shadow-sm ring-1">
        <span className="bg-brand-foreground size-3 rounded-full" />
      </span>
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight">GTP</span>
      )}
    </span>
  );
}
