"use client";

import { usePathname } from "next/navigation";
import { CircleHelp, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getHelpEntry, type HelpEntryId } from "@/features/help/content/faq";
import { getTour } from "@/features/help/content/tours";
import { useTourStore } from "@/features/help/stores/tour-store";

/**
 * The "¿por qué?" next to a status label (Esperando pago, Liberado, Seña total…): a small "?"
 * that opens why it reads like that and what to do — the same lines as its question in the
 * "?" help (content/faq.ts), never a copy of them. "Mostrame" only when the guide runs on
 * another screen: on this one, the answer already sits next to the thing.
 *
 * Clicks don't bubble out of it, so it can live inside a clickable row or a popover.
 */
export function StatusWhy({ entry, className }: { entry: HelpEntryId; className?: string }) {
  const item = getHelpEntry(entry);
  const pathname = usePathname();
  const startTour = useTourStore((state) => state.start);
  const tourRoute = item.tour ? getTour(item.tour).route?.split("?")[0] : undefined;
  const showTour = item.tour && tourRoute && tourRoute !== pathname;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={`¿Por qué? ${item.question}`}
            title="¿Por qué?"
            onClick={(event) => event.stopPropagation()}
            className={cn(
              "text-muted-foreground/70 hover:text-brand focus-visible:ring-ring/50 inline-flex size-4 shrink-0 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2",
              className,
            )}
          />
        }
      >
        <CircleHelp className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-64 p-3">
        <div className="flex flex-col gap-2" onClick={(event) => event.stopPropagation()}>
          <p className="text-muted-foreground text-[11px] font-medium">¿Por qué?</p>
          <ul className="flex flex-col gap-1 text-xs">
            {item.answer.map((line) => (
              <li key={line} className="text-foreground/90 text-pretty">
                {line}
              </li>
            ))}
          </ul>
          {showTour && (
            <div>
              <Button type="button" variant="outline" size="xs" onClick={() => startTour(item.tour!)}>
                <Play />
                Mostrame
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
