"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { planName } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { formatPrice } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import {
  answerLabel,
  campaignLabel,
  hoursSince,
  LEAD_STATUS_LABELS,
  LOST_REASON_LABELS,
  timeAgo,
} from "@/features/ops/lib/labels";
import { useDeleteLead, useUpdateLead } from "@/features/ops/hooks/use-ops";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ProvisionDialog } from "@/features/ops/components/provision-dialog";
import { LeadNotes } from "@/features/ops/components/lead-notes";
import { LeadFollowUp } from "@/features/ops/components/lead-follow-up";
import type { Lead, LeadStatus, LostReason } from "@/types/api/ops";

const LOST_REASONS = Object.keys(LOST_REASON_LABELS).filter(
  (reason) => reason !== "UNKNOWN",
) as LostReason[];

const STATUS_VARIANT: Record<LeadStatus, "default" | "secondary" | "outline"> = {
  NEW: "default",
  CONTACTED: "secondary",
  CONVERTED: "outline",
  LOST: "outline",
};

/** "3 canchas techadas · turnos de 90 min · 9:00–23:00 · ~$20.000" */
function complexSummary(lead: Lead): string[] {
  const parts: string[] = [];
  if (lead.courtCount) {
    const type = answerLabel(lead.courtType);
    parts.push(
      `${lead.courtCount} cancha${lead.courtCount === 1 ? "" : "s"}${type ? ` ${type.toLowerCase()}` : ""}`,
    );
  }
  if (lead.slotDurationMinutes) parts.push(`turnos de ${lead.slotDurationMinutes} min`);
  if (lead.openTime && lead.closeTime) parts.push(`${lead.openTime}–${lead.closeTime}`);
  if (lead.avgPriceCents) parts.push(`~${formatPrice(lead.avgPriceCents)} el turno`);
  return parts;
}

interface LeadCardProps {
  lead: Lead;
}

/**
 * The whole signup, as a briefing you can read before picking up the phone: who they are,
 * how to reach them, how the complex works, whether MercadoPago will be a fight, and what
 * they said hurts. Anything they skipped is simply left out rather than shown as "—".
 */
