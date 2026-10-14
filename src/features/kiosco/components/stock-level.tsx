import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { isLowStock } from "@/types/api/stock";

/**
 * A product's stock at a glance: the number, amber when it's at or below its minimum and red
 * once it ran out. Untracked products read "Sin control" so nobody mistakes them for zero.
 */
export function StockLevel({
  stockQuantity,
  lowStockThreshold,
  className,
}: {
  stockQuantity: number | null;
  lowStockThreshold: number | null;
  className?: string;
}) {
  if (stockQuantity === null) {
    return (
      <span className={cn("text-muted-foreground text-xs", className)}>
        Sin control
      </span>
    );
  }

  const low = isLowStock({ stockQuantity, lowStockThreshold });
  const out = stockQuantity <= 0;

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-sm tabular-nums", className)}
      title={
        lowStockThreshold !== null ? `Mínimo: ${lowStockThreshold}` : undefined
      }
    >
      <span
        className={cn(
          "font-semibold",
          out
            ? "text-destructive"
            : low
              ? "text-amber-600 dark:text-amber-400"
              : "text-foreground",
        )}
      >
        {stockQuantity}
      </span>
      {low && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
            out
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
          )}
        >
          <AlertTriangle className="size-3" />
          {out ? "Sin stock" : "Bajo"}
        </span>
      )}
    </span>
  );
}
