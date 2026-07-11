"use client";

import Link from "next/link";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Loader2,
  MessageCircle,
  Wallet,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { clubsService } from "@/services/clubs.service";
import { lumarsoftWhatsApp } from "@/lib/contact";
import { Card, CardContent } from "@/components/ui/card";
import { useCourts } from "@/features/turnos/hooks/use-courts";
import {
  useMercadoPagoStatus,
  useTransferConfig,
} from "@/features/configuracion/hooks/use-transfer-config";
import { cn } from "@/lib/utils";

type StepState = "done" | "pending" | "manual";

interface SetupStep {
  key: string;
  icon: typeof Building2;
  title: string;
  description: string;
  state: StepState;
  /** Internal link to complete the step (pending steps). */
  href?: string;
  /** External contact link (manual steps). */
  contactHref?: string;
  cta?: string;
}

interface SetupChecklistProps {
  clubName?: string;
  /** On the overview we only want the checklist while setup is incomplete. */
  hideWhenComplete?: boolean;
}

/**
 * "Puesta a punto": guides a new owner through the steps that leave a club ready
 * to take bookings. State is inferred from existing queries (courts, transfer
 * config, MercadoPago) — see docs/ONBOARDING-Y-CONFIGURACION.md.
 */
export function SetupChecklist({
  clubName,
  hideWhenComplete = false,
}: SetupChecklistProps) {
  const courtsQuery = useCourts();
  const transferQuery = useTransferConfig();
  const mpQuery = useMercadoPagoStatus();
  const linesQuery = useQuery({
    queryKey: queryKeys.clubs.whatsappLines,
    queryFn: clubsService.getWhatsAppLines,
  });

  const isLoading =
    courtsQuery.isLoading ||
    transferQuery.isLoading ||
    mpQuery.isLoading ||
    linesQuery.isLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-muted-foreground flex items-center gap-2 p-5 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Revisando la puesta a punto…
        </CardContent>
      </Card>
    );
  }

  const hasCourts = (courtsQuery.data?.length ?? 0) > 0;
  const hasPayments =
    !!mpQuery.data?.connected || !!transferQuery.data?.transferAlias;
  const hasWhatsApp = (linesQuery.data ?? []).some((line) => line.isActive);
  const linePhone = (linesQuery.data ?? []).find((line) => line.isActive)?.displayPhone;

  const steps: SetupStep[] = [
    {
      key: "club",
      icon: Building2,
      title: "Datos del complejo",
      description: clubName
        ? `${clubName} ya está creado en PadelBot.`
        : "Tu complejo ya está creado en PadelBot.",
      state: "done",
    },
    {
      key: "payments",
      icon: Wallet,
      title: "Configurar cobros",
      description: hasPayments
        ? "Ya podés tomar señas por transferencia."
        : "Conectá MercadoPago o cargá tu alias para que el bot cobre la seña.",
      state: hasPayments ? "done" : "pending",
      href: "/panel/configuracion?tab=pagos",
      cta: "Configurar cobros",
    },
    {
      key: "courts",
      icon: CalendarClock,
      title: "Cargar canchas",
      description: hasCourts
        ? "Tus canchas están cargadas y listas para recibir turnos."
        : "Creá tu primera cancha (preset pádel: 90 min, interior).",
      state: hasCourts ? "done" : "pending",
      href: "/panel/configuracion?tab=canchas",
      cta: "Cargar cancha",
    },
    {
      key: "whatsapp",
      icon: MessageCircle,
      title: "Conectar WhatsApp y probar el bot",
      description: hasWhatsApp
        ? `Tu línea ${linePhone ?? ""} está conectada — mandale "hola" desde tu teléfono para ver al bot en acción.`
        : "Nosotros conectamos el número por vos (no hace falta que toques Meta). Escribinos y en el día queda andando.",
      state: hasWhatsApp ? "done" : "manual",
      contactHref: lumarsoftWhatsApp("whatsapp-setup"),
      cta: "Pedir conexión",
    },
  ];

  const doneCount = steps.filter((s) => s.state === "done").length;
  const allDone = doneCount === steps.length;

  if (hideWhenComplete && allDone) return null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Puesta a punto</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {allDone
                ? "¡Listo! Tu complejo está configurado."
                : "Completá estos pasos para empezar a recibir reservas."}
            </p>
          </div>
          <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
            {doneCount}/{steps.length}
          </span>
        </div>

        <ul className="flex flex-col gap-2">
          {steps.map((step) => (
            <li
              key={step.key}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              {step.state === "done" ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              ) : (
                <CircleDashed className="text-muted-foreground mt-0.5 size-5 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.state === "done" && "text-muted-foreground",
                  )}
                >
                  {step.title}
                </p>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {step.description}
                </p>
              </div>
              {step.state === "pending" && step.href && (
                <Link
                  href={step.href}
                  className="bg-brand text-brand-foreground hover:bg-brand/90 inline-flex shrink-0 items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  {step.cta}
                </Link>
              )}
              {step.state === "manual" && step.contactHref && (
                <a
                  href={step.contactHref}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-brand text-brand-foreground hover:bg-brand/90 inline-flex shrink-0 items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  {step.cta}
                </a>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
