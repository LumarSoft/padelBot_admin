"use client";

import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, CircleDashed, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SETUP_STEPS } from "@/features/setup/lib/steps";
import { useSetupStatus } from "@/features/setup/hooks/use-setup";

/**
 * "Puesta a punto": the panel's entry point into the `/setup` wizard. It only reports —
 * the configuring happens in the wizard (or in Configuración). State comes from a single
 * aggregated query, derived from the club's real data.
 */
export function SetupChecklist({
  clubName,
  /** On the overview we only want this while the setup is still worth showing. */
  hideWhenComplete = false,
}: {
  clubName?: string;
  hideWhenComplete?: boolean;
}) {
  const statusQuery = useSetupStatus();

  if (statusQuery.isLoading) {
    return (
      <Card>
        <CardContent className="text-muted-foreground flex items-center gap-2 py-1 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Revisando la puesta a punto…
        </CardContent>
      </Card>
    );
  }

  const status = statusQuery.data;
  if (!status) return null;

  const doneCount = status.steps.filter((step) => step.done).length;
  const allDone = doneCount === status.steps.length;
  const complete = allDone || !!status.setupCompletedAt;

  // Once the owner has finished the wizard, stop nagging them on the overview — the
  // remaining optional steps live in Configuración and don't need a permanent banner.
  if (hideWhenComplete && complete) return null;

  // In Configuración the card stays, but a finished setup is not a to-do list any more:
  // a checklist of seven ticks is noise the owner has to scan past every time. One line
  // that says everything is in order, and the real settings right below it.
  if (complete) {
    return (
      <Card className="border-emerald-500/40 bg-emerald-500/[0.06]">
        <CardContent className="flex items-center gap-3 py-1">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-500" />
          <div className="min-w-0">
            <p className="font-medium text-emerald-700 dark:text-emerald-400">
              Cuenta configurada completamente de forma correcta
            </p>
            <p className="text-muted-foreground mt-0.5 text-sm text-pretty">
              {clubName ?? "Tu complejo"} está listo: el bot toma reservas y cobra las señas.
              Podés ajustar lo que quieras desde acá abajo.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-medium">Puesta a punto</p>
            <p className="text-muted-foreground mt-1 text-sm text-pretty">
              {status.ready
                ? `${clubName ?? "Tu complejo"} ya puede recibir reservas. Completá lo que falta cuando quieras.`
                : "Completá estos pasos para que el bot empiece a tomar reservas."}
            </p>
          </div>
          <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
            {doneCount}/{status.steps.length}
          </span>
        </div>

        <div className="bg-foreground/[0.06] h-1.5 w-full overflow-hidden rounded-full dark:bg-white/[0.07]">
          <div
            className="bg-brand animate-grow-x ease-fluid h-full origin-left rounded-full transition-[width] duration-700"
            style={{ width: `${(doneCount / status.steps.length) * 100}%` }}
          />
        </div>

        <ul className="flex flex-col gap-1.5">
          {SETUP_STEPS.map((step) => {
            const state = status.steps.find((s) => s.id === step.id);
            const isDone = state?.done ?? false;
            return (
              <li key={step.id} className="flex items-center gap-2.5 text-sm">
                {isDone ? (
                  <Check className="animate-scale-in size-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
                ) : (
                  <CircleDashed className="text-muted-foreground size-4 shrink-0" />
                )}
                <span
                  className={cn("min-w-0 flex-1 truncate", isDone && "text-muted-foreground")}
                >
                  {step.title}
                </span>
                {step.optional && !isDone && (
                  <span className="text-muted-foreground shrink-0 text-[10px]">opcional</span>
                )}
              </li>
            );
          })}
        </ul>

        <div>
          <Link href="/setup" className={buttonVariants({ variant: "brand", size: "lg" })}>
            {doneCount === 0 ? "Empezar la puesta a punto" : "Continuar la puesta a punto"}
            <ArrowRight />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
