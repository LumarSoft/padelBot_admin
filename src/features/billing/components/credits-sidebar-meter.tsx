"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePlan } from "@/features/plan/hooks/use-plan";
import { formatCount } from "@/features/plan/lib/format";

/**
 * "Créditos de IA · usados / del plan" at the foot of the sidebar, always in sight for the owner.
 * Opens Facturación.
 */
export function CreditsSidebarMeter() {
  const { data } = usePlan();
  const credits = data?.aiCredits;
  if (!credits || credits.limit === null) return null;

  const share = credits.limit > 0 ? Math.min(100, (credits.used / credits.limit) * 100) : 100;
  const over = credits.used >= credits.limit;

  return (
    <Link
      href="/panel/facturacion"
      className="hover:bg-foreground/[0.03] mb-2 flex flex-col gap-1.5 rounded-lg px-2.5 py-2 transition-colors"
    >
      <span className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">Créditos de IA</span>
        <span className={cn("font-medium tabular-nums", over && "text-red-600 dark:text-red-400")}>
          {formatCount(credits.used)} / {formatCount(credits.limit)}
        </span>
      </span>
      <span aria-hidden className="bg-muted block h-1 overflow-hidden rounded-full">
        <span
          className={cn(
            "block h-full rounded-full",
            over ? "bg-red-500" : share >= 80 ? "bg-amber-500" : "bg-brand",
          )}
          style={{ width: `${share}%` }}
        />
      </span>
    </Link>
  );
}
