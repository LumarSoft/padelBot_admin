"use client";

import { Check, CircleDashed, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FIRST_DAY_TASKS } from "@/features/help/content/first-day";
import type { TourId } from "@/features/help/content/tours";
import type { FirstDayStatus } from "@/types/api/help";

/** The five tasks, one line each, with a "Mostrame" on the ones still pending. */
export function FirstDayList({
  status,
  onShow,
}: {
  status: FirstDayStatus;
  onShow: (tour: TourId) => void;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {FIRST_DAY_TASKS.map((task) => {
        const done = status.tasks.find((t) => t.id === task.id)?.done ?? false;
        return (
          <li key={task.id} className="flex min-h-8 items-center gap-2.5 text-sm">
            {done ? (
              <Check className="animate-scale-in size-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
            ) : (
              <CircleDashed className="text-muted-foreground size-4 shrink-0" />
            )}
            <span className={cn("min-w-0 flex-1 truncate", done && "text-muted-foreground")}>
              {task.title}
            </span>
            {!done && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => onShow(task.tour)}
                className="text-brand hover:text-brand shrink-0"
              >
                <Play />
                Mostrame
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Thin progress bar shared by the card and the help. */
export function FirstDayProgress({ status }: { status: FirstDayStatus }) {
  return (
    <div className="bg-foreground/[0.06] h-1.5 w-full overflow-hidden rounded-full dark:bg-white/[0.07]">
      <div
        className="bg-brand ease-fluid h-full rounded-full transition-[width] duration-700"
        style={{ width: `${(status.doneCount / status.total) * 100}%` }}
      />
    </div>
  );
}
