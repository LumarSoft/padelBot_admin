"use client";

import { Check, Gauge, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { lumarsoftWhatsApp } from "@/lib/contact";
import { SettingsSection } from "@/features/configuracion/components/settings-section";
import { usePlan } from "@/features/plan/hooks/use-plan";
import { formatCount, monthName } from "@/features/plan/lib/format";
import type { PlanFeature, PlanUsage } from "@/types/api/clubs";

/** The landing's names for the modules not every plan includes, in its order. */
const FEATURES: { key: PlanFeature; label: string }[] = [
  { key: "fixedConfirmation", label: "Confirmación de fijos por WhatsApp" },
  { key: "waitlist", label: "Lista de espera" },
  { key: "splitPayment", label: "Cobro dividido entre jugadores" },
  { key: "kioscoStock", label: "Kiosco con control de stock" },
  { key: "scheduledPriceAdjustments", label: "Aumentos de precio programados" },
];

/**
 * "Tu plan": what it includes and how much of it is used — the same three numbers the landing
 * sells (courts, users, AI credits). Nothing here blocks anything; the limits explain
 * themselves where they apply.
 */
export function PlanCard() {
  const { data } = usePlan();
  if (!data) return null;

  return (
    <SettingsSection
      icon={Gauge}
      title={data.plan.known ? `Tu plan: ${data.plan.name}` : "Tu plan"}
      description="Lo que incluye tu plan y cuánto venís usando."
      actions={
        <a
          href={lumarsoftWhatsApp("upgrade")}
          target="_blank"
          rel="noreferrer"
          className="text-brand text-sm font-medium underline-offset-2 hover:underline"
        >
          Cambiar de plan
        </a>
      }
    >
      <div className="grid gap-5 sm:grid-cols-3">
        <Meter label="Canchas" usage={data.courts} />
        <Meter label="Usuarios activos" usage={data.users} />
        <Meter
          label={`Créditos de IA de ${monthName(data.aiCredits.month)}`}
          usage={data.aiCredits}
          hint="Los usa el bot cada vez que entiende un mensaje, escucha un audio o lee un comprobante. Se renuevan el 1° de cada mes."
        />
      </div>

      <ul className="border-border/60 mt-5 grid gap-x-6 gap-y-1.5 border-t pt-4 text-sm sm:grid-cols-2">
        {FEATURES.map(({ key, label }) => {
          const feature = data.features[key];
          return (
            <li key={key} className="flex items-center gap-2">
              {feature.enabled ? (
                <Check className="size-4 shrink-0 text-emerald-600" />
              ) : (
                <Lock className="text-muted-foreground size-4 shrink-0" />
              )}
              <span className={cn(!feature.enabled && "text-muted-foreground")}>
                {label}
                {!feature.enabled && ` · viene con ${feature.plan}`}
              </span>
            </li>
          );
        })}
      </ul>
    </SettingsSection>
  );
}

function Meter({ label, usage, hint }: { label: string; usage: PlanUsage; hint?: string }) {
  const share = usage.limit ? Math.min(100, (usage.used / usage.limit) * 100) : 0;
  const tone =
    usage.limit === null ? "ok" : usage.used >= usage.limit ? "full" : share >= 80 ? "near" : "ok";

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-lg font-semibold tabular-nums">
        {formatCount(usage.used)}
        <span className="text-muted-foreground text-sm font-normal">
          {usage.limit === null ? " · sin límite" : ` de ${formatCount(usage.limit)}`}
        </span>
      </p>
      {usage.limit !== null && (
        <div aria-hidden className="bg-muted h-1.5 overflow-hidden rounded-full">
          <div
            className={cn(
              "h-full rounded-full",
              tone === "ok" && "bg-brand",
              tone === "near" && "bg-amber-500",
              tone === "full" && "bg-red-500",
            )}
            style={{ width: `${share}%` }}
          />
        </div>
      )}
      {hint && <p className="text-muted-foreground text-xs text-pretty">{hint}</p>}
    </div>
  );
}
