"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { waLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { stepMeta } from "@/features/setup/lib/steps";
import { useCompleteSetup, useWhatsAppLines } from "@/features/setup/hooks/use-setup";
import type { SetupStatus, SetupStepId } from "@/types/api/onboarding";

/**
 * The close. Two jobs: tell the owner the truth about what's still missing (a wizard that
 * says "¡listo!" over a club that can't take a booking would destroy trust on day one), and
 * hand them the one action that makes it real — texting their own bot.
 */
export function FinishScreen({
  clubName,
  status,
  onGoToStep,
}: {
  clubName: string;
  status: SetupStatus;
  onGoToStep: (step: SetupStepId) => void;
}) {
  const router = useRouter();
  const completeSetup = useCompleteSetup();
  const linesQuery = useWhatsAppLines();

  const activeLine = (linesQuery.data ?? []).find((line) => line.isActive);
  const pending = status.steps.filter((step) => !step.done);
  const pendingRequired = pending.filter((step) => step.required);

  function finish(): void {
    completeSetup.mutate(undefined, {
      onSuccess: () => router.push("/panel"),
    });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 py-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <span
          className={cn(
            "animate-scale-in flex size-16 items-center justify-center rounded-full",
            status.ready
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-500"
              : "bg-amber-500/15 text-amber-600 dark:text-amber-500",
          )}
        >
          {status.ready ? (
            <Check className="size-8" strokeWidth={2.5} />
          ) : (
            <AlertCircle className="size-8" />
          )}
        </span>

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {status.ready
              ? `${clubName} está listo`
              : "Casi listo — te falta poco"}
          </h1>
          <p className="text-muted-foreground text-lg text-pretty">
            {status.ready
              ? "El bot ya puede atender jugadores, reservar canchas y cobrar la seña solo."
              : "El bot todavía no puede tomar una reserva de punta a punta. Te falta esto:"}
          </p>
        </div>
      </div>

      {/* What's missing, said plainly and with a way back to fix it. */}
      {pendingRequired.length > 0 && (
        <div className="flex w-full flex-col gap-2">
          {pendingRequired.map((step) => {
            const meta = stepMeta(step.id);
            const Icon = meta.icon;
            return (
              <Card key={step.id} className="border-amber-500/30 bg-amber-500/[0.06]">
                <CardContent className="flex items-center gap-3">
                  <Icon className="size-4 shrink-0 text-amber-600 dark:text-amber-500" />
                  <span className="min-w-0 flex-1 text-sm">{meta.title}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onGoToStep(step.id)}
                  >
                    Completar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* The moment that makes it real: the owner texts their own bot and watches it answer. */}
      {status.ready && activeLine && (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center gap-4 py-2 text-center">
            <div>
              <p className="font-medium">Probalo ahora mismo</p>
              <p className="text-muted-foreground mt-1 text-sm text-pretty">
                Escribile “hola” a {activeLine.displayPhone} desde tu teléfono. Te contesta en
                segundos — y la conversación te va a aparecer sola en el panel.
              </p>
            </div>
            <WhatsAppLink href={waLink(activeLine.displayPhone, "Hola")} className="px-4 py-2.5">
              Escribirle al bot
            </WhatsAppLink>
          </CardContent>
        </Card>
      )}

      <div className="flex w-full flex-col items-center gap-3">
        <Button
          type="button"
          variant="brand"
          size="lg"
          onClick={finish}
          disabled={completeSetup.isPending}
        >
          {completeSetup.isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Guardando…
            </>
          ) : (
            <>
              Ir al panel
              <ArrowRight />
            </>
          )}
        </Button>
        <p className="text-muted-foreground max-w-md text-center text-xs text-pretty">
          {pending.length > 0
            ? `Lo que quedó pendiente (${pending
                .map((step) => stepMeta(step.id).label.toLowerCase())
                .join(", ")}) lo podés completar cuando quieras desde Configuración.`
            : "Cargaste todo. Cualquier cosa se cambia desde Configuración."}
        </p>
      </div>

      {/* A quiet recap so they leave knowing exactly what the bot will do. */}
      <div className="border-border/60 grid w-full grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border/60 sm:grid-cols-4">
        {[
          { label: "Canchas", value: status.counts.courts },
          { label: "Turnos fijos", value: status.counts.recurringBookings },
          { label: "Equipo", value: status.counts.staff + 1 },
          { label: "Kiosco", value: status.counts.products },
        ].map((stat) => (
          <div key={stat.label} className="bg-card flex flex-col items-center gap-0.5 p-4">
            <span className="text-xl font-semibold tabular-nums">{stat.value}</span>
            <span className="text-muted-foreground text-xs">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
