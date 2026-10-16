"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCount } from "@/features/plan/lib/format";
import { signupStepLabel } from "@/features/ops/lib/labels";
import { useSignupFunnel } from "@/features/ops/hooks/use-ops";

const DAYS = 30;

/**
 * Where prospects drop out of `/register`: how many visits reached each screen in the last 30
 * days, and how many were lost from the screen before. Anonymous counts (no cookie, no id), one
 * per screen per page load — a bar that falls off a cliff is the question to rework.
 */
export function SignupFunnelCard() {
  const { data } = useSignupFunnel(DAYS);
  if (!data || data.steps.length === 0) return null;

  const first = data.steps[0]?.visits || 1;
  // The biggest drop between two screens: the one to look at first.
  let worst = -1;
  let worstDrop = 0;
  data.steps.forEach((step, i) => {
    if (i === 0) return;
    const drop = data.steps[i - 1].visits - step.visits;
    if (drop > worstDrop) {
      worstDrop = drop;
      worst = i;
    }
  });

  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-medium">Dónde abandonan el registro</p>
          <p className="text-muted-foreground text-xs">
            Últimos {DAYS} días · {formatCount(data.leads)} solicitudes enviadas
          </p>
        </div>
        <ol className="space-y-1.5">
          {data.steps.map((step, i) => {
            const previous = i > 0 ? data.steps[i - 1].visits : null;
            const lost = previous !== null && previous > 0 ? Math.round(((previous - step.visits) * 100) / previous) : null;
            return (
              <li key={step.step} className="grid grid-cols-[8.5rem_1fr_auto] items-center gap-3 text-sm">
                <span className="truncate">{signupStepLabel(step.step)}</span>
                <span aria-hidden className="bg-muted h-2 overflow-hidden rounded-full">
                  <span
                    className={i === worst ? "block h-full rounded-full bg-amber-500" : "bg-brand block h-full rounded-full"}
                    style={{ width: `${Math.max(2, Math.round((step.visits * 100) / first))}%` }}
                  />
                </span>
                <span className="text-muted-foreground w-28 text-right text-xs tabular-nums">
                  {formatCount(step.visits)}
                  {lost !== null && lost > 0 && (
                    <span className={i === worst ? "font-medium text-amber-600 dark:text-amber-400" : ""}>
                      {" "}
                      · −{lost}%
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
