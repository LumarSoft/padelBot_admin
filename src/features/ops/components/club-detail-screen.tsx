"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { isPlanKey, planName } from "@/lib/plans";
import { formatCount, monthName } from "@/features/plan/lib/format";
import { answerLabel, CLUB_HEALTH, SUBSCRIPTION_LABELS, timeAgo } from "@/features/ops/lib/labels";
import { useClubDetail, useUpdateClubNotes } from "@/features/ops/hooks/use-ops";
import { SubscriptionDialog } from "@/features/ops/components/subscription-dialog";
import { ClubPasswordDialog } from "@/features/ops/components/club-password-dialog";
import type { ClubMonth, OpsClubDetail } from "@/types/api/ops";

const pesos = (cents: number) => formatPrice(Math.round(cents / 100) * 100);

/** "10 de noviembre de 2026". */
function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * The ficha of one club: where it stands (plan, dates, state and why), month by month (credits,
 * bot vs panel bookings, margin), where it came from, and our own notes on it.
 */
export function ClubDetailScreen({ clubId }: { clubId: string }) {
  const { data, isLoading, isError } = useClubDetail(clubId);
  const [editing, setEditing] = useState(false);
  const [managingPw, setManagingPw] = useState(false);

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando la ficha…
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="space-y-3">
        <BackLink />
        <p className="text-sm">No encontramos este club.</p>
      </div>
    );
  }

  const { club } = data;
  const { subscription, plan, health } = club;

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold">{club.name}</h1>
            {club.isDemo ? (
              <Badge variant="outline">Demo</Badge>
            ) : (
              <Badge className={CLUB_HEALTH[health.status].className}>{CLUB_HEALTH[health.status].label}</Badge>
            )}
          </div>
          {!club.isDemo && health.reasons.length > 0 && <p className="text-sm">{health.reasons.join(" · ")}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => setManagingPw(true)}>
            Contraseñas
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Suscripción
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card size="sm">
          <CardContent className="space-y-1.5">
            <p className="text-muted-foreground text-xs">Plan y suscripción</p>
            <p className="font-medium">
              {isPlanKey(subscription.plan) ? planName(subscription.plan) : `Plan “${subscription.plan}”`}
              {plan.grandfatheredFeatures && " · todas las funciones"}
            </p>
            <p className="text-sm">
              {SUBSCRIPTION_LABELS[subscription.subscriptionStatus]}
              {subscription.subscriptionStatus === "TRIAL" && subscription.trialEndsAt
                ? ` · la prueba termina el ${longDate(subscription.trialEndsAt)}`
                : subscription.currentPeriodEnd && subscription.subscriptionStatus !== "CANCELLED"
                  ? ` · ${new Date(subscription.currentPeriodEnd) < new Date() ? "venció" : "renueva"} el ${longDate(subscription.currentPeriodEnd)}`
                  : ""}
            </p>
            <p className="text-muted-foreground text-xs">Cliente desde el {longDate(club.createdAt)}</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardContent className="space-y-1.5">
            <p className="text-muted-foreground text-xs">Este mes</p>
            <p className="font-medium tabular-nums">
              {formatCount(plan.aiCredits.used)}
              {plan.aiCredits.limit !== null && ` / ${formatCount(plan.aiCredits.limit)}`} créditos
              {plan.aiCredits.paused && <span className="text-red-600 dark:text-red-400"> · bot pausado</span>}
            </p>
            <p className="text-sm">
              {club.activity.bookingsBot} reservas del bot y {club.activity.bookingsPanel} desde el panel (30 días)
            </p>
            <p className="text-muted-foreground text-xs">
              Último ingreso al panel {timeAgo(club.activity.lastPanelLoginAt)}
            </p>
          </CardContent>
        </Card>

        <OriginCard lead={data.lead} />
      </div>

      <MonthsTable months={data.months} />

      <NotesCard clubId={club.id} notes={data.opsNotes} />

      {editing && <SubscriptionDialog club={club} open onOpenChange={setEditing} />}
      {managingPw && <ClubPasswordDialog club={club} open onOpenChange={setManagingPw} />}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/ops/clubes"
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
    >
      <ArrowLeft className="size-4" />
      Clubes
    </Link>
  );
}