export function LeadCard({ lead }: LeadCardProps) {
  const [provisionOpen, setProvisionOpen] = useState(false);
  // Marking a lead lost asks why first: the pattern is what tells us what to fix.
  const [choosingLostReason, setChoosingLostReason] = useState(false);
  const updateLead = useUpdateLead();

  const complex = complexSummary(lead);
  const deposit = answerLabel(lead.chargesDeposit);
  const mercadopago = answerLabel(lead.hasMercadoPago);
  const system = answerLabel(lead.currentSystem);
  const pain = answerLabel(lead.biggestPain);
  const fixed = answerLabel(lead.fixedSlots);
  const found = answerLabel(lead.howFound);
  const campaign = campaignLabel(lead);
  const open = lead.status === "NEW" || lead.status === "CONTACTED";
  const when = lead.contactWindowNote?.trim() || answerLabel(lead.contactWindow);

  function setStatus(status: LeadStatus): void {
    updateLead.mutate({ id: lead.id, payload: { status } });
  }

  function markLost(lostReason: LostReason): void {
    setChoosingLostReason(false);
    updateLead.mutate({ id: lead.id, payload: { status: "LOST", lostReason } });
  }

  const deleteLead = useDeleteLead();
  const confirm = useConfirm();
  async function handleDelete(): Promise<void> {
    const ok = await confirm({
      title: `¿Eliminar la solicitud de ${lead.clubName}?`,
      description: "Se borra para siempre, con sus respuestas y tus notas.",
      confirmLabel: "Eliminar",
      cancelLabel: "No, volver",
      tone: "destructive",
    });
    if (ok) deleteLead.mutate(lead.id);
  }

  // A new lead stands out until someone calls; a day without a call turns it into a warning.
  const isNew = lead.status === "NEW";
  const waitingHours = isNew ? hoursSince(lead.createdAt) : 0;

  return (
    <Card className={cn(isNew && "ring-brand/50 bg-brand/[0.03] ring-1")}>
      <CardContent className="space-y-4">
        {/* Who, and how to reach them. */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-base font-semibold">
                {lead.clubName}
              </h3>
              {lead.city && (
                <span className="text-muted-foreground text-sm">
                  {lead.city}
                </span>
              )}
              {isNew ? (
                <Badge className="bg-brand text-white">Nueva</Badge>
              ) : (
                <Badge variant={STATUS_VARIANT[lead.status]}>
                  {LEAD_STATUS_LABELS[lead.status]}
                </Badge>
              )}
              {lead.plan && (
                <Badge variant="outline">Eligió {planName(lead.plan)}</Badge>
              )}
              {lead.status === "LOST" && (
                <Badge variant="outline">{LOST_REASON_LABELS[lead.lostReason ?? "UNKNOWN"]}</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {lead.ownerName} · {lead.email}
            </p>
            <p
              className={cn(
                "text-xs",
                waitingHours >= 24
                  ? "font-medium text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground",
              )}
            >
              Entró {timeAgo(lead.createdAt)}
              {waitingHours >= 24 && " · todavía sin contactar"}
              {lead.contactedAt && ` · contactado ${timeAgo(lead.contactedAt)}`}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {/* The repo's one "escribile por WhatsApp" component — a real <a>, not a Button
                rendering one: Base UI's Button is a native <button> and swapping the element
                under it strips the button semantics. */}
            <WhatsAppLink
              href={waLink(lead.phone)}
              className="h-7 px-2.5 text-[0.8rem] [&_svg]:size-3.5"
            >
              WhatsApp
            </WhatsAppLink>
            {lead.status !== "CONVERTED" && (
              <Button size="sm" onClick={() => setProvisionOpen(true)}>
                Confirmar solicitud
              </Button>
            )}
          </div>
        </div>

        {/* When they asked to be called — the single most actionable line here. */}
        {when && (
          <p className="text-sm">
            <span className="text-muted-foreground">Prefiere que lo llamen: </span>
            <span className="font-medium">{when}</span>
          </p>
        )}

        {/* The complex, i.e. what the /setup wizard will be pre-loaded with. */}
        <div className="grid gap-3 sm:grid-cols-2">
          {complex.length > 0 && (
            <Field label="Complejo" value={complex.join(" · ")} />
          )}
          {(deposit || mercadopago) && (
            <Field
              label="Cobros"
              value={[deposit, mercadopago && `MercadoPago propio: ${mercadopago}`]
                .filter(Boolean)
                .join(" · ")}
              /* No MP account = the hardest step of provisioning. Flag it before the call. */
              tone={lead.hasMercadoPago === "NO" ? "warning" : "default"}
            />
          )}
          {(system || pain || fixed) && (
            <Field
              label="Contexto"
              value={[
                system && `hoy usa ${system.toLowerCase()}`,
                pain && `le pesa: ${pain.toLowerCase()}`,
                fixed && `turnos fijos: ${fixed.toLowerCase()}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          )}
          {found && <Field label="Nos conoció por" value={found} />}
          {campaign && <Field label="Campaña" value={campaign} />}
        </div>

        {lead.message && (
          <blockquote className="border-foreground/15 text-muted-foreground border-l-2 pl-3 text-sm italic">
            “{lead.message}”
          </blockquote>
        )}

        {open && <LeadFollowUp lead={lead} />}

        <LeadNotes lead={lead} />

        {/* Pipeline. CONVERTED isn't here: it's set by provisioning, not by hand. */}
        {lead.status !== "CONVERTED" && choosingLostReason && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-muted-foreground text-sm">¿Por qué se perdió?</span>
            {LOST_REASONS.map((reason) => (
              <Button
                key={reason}
                variant="outline"
                size="sm"
                onClick={() => markLost(reason)}
                disabled={updateLead.isPending}
              >
                {LOST_REASON_LABELS[reason]}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setChoosingLostReason(false)}>
              Cancelar
            </Button>
          </div>
        )}
        {lead.status !== "CONVERTED" && !choosingLostReason && (
          <div className="flex flex-wrap gap-2 pt-1">
            {(["NEW", "CONTACTED", "LOST"] as const)
              .filter((status) => status !== lead.status)
              .map((status) => (
                <Button
                  key={status}
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    status === "LOST" ? setChoosingLostReason(true) : setStatus(status)
                  }
                  disabled={updateLead.isPending}
                >
                  Marcar {LEAD_STATUS_LABELS[status].toLowerCase()}
                </Button>
              ))}
            {/* Only a lost lead can go: one we still have to call can't vanish by a slip. */}
            {lead.status === "LOST" && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive ml-auto"
                onClick={() => void handleDelete()}
                disabled={deleteLead.isPending}
              >
                Eliminar
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <ProvisionDialog
        lead={lead}
        open={provisionOpen}
        onOpenChange={setProvisionOpen}
      />
    </Card>
  );
}

function Field({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p
        className={cn(
          "text-sm",
          tone === "warning" && "text-amber-600 dark:text-amber-400",
        )}
      >
        {value}
      </p>
    </div>
  );
}
