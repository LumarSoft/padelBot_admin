"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePlan } from "@/features/plan/hooks/use-plan";
import { formatCount } from "@/features/plan/lib/format";

/** Ring radius of the collapsed meter (in a 32×32 viewBox). */
const RING_R = 13;
const RING_LENGTH = 2 * Math.PI * RING_R;

/**
 * "Créditos de IA · usados / del plan" at the foot of the sidebar, always in sight for the owner.
 * Opens Facturación. In the collapsed rail it shrinks to a progress ring with the numbers in a
 * tooltip.
 */
export function CreditsSidebarMeter({ collapsed = false }: { collapsed?: boolean }) {
  const { data } = usePlan();
  const credits = data?.aiCredits;
  if (!credits || credits.limit === null) return null;

  const share = credits.limit > 0 ? Math.min(100, (credits.used / credits.limit) * 100) : 100;
  const over = credits.used >= credits.limit;
  const tone = over ? "red" : share >= 80 ? "amber" : "brand";
  const usage = `${formatCount(credits.used)} / ${formatCount(credits.limit)}`;

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href="/panel/facturacion"
              aria-label={`Créditos de IA: ${usage}`}
              className="hover:bg-foreground/[0.04] mb-2 flex h-10 items-center justify-center rounded-lg transition-colors"
            />
          }
        >
          <svg viewBox="0 0 32 32" className="size-7 -rotate-90" aria-hidden>
            <circle cx="16" cy="16" r={RING_R} fill="none" strokeWidth="3" className="stroke-muted" />
            <circle
              cx="16"
              cy="16"
              r={RING_R}
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={RING_LENGTH}
              strokeDashoffset={RING_LENGTH * (1 - share / 100)}
              className={cn(
                "transition-[stroke-dashoffset] duration-700 ease-fluid",
                tone === "red" ? "stroke-red-500" : tone === "amber" ? "stroke-amber-500" : "stroke-brand",
              )}
            />
          </svg>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={14}>
          Créditos de IA · {usage}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      href="/panel/facturacion"
      className="hover:bg-foreground/[0.03] mb-2 flex flex-col gap-1.5 rounded-lg px-2.5 py-2 whitespace-nowrap transition-colors"
    >
      <span className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">Créditos de IA</span>
        <span className={cn("font-medium tabular-nums", over && "text-red-600 dark:text-red-400")}>
          {usage}
        </span>
      </span>
      <span aria-hidden className="bg-muted block h-1 overflow-hidden rounded-full">
        <span
          className={cn(
            "block h-full rounded-full",
            tone === "red" ? "bg-red-500" : tone === "amber" ? "bg-amber-500" : "bg-brand",
          )}
          style={{ width: `${share}%` }}
        />
      </span>
    </Link>
  );
}
