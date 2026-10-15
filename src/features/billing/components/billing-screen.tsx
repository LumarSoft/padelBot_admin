"use client";

import { CreditCard, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { cn } from "@/lib/utils";
import { lumarsoftWhatsApp } from "@/lib/contact";
import { formatCount, monthName } from "@/features/plan/lib/format";
import { useBilling } from "@/features/billing/hooks/use-billing";
import { usePlan } from "@/features/plan/hooks/use-plan";
import { creditsNoticeText } from "@/features/plan/components/ai-credits-banner";
import type { BillingOverview } from "@/types/api/billing";

const STATUS_LABEL: Record<BillingOverview["subscription"]["status"], string> = {
  ACTIVE: "Activa",
  TRIAL: "Prueba gratis",
  PAST_DUE: "Vencida",
  CANCELLED: "Inactiva",
};

/** "2026-11-10T…" → "10 de noviembre" (with the year when it isn't this one). */
function longDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    ...(date.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
  });
}

/** Facturación: the plan the club is on, this month's credits, and where to ask for help. */
export function BillingScreen() {
  const { data, isLoading } = useBilling();

  if (isLoading || !data) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <SubscriptionCard data={data} />
        <CreditsCard data={data} />
      </div>

      <Card size="sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">¿Necesitás ayuda?</p>
            <p className="text-muted-foreground text-xs">
              Con tu plan o tus créditos: escribinos y lo resolvemos.
            </p>
          </div>
          <WhatsAppLink href={lumarsoftWhatsApp("help")}>WhatsApp</WhatsAppLink>
        </CardContent>
      </Card>
    </div>
  );
}

function SubscriptionCard({ data }: { data: BillingOverview }) {
  const { subscription } = data;
  const renewsAt = subscription.renewsAt;
  const past = renewsAt !== null && new Date(renewsAt) < new Date();
  const when =
    renewsAt === null
      ? null
      : subscription.status === "TRIAL"
        ? `${past ? "La prueba terminó el" : "La prueba termina el"} ${longDate(renewsAt)}`
        : `${past ? "Venció el" : "Renueva el"} ${longDate(renewsAt)}`;

  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex items-center gap-2">
          <CreditCard className="text-brand size-4" />
          <h2 className="text-sm font-medium">Tu suscripción</h2>
        </div>
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="font-heading text-2xl font-semibold">Plan {data.plan.name}</p>
          <Badge variant={subscription.severity === "ok" || subscription.severity === "trial" ? "secondary" : "destructive"}>
            {STATUS_LABEL[subscription.status]}
          </Badge>
        </div>
        {when && <p className="text-muted-foreground text-sm">{when}</p>}
        <a
          href={lumarsoftWhatsApp("upgrade")}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "mt-auto self-start")}
        >
          Cambiar plan
        </a>
      </CardContent>
    </Card>
  );
}

function CreditsCard({ data }: { data: BillingOverview }) {
  const { credits } = data;
  // The banner can be closed; here the warning is always in sight.
  const plan = usePlan().data;
  const level = plan?.creditsNotice.level ?? null;
  const total = credits.included;
  const share = total ? Math.min(100, (credits.used / total) * 100) : 0;
  const over = total !== null && credits.used >= total;

  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-brand size-4" />
          <h2 className="text-sm font-medium">Créditos de IA de {monthName(credits.month)}</h2>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-heading text-2xl font-semibold tabular-nums">
            {formatCount(credits.used)}
            {total !== null && (
              <span className="text-muted-foreground text-base font-normal"> / {formatCount(total)}</span>
            )}
          </p>
          {total !== null && (
            <div aria-hidden className="bg-muted h-1.5 overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full rounded-full",
                  over ? "bg-red-500" : share >= 80 ? "bg-amber-500" : "bg-brand",
                )}
                style={{ width: `${share}%` }}
              />
            </div>
          )}
          <p className="text-muted-foreground text-xs text-pretty">
            Cada mensaje que el bot manda por WhatsApp usa un crédito. Se renuevan el 1° de cada mes.
          </p>
        </div>
        {plan && level && (
          <p
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              level === 100
                ? "bg-red-500/10 text-red-900 dark:text-red-200"
                : "bg-amber-500/15 text-amber-900 dark:text-amber-200",
            )}
          >
            {creditsNoticeText(plan.aiCredits, level)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