function OriginCard({ lead }: { lead: OpsClubDetail["lead"] }) {
  return (
    <Card size="sm">
      <CardContent className="space-y-1.5">
        <p className="text-muted-foreground text-xs">De dónde vino</p>
        {lead ? (
          <>
            <p className="text-sm">
              Pidió el club el {longDate(lead.createdAt)}
              {lead.contactedAt && `, lo contactamos ${timeAgo(lead.contactedAt)}`}
            </p>
            {(lead.howFound || lead.campaign) && (
              <p className="text-sm">
                {[answerLabel(lead.howFound), lead.campaign && `campaña ${lead.campaign}`].filter(Boolean).join(" · ")}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-muted-foreground text-xs">
                {lead.ownerName} · {lead.email}
              </span>
              <WhatsAppLink href={waLink(lead.phone)} className="h-7 px-2.5 text-[0.8rem] [&_svg]:size-3.5">
                WhatsApp
              </WhatsAppLink>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">Lo dimos de alta sin pasar por el formulario.</p>
        )}
      </CardContent>
    </Card>
  );
}

function MonthsTable({ months }: { months: ClubMonth[] }) {
  return (
    <Card size="sm">
      <CardContent className="space-y-3 px-0">
        <p className="px-4 text-sm font-medium">Mes a mes</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Mes</TableHead>
              <TableHead className="text-right">Créditos</TableHead>
              <TableHead className="text-right">Reservas bot / panel</TableHead>
              <TableHead className="text-right">Ingreso</TableHead>
              <TableHead className="text-right">Costo</TableHead>
              <TableHead className="pr-4 text-right">Margen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...months].reverse().map((month) => {
              const over = month.credits.included !== null && month.credits.used >= month.credits.included;
              return (
                <TableRow key={month.month}>
                  <TableCell className="pl-4 capitalize">{monthName(month.month)}</TableCell>
                  <TableCell className={cn("text-right tabular-nums", over && "text-red-600 dark:text-red-400")}>
                    {formatCount(month.credits.used)}
                    {month.credits.included !== null && ` / ${formatCount(month.credits.included)}`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {month.bookings.bot} / {month.bookings.panel}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{pesos(month.revenueCents)}</TableCell>
                  <TableCell className="text-right tabular-nums">{pesos(month.costCents)}</TableCell>
                  <TableCell
                    className={cn(
                      "pr-4 text-right font-medium tabular-nums",
                      month.marginCents < 0 && "text-red-600 dark:text-red-400",
                    )}
                  >
                    {pesos(month.marginCents)}
                    {month.marginPercent !== null && (
                      <span className="text-muted-foreground font-normal"> · {month.marginPercent}%</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <p className="text-muted-foreground px-4 text-xs text-pretty">
          El ingreso de cada mes usa el plan y el estado de hoy (la facturación es manual); el costo es
          Meta más la IA, como en Rentabilidad.
        </p>
      </CardContent>
    </Card>
  );
}

/** Our notes on the club — never shown to it. */
function NotesCard({ clubId, notes }: { clubId: string; notes: string | null }) {
  const [draft, setDraft] = useState(notes ?? "");
  const save = useUpdateClubNotes(clubId);
  const dirty = draft !== (notes ?? "");

  return (
    <Card size="sm">
      <CardContent className="space-y-2">
        <p className="text-sm font-medium">Notas</p>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Qué acordamos, con quién hablar, qué pasó…"
          rows={4}
          maxLength={8000}
          className="border-border/60 bg-card/50 focus-visible:ring-ring/50 w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
        />
        {dirty && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => save.mutate(draft.trim() || null)} disabled={save.isPending}>
              {save.isPending ? "Guardando…" : "Guardar notas"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDraft(notes ?? "")} disabled={save.isPending}>
              Descartar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
