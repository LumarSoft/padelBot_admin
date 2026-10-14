"use client";

import { SearchX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { timeAgo } from "@/features/ops/lib/labels";
import { useHelpSearchMisses } from "@/features/ops/hooks/use-ops";

/**
 * What the clubs' receptionists searched in the panel's "?" help and found nothing for — the
 * next answers to write in `front/src/features/help/content/faq.ts`. Last 90 days.
 */
export function HelpSearchMisses() {
  const misses = useHelpSearchMisses();

  return (
    <Card>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium">Ayuda del panel: lo que buscaron y no encontraron</p>
          <p className="text-muted-foreground text-xs">
            Preguntas de recepción que todavía no tienen respuesta. Las más buscadas, primero.
          </p>
        </div>
        {misses.isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando…</p>
        ) : misses.data && misses.data.length > 0 ? (
          <ul className="divide-border/60 divide-y">
            {misses.data.map((miss) => (
              <li
                key={`${miss.clubId}-${miss.query}`}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="font-medium">«{miss.query}»</span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {miss.clubName} · {timeAgo(miss.lastSearchedAt)}
                  </span>
                </span>
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {miss.count} {miss.count === 1 ? "vez" : "veces"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <SearchX className="size-4" />
            Nadie se quedó sin respuesta en los últimos 90 días.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
