"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StepLayout } from "@/features/setup/components/step-layout";
import { StepFooter } from "@/features/setup/components/step-footer";
import { BotPreview, type PreviewBubble } from "@/features/setup/components/bot-preview";
import { useCourts } from "@/features/turnos/hooks/use-courts";
import {
  useConnectMercadoPago,
  useDisconnectMercadoPago,
  useMercadoPagoStatus,
  useTransferConfig,
  useUpdateTransferConfig,
} from "@/features/configuracion/hooks/use-transfer-config";
import type { StepProps } from "@/features/setup/components/setup-wizard";
import type { DepositMode, PaymentVerificationMode } from "@/types/api/clubs";

/**
 * MercadoPago Connect. The owner authorizes with THEIR OWN MercadoPago credentials, so
 * even when we drive the setup sitting beside them, this is the one screen they have to
 * touch. It's also the one they most often can't do on the spot (password not at hand) —
 * hence the step, like every other, can be skipped and finished later.
 */
function MercadoPagoCard() {
  const statusQuery = useMercadoPagoStatus();
  const connect = useConnectMercadoPago("setup");
  const disconnect = useDisconnectMercadoPago();
  const router = useRouter();
  const searchParams = useSearchParams();

  // MercadoPago bounces the browser back to /setup?step=pagos&mp=… after authorizing.
  useEffect(() => {
    const result = searchParams.get("mp");
    if (!result) return;
    if (result === "connected") {
      toast.success("MercadoPago conectado");
      void statusQuery.refetch();
    } else if (result === "error") {
      toast.error("No se pudo conectar MercadoPago. Intentá de nuevo.");
    }
    router.replace("/setup?step=pagos", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const connected = statusQuery.data?.connected ?? false;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">Cuenta de MercadoPago</h2>
          <p className="text-muted-foreground mt-1 text-sm text-pretty">
            Conectala y el bot detecta la transferencia solo: confirma la reserva sin que
            nadie mire el celular. La plata entra directo a la cuenta del club — nosotros no
            la tocamos.
          </p>
        </div>

        {statusQuery.isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-1 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Verificando conexión…
          </div>
        ) : connected ? (
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-500">
              <CheckCircle2 className="animate-scale-in size-4" />
              MercadoPago conectado
            </span>
            <Button
              type="button"
              variant="ghost"
              onClick={() => disconnect.mutate()}
              disabled={disconnect.isPending}
            >
              {disconnect.isPending ? "Desconectando…" : "Desconectar"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div>
              <Button
                type="button"
                variant="brand"
                onClick={() => connect.mutate()}
                disabled={connect.isPending}
              >
                {connect.isPending ? "Redirigiendo…" : "Conectar MercadoPago"}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Te lleva a MercadoPago para que inicies sesión con la cuenta del club y
              autorices. Volvés acá solo.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PagosForm({
  clubName,
  nav,
  initial,
}: Pick<StepProps, "clubName" | "nav"> & {
  initial: {
    alias: string;
    holder: string;
    mode: DepositMode;
    percent: number;
    requireDni: boolean;
    verification: PaymentVerificationMode;
    cancellationHours: number;
  };
}) {
  const updateConfig = useUpdateTransferConfig();
  const courtsQuery = useCourts();

  const [alias, setAlias] = useState(initial.alias);
  const [holder, setHolder] = useState(initial.holder);
  const [mode, setMode] = useState<DepositMode>(initial.mode);
  const [percent, setPercent] = useState(String(initial.percent));
  // Only meaningful in RECEIPT mode; AUTO forces it on (see effectiveRequireDni). We keep
  // the loaded value so switching AUTO→RECEIPT doesn't silently drop it.
  const [requireDni] = useState(initial.requireDni);
  const [verification, setVerification] = useState<PaymentVerificationMode>(
    initial.verification,
  );
  const [cancellationHours, setCancellationHours] = useState(
    String(initial.cancellationHours),
  );

  const percentNumber = Number(percent);
  const percentValid =
    Number.isInteger(percentNumber) && percentNumber >= 1 && percentNumber <= 100;
  const cancellationNumber = Number(cancellationHours);
  const cancellationValid =
    Number.isInteger(cancellationNumber) &&
    cancellationNumber >= 0 &&
    cancellationNumber <= 168;

  const canSave = (mode !== "DEPOSIT" || percentValid) && cancellationValid;

  // Auto-reconciliation matches a transfer to its reservation by the payer's DNI, so it
  // can't confirm on its own without it. The requirement is therefore forced on (not an
  // optional toggle) whenever verification is AUTO.
  const effectiveRequireDni = verification === "AUTO" ? true : requireDni;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!canSave) return;
    updateConfig.mutate(
      {
        transferAlias: alias.trim(),
        transferHolder: holder.trim(),
        depositMode: mode,
        requireDniMatch: effectiveRequireDni,
        paymentVerificationMode: verification,
        cancellationWindowHours: cancellationNumber,
        ...(mode === "DEPOSIT" ? { depositPercent: percentNumber } : {}),
      },
      { onSuccess: () => nav.onNext() },
    );
  }

  // Preview the deposit on a REAL court price, so the owner sees the exact number their
  // players will be asked to transfer — the whole point of configuring this with them.
  const courtPrice = courtsQuery.data?.[0]?.priceCents ?? 2000000;
  const depositCents =
    mode === "FULL"
      ? courtPrice
      : Math.round((courtPrice * (percentValid ? percentNumber : 25)) / 100);

  const aliasLine = alias.trim()
    ? `Transferí ${formatPrice(depositCents)} al alias *${alias.trim()}*${holder.trim() ? ` (${holder.trim()})` : ""}.`
    : `Transferí ${formatPrice(depositCents)}… pero todavía no tengo un alias cargado, así que no puedo decirte a dónde. 😬`;

  const confirmLine =
    verification === "AUTO"
      ? "Apenas la reciba te confirmo la reserva. (Lo detecto solo.)"
      : "Mandame una foto del comprobante y el club te confirma la reserva.";

  const bubbles: PreviewBubble[] = [
    { from: "player", text: "Dale, reservame las 21:00" },
    {
      from: "bot",
      text: `Listo, te reservo las 21:00.\n\n${aliasLine}\n\n${confirmLine}`,
    },
  ];

  return (
    <StepLayout
      id="pagos"
      preview={
        <BotPreview
          clubName={clubName}
          bubbles={bubbles}
          caption={
            mode === "FULL"
              ? "El bot cobra la cancha completa por adelantado."
              : `El bot pide el ${percentValid ? percentNumber : 25}% del precio real de tu cancha.`
          }
        />
      }
      footer={
        <StepFooter
          nav={nav}
          primary={
            <Button
              type="submit"
              form="setup-pagos"
              variant="brand"
              size="lg"
              disabled={!canSave || updateConfig.isPending}
            >
              {updateConfig.isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Guardando…
                </>
              ) : (
                "Guardar y continuar"
              )}
            </Button>
          }
        />
      }
    >
      <MercadoPagoCard />

      <form id="setup-pagos" onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="setup-alias">Alias o CVU</Label>
            <Input
              id="setup-alias"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="padel.centro.mp"
              maxLength={120}
              disabled={updateConfig.isPending}
            />
            <p className="text-muted-foreground text-xs">
              Es lo que el bot le dicta al jugador para que transfiera.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="setup-holder">Titular de la cuenta</Label>
            <Input
              id="setup-holder"
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              placeholder="Pádel Center S.R.L."
              maxLength={120}
              disabled={updateConfig.isPending}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>¿Qué cobra el bot para confirmar?</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(
              [
                { value: "DEPOSIT", label: "Una seña", hint: "Parte del precio del turno." },
                { value: "FULL", label: "La cancha completa", hint: "El 100% por adelantado." },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMode(option.value)}
                disabled={updateConfig.isPending}
                className={cn(
                  "ease-fluid rounded-xl border px-3 py-2.5 text-left transition-all duration-200",
                  mode === option.value
                    ? "border-brand bg-brand/10"
                    : "border-border hover:bg-card",
                )}
              >
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="text-muted-foreground block text-xs">{option.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {mode === "DEPOSIT" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="setup-percent">Seña (% del precio)</Label>
            <Input
              id="setup-percent"
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              disabled={updateConfig.isPending}
              className="max-w-24"
            />
            <p className="text-muted-foreground text-xs">
              25% es lo habitual: la parte de 1 de los 4 jugadores. Sobre tu cancha de{" "}
              {formatPrice(courtPrice)} son {formatPrice(depositCents)}.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t pt-5">
          <Label>¿Cómo se confirma el pago?</Label>
          <div className="flex flex-col gap-2">
            {(
              [
                {
                  value: "AUTO",
                  label: "Automático con MercadoPago",
                  hint: "El bot detecta la transferencia y confirma solo, sin que nadie haga nada. Necesita la cuenta conectada.",
                },
                {
                  value: "RECEIPT",
                  label: "El jugador manda el comprobante y ustedes confirman",
                  hint: "El bot pide una foto. Les llega al panel y confirman a mano. Sirve si no quieren conectar MercadoPago.",
                },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setVerification(option.value)}
                disabled={updateConfig.isPending}
                className={cn(
                  "ease-fluid rounded-xl border px-3 py-2.5 text-left transition-all duration-200",
                  verification === option.value
                    ? "border-brand bg-brand/10"
                    : "border-border hover:bg-card",
                )}
              >
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="text-muted-foreground block text-xs text-pretty">
                  {option.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        {verification === "AUTO" && (
          <div className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked
              readOnly
              disabled
              aria-label="Exigir el DNI del que transfiere (obligatorio con cobro automático)"
              className="mt-0.5 accent-[var(--brand)]"
            />
            <span>
              <span className="font-medium">Exige el DNI del que transfiere</span>
              <span className="text-muted-foreground block text-xs text-pretty">
                Obligatorio con el cobro automático: el bot necesita el DNI para reconocer la
                transferencia y confirmar solo. Lo pide al reservar y confirma cuando quien
                transfirió es esa misma persona; si no coincide, va a revisión manual.
              </span>
            </span>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t pt-5">
          <Label htmlFor="setup-cancellation">Política de cancelación</Label>
          <div className="flex items-center gap-2">
            <Input
              id="setup-cancellation"
              type="number"
              inputMode="numeric"
              min={0}
              max={168}
              value={cancellationHours}
              onChange={(e) => setCancellationHours(e.target.value)}
              disabled={updateConfig.isPending}
              className="max-w-24"
            />
            <span className="text-muted-foreground text-sm">horas de aviso</span>
          </div>
          <p className="text-muted-foreground text-xs text-pretty">
            Si cancelan con {cancellationValid ? cancellationNumber : "N"} h o más de
            anticipación, la seña les queda como crédito para la próxima reserva. Con menos
            aviso, se pierde. 0 = siempre queda a favor.
          </p>
        </div>
      </form>
    </StepLayout>
  );
}

export function PagosStep({ clubName, nav }: StepProps) {
  const configQuery = useTransferConfig();

  if (configQuery.isLoading || !configQuery.data) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-16 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando la configuración de cobros…
      </div>
    );
  }

  const config = configQuery.data;

  return (
    <PagosForm
      clubName={clubName}
      nav={nav}
      initial={{
        alias: config.transferAlias ?? "",
        holder: config.transferHolder ?? "",
        mode: config.depositMode,
        percent: config.depositPercent,
        requireDni: config.requireDniMatch,
        verification: config.paymentVerificationMode,
        cancellationHours: config.cancellationWindowHours,
      }}
    />
  );
}
