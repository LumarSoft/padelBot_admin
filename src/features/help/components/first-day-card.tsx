"use client";

import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDismissFirstDay, useFirstDay } from "@/features/help/hooks/use-help";
import { useTourStore } from "@/features/help/stores/tour-store";
import { FirstDayList, FirstDayProgress } from "@/features/help/components/first-day-list";

/**
 * "Tu primer día" on the staff's Resumen: the five daily desk tasks, each ticked by the API
 * the first time this user really does it. Closable, and gone once all five are done — the
 * same list stays reachable from the "?" help.
 */
export function FirstDayCard() {
  const statusQuery = useFirstDay();
  const dismiss = useDismissFirstDay();
  const startTour = useTourStore((state) => state.start);

  const status = statusQuery.data;
  if (!status || status.complete || status.dismissedAt) return null;

  return (
    <Card size="sm" data-help="primer-dia">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="bg-brand/10 text-brand ring-brand/15 flex size-8 shrink-0 items-center justify-center rounded-lg ring-1"
          >
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Tu primer día</p>
            <p className="text-muted-foreground truncate text-xs">
              Hacé cada cosa una vez. «Mostrame» te lleva.
            </p>
          </div>
          <span className="shrink-0 text-sm font-medium tabular-nums">
            {status.doneCount} de {status.total}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Cerrar «Tu primer día»"
            title="Cerrar (sigue en la ayuda «?»)"
            onClick={() => dismiss.mutate()}
            disabled={dismiss.isPending}
            className="text-muted-foreground -mr-1"
          >
            <X />
          </Button>
        </div>
        <FirstDayProgress status={status} />
        <FirstDayList status={status} onShow={startTour} />
      </CardContent>
    </Card>
  );
}
