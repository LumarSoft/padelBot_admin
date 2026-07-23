"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useConnectMercadoPago,
  useDisconnectMercadoPago,
  useMercadoPagoStatus,
  useTransferConfig,
  useUpdateTransferConfig,
} from "@/features/configuracion/hooks/use-transfer-config";
import type {
  DepositMode,
  PaymentVerificationMode,
  PlayerRescheduleMode,
} from "@/types/api/clubs";

function TransferConfigForm({
  initialAlias,
  initialHolder,
  initialMode,
  initialPercent,
  initialRequireDni,
  initialVerificationMode,
  initialCancellationHours,
  initialReschedule,
  initialRescheduleCutoff,
  initialMaxReschedules,
}: {
  initialAlias: string;
  initialHolder: string;
  initialMode: DepositMode;
  initialPercent: number;
  initialRequireDni: boolean;
  initialVerificationMode: PaymentVerificationMode;
  initialCancellationHours: number;
  initialReschedule: PlayerRescheduleMode;
  initialRescheduleCutoff: number;
  initialMaxReschedules: number;
}) {
  const updateConfig = useUpdateTransferConfig();
  const [alias, setAlias] = useState(initialAlias);
  const [holder, setHolder] = useState(initialHolder);
  const [mode, setMode] = useState<DepositMode>(initialMode);
  const [percent, setPercent] = useState(String(initialPercent));
  // Only meaningful in RECEIPT mode; AUTO forces it on (see effectiveRequireDni). We keep
  // the loaded value so switching AUTO→RECEIPT doesn't silently drop it.
  const [requireDni] = useState(initialRequireDni);
  const [verificationMode, setVerificationMode] =
    useState<PaymentVerificationMode>(initialVerificationMode);
  const [cancellationHours, setCancellationHours] = useState(String(initialCancellationHours));
  const [reschedule, setReschedule] = useState<PlayerRescheduleMode>(initialReschedule);
  const [rescheduleCutoff, setRescheduleCutoff] = useState(String(initialRescheduleCutoff));
  const [maxReschedules, setMaxReschedules] = useState(String(initialMaxReschedules));

  const trimmedAlias = alias.trim();
  const trimmedHolder = holder.trim();
  const percentNumber = Number(percent);
  const percentValid =
    Number.isInteger(percentNumber) && percentNumber >= 1 && percentNumber <= 100;
  const cancellationNumber = Number(cancellationHours);
  const cancellationValid =
    Number.isInteger(cancellationNumber) && cancellationNumber >= 0 && cancellationNumber <= 168;
  const cutoffNumber = Number(rescheduleCutoff);
  const cutoffValid = Number.isInteger(cutoffNumber) && cutoffNumber >= 0 && cutoffNumber <= 168;
  const maxReschedulesNumber = Number(maxReschedules);
  const maxReschedulesValid =
    Number.isInteger(maxReschedulesNumber) && maxReschedulesNumber >= 0 && maxReschedulesNumber <= 10;
  const rescheduleValid = reschedule !== "SELF" || (cutoffValid && maxReschedulesValid);

  // Auto-reconciliation matches a transfer to its reservation by the payer's DNI, so it
  // can't confirm on its own without it. The requirement is forced on whenever AUTO.
  const effectiveRequireDni = verificationMode === "AUTO" ? true : requireDni;

  const unchanged =
    trimmedAlias === initialAlias &&
    trimmedHolder === initialHolder &&
    mode === initialMode &&
    percentNumber === initialPercent &&
    effectiveRequireDni === initialRequireDni &&
    verificationMode === initialVerificationMode &&
    cancellationNumber === initialCancellationHours &&
    reschedule === initialReschedule &&
    cutoffNumber === initialRescheduleCutoff &&
    maxReschedulesNumber === initialMaxReschedules;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (unchanged || (mode === "DEPOSIT" && !percentValid) || !cancellationValid || !rescheduleValid)
      return;
    updateConfig.mutate({
      cancellationWindowHours: cancellationNumber,
      transferAlias: trimmedAlias,
      transferHolder: trimmedHolder,
      depositMode: mode,
      requireDniMatch: effectiveRequireDni,
      paymentVerificationMode: verificationMode,
      playerReschedule: reschedule,
      ...(mode === "DEPOSIT" ? { depositPercent: percentNumber } : {}),
      // Only meaningful in SELF; sending them anyway keeps the club's numbers if they flip back.
      ...(cutoffValid ? { playerRescheduleCutoffHours: cutoffNumber } : {}),
      ...(maxReschedulesValid ? { maxPlayerReschedules: maxReschedulesNumber } : {}),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border p-4 sm:max-w-md">
      <div className="flex flex-col gap-2">
        <Label htmlFor="transfer-alias">Alias / CVU de MercadoPago</Label>
        <Input
          id="transfer-alias"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="padel.club.mp"
          maxLength={120}
          disabled={updateConfig.isPending}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="transfer-holder">Titular de la cuenta</Label>
        <Input
          id="transfer-holder"
          value={holder}
          onChange={(e) => setHolder(e.target.value)}
          placeholder="Padel Club S.R.L."
          maxLength={120}
          disabled={updateConfig.isPending}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>¿Qué cobra el bot para confirmar?</Label>
        <div className="flex flex-col gap-2">
          {(
            [
              { value: "DEPOSIT", label: "Seña (una parte del precio)" },
              { value: "FULL", label: "La cancha completa" },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name="deposit-mode"
                value={option.value}
                checked={mode === option.value}
                onChange={() => setMode(option.value)}
                disabled={updateConfig.isPending}
                className="accent-[var(--brand)]"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {mode === "DEPOSIT" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="deposit-percent">Seña (% del precio del turno)</Label>
          <Input
            id="deposit-percent"
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            step={1}
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            disabled={updateConfig.isPending}
          />
          <p className="text-muted-foreground text-xs">
            Por defecto 25% (la parte de 1 de 4 jugadores).
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t pt-4">
        <Label htmlFor="cancellation-hours">Política de cancelación (horas de aviso)</Label>
        <Input
          id="cancellation-hours"
          type="number"
          inputMode="numeric"
          min={0}
          max={168}
          value={cancellationHours}
          onChange={(e) => setCancellationHours(e.target.value)}
          disabled={updateConfig.isPending}
          className="max-w-28"
        />
        <p className="text-muted-foreground text-xs">
          Cuando cancelás un turno desde la agenda: si faltaban{" "}
          {cancellationValid ? cancellationNumber : "N"} h o más, la seña le queda al jugador como
          crédito a favor para su próxima reserva; con menos aviso, se pierde. 0 = siempre queda a
          favor. (El jugador no puede cancelar por WhatsApp — solo pedir el cambio de horario que
          configurás abajo.)
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t pt-4">
        <div>
          <Label>Si un jugador no puede venir, ¿qué puede hacer desde WhatsApp?</Label>
          <p className="text-muted-foreground mt-1 text-xs">
            El bot <span className="font-medium">nunca cancela</span>: le ofrece <em>mover</em> el
            turno a otro horario. La seña sigue aplicada (no devolvés plata), la cancha que libera
            se le ofrece sola a la lista de espera, y el jugador no pierde nada. Cancelar de verdad
            lo seguís decidiendo vos, desde la agenda.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {(
            [
              {
                value: "SELF",
                label: "Que lo mueva solo",
                hint: "El bot le muestra los horarios libres y lo cambia. Te ahorra el llamado.",
              },
              {
                value: "REQUEST",
                label: "Que me lo pida y yo decido",
                hint: "El bot no mueve nada: te llega un aviso al panel con el pedido y vos resolvés.",
              },
              {
                value: "OFF",
                label: "Nada — que hable con el club",
                hint: "El bot ni lo ofrece y lo deriva a ustedes.",
              },
            ] as const
          ).map((option) => (
            <label key={option.value} className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="radio"
                name="player-reschedule"
                value={option.value}
                checked={reschedule === option.value}
                onChange={() => setReschedule(option.value)}
                disabled={updateConfig.isPending}
                className="mt-0.5 accent-[var(--brand)]"
              />
              <span>
                <span className="font-medium">{option.label}</span>
                <span className="text-muted-foreground block text-xs">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>

        {reschedule === "SELF" && (
          <div className="flex flex-col gap-4 rounded-lg border p-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="reschedule-cutoff">Hasta cuántas horas antes puede moverlo solo</Label>
              <Input
                id="reschedule-cutoff"
                type="number"
                inputMode="numeric"
                min={0}
                max={168}
                value={rescheduleCutoff}
                onChange={(e) => setRescheduleCutoff(e.target.value)}
                disabled={updateConfig.isPending}
                className="max-w-28"
              />
              <p className="text-muted-foreground text-xs">
                Más cerca del turno que eso, el bot no lo mueve: te llega el pedido a vos. Es lo que
                evita que te liberen una cancha cuando ya no llegás a revenderla. 0 = sin límite.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="max-reschedules">Cuántas veces puede mover el mismo turno</Label>
              <Input
                id="max-reschedules"
                type="number"
                inputMode="numeric"
                min={0}
                max={10}
                value={maxReschedules}
                onChange={(e) => setMaxReschedules(e.target.value)}
                disabled={updateConfig.isPending}
                className="max-w-28"
              />
              <p className="text-muted-foreground text-xs">
                Al llegar al tope, el próximo cambio te lo pide a vos. Sin tope, un turno se puede
                patear indefinidamente.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t pt-4">
        <Label>¿Cómo se confirma el pago?</Label>
        <div className="flex flex-col gap-2">
          {(
            [
              {
                value: "AUTO",
                label: "Automático con MercadoPago",
                hint: "El bot detecta la transferencia y confirma la reserva solo, sin que hagas nada.",
              },
              {
                value: "RECEIPT",
                label: "El cliente envía el comprobante y yo confirmo",
                hint: "El bot le pide una foto del comprobante. Te llega al panel (con sonido) y vos confirmás o rechazás.",
              },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-2 text-sm"
            >
              <input
                type="radio"
                name="verification-mode"
                value={option.value}
                checked={verificationMode === option.value}
                onChange={() => setVerificationMode(option.value)}
                disabled={updateConfig.isPending}
                className="mt-0.5 accent-[var(--brand)]"
              />
              <span>
                <span className="font-medium">{option.label}</span>
                <span className="text-muted-foreground block text-xs">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {verificationMode === "AUTO" && (
        <div className="flex flex-col gap-2 border-t pt-4">
          <div className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked
              readOnly
              disabled
              aria-label="Exigir DNI del titular (obligatorio con cobro automático)"
              className="mt-0.5 accent-[var(--brand)]"
            />
            <span>
              <span className="font-medium">Exige DNI del titular</span>
              <span className="text-muted-foreground block text-xs">
                Obligatorio con el cobro automático: el bot necesita el DNI para reconocer la
                transferencia y confirmar solo. Lo pide al reservar y confirma cuando quien
                transfiere es el mismo titular; el importe pasa a ser redondo (sin centavos). Si
                no coincide, queda para revisión manual.
              </span>
            </span>
          </div>
        </div>
      )}

      <div>
        <Button
          type="submit"
          disabled={
            updateConfig.isPending ||
            unchanged ||
            (mode === "DEPOSIT" && !percentValid) ||
            !cancellationValid ||
            !rescheduleValid
          }
        >
          {updateConfig.isPending ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

function MercadoPagoConnect() {
  const statusQuery = useMercadoPagoStatus();
  const connect = useConnectMercadoPago();
  const disconnect = useDisconnectMercadoPago();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Show a toast when MercadoPago redirects back after the OAuth flow, then clean the URL.
  useEffect(() => {
    const result = searchParams.get("mp");
    if (!result) return;
    if (result === "connected") {
      toast.success("MercadoPago conectado");
      void statusQuery.refetch();
    } else if (result === "error") {
      toast.error("No se pudo conectar MercadoPago. Intentá de nuevo.");
    }
    // Stay on the Pagos tab where the connect button lives.
    router.replace("/panel/configuracion?tab=pagos");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const connected = statusQuery.data?.connected ?? false;

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4 sm:max-w-md">
      <div>
        <h3 className="text-sm font-semibold">Cuenta de MercadoPago</h3>
        <p className="text-muted-foreground text-sm">
          Conectá la cuenta de MercadoPago del club para que la seña se acredite en tu cuenta y el
          bot confirme las reservas automáticamente al recibir la transferencia.
        </p>
      </div>

      {statusQuery.isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Verificando conexión…
        </div>
      ) : connected ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="size-4" />
            MercadoPago conectado
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => disconnect.mutate()}
              disabled={disconnect.isPending}
            >
              {disconnect.isPending ? "Desconectando…" : "Desconectar"}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <Button type="button" onClick={() => connect.mutate()} disabled={connect.isPending}>
            {connect.isPending ? "Redirigiendo…" : "Conectar MercadoPago"}
          </Button>
        </div>
      )}
    </div>
  );
}

export function TransferConfigManager() {
  const configQuery = useTransferConfig();
  const alias = configQuery.data?.transferAlias ?? "";
  const holder = configQuery.data?.transferHolder ?? "";
  const mode = configQuery.data?.depositMode ?? "DEPOSIT";
  const percent = configQuery.data?.depositPercent ?? 25;
  const requireDni = configQuery.data?.requireDniMatch ?? false;
  const verificationMode = configQuery.data?.paymentVerificationMode ?? "AUTO";
  const cancellationHours = configQuery.data?.cancellationWindowHours ?? 24;
  const reschedule = configQuery.data?.playerReschedule ?? "SELF";
  // The API stores "no cutoff" as null; the form shows it as 0.
  const rescheduleCutoff = configQuery.data?.playerRescheduleCutoffHours ?? 0;
  const maxReschedules = configQuery.data?.maxPlayerReschedules ?? 1;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">Cobros por transferencia</h2>
        <p className="text-muted-foreground text-sm">
          El bot le muestra estos datos al jugador para que transfiera la seña. Sin un alias cargado,
          el bot no puede tomar pagos y le pide al jugador que escriba al club.
        </p>
      </div>

      <MercadoPagoConnect />

      {configQuery.isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Cargando datos de cobro…
        </div>
      ) : (
        // Remount with fresh useState when the saved values change (e.g. after a
        // save), instead of syncing server data into state via an effect.
        <TransferConfigForm
          key={`${alias}|${holder}|${mode}|${percent}|${requireDni}|${verificationMode}|${cancellationHours}|${reschedule}|${rescheduleCutoff}|${maxReschedules}`}
          initialAlias={alias}
          initialHolder={holder}
          initialMode={mode}
          initialPercent={percent}
          initialRequireDni={requireDni}
          initialVerificationMode={verificationMode}
          initialCancellationHours={cancellationHours}
          initialReschedule={reschedule}
          initialRescheduleCutoff={rescheduleCutoff}
          initialMaxReschedules={maxReschedules}
        />
      )}
    </section>
  );
}
