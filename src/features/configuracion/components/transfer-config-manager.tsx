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
import type { DepositMode } from "@/types/api/clubs";

function TransferConfigForm({
  initialAlias,
  initialHolder,
  initialMode,
  initialPercent,
  initialRequireDni,
}: {
  initialAlias: string;
  initialHolder: string;
  initialMode: DepositMode;
  initialPercent: number;
  initialRequireDni: boolean;
}) {
  const updateConfig = useUpdateTransferConfig();
  const [alias, setAlias] = useState(initialAlias);
  const [holder, setHolder] = useState(initialHolder);
  const [mode, setMode] = useState<DepositMode>(initialMode);
  const [percent, setPercent] = useState(String(initialPercent));
  const [requireDni, setRequireDni] = useState(initialRequireDni);

  const trimmedAlias = alias.trim();
  const trimmedHolder = holder.trim();
  const percentNumber = Number(percent);
  const percentValid =
    Number.isInteger(percentNumber) && percentNumber >= 1 && percentNumber <= 100;
  const unchanged =
    trimmedAlias === initialAlias &&
    trimmedHolder === initialHolder &&
    mode === initialMode &&
    percentNumber === initialPercent &&
    requireDni === initialRequireDni;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (unchanged || (mode === "DEPOSIT" && !percentValid)) return;
    updateConfig.mutate({
      transferAlias: trimmedAlias,
      transferHolder: trimmedHolder,
      depositMode: mode,
      requireDniMatch: requireDni,
      ...(mode === "DEPOSIT" ? { depositPercent: percentNumber } : {}),
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
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={requireDni}
            onChange={(e) => setRequireDni(e.target.checked)}
            disabled={updateConfig.isPending}
            className="mt-0.5 accent-[var(--brand)]"
          />
          <span>
            <span className="font-medium">Exigir DNI del titular</span>
            <span className="text-muted-foreground block text-xs">
              El bot pide el DNI al reservar y solo confirma solo si quien transfiere es el mismo
              titular. El importe pasa a ser redondo (sin centavos). Si no coincide, queda para
              revisión manual.
            </span>
          </span>
        </label>
      </div>

      <div>
        <Button
          type="submit"
          disabled={
            updateConfig.isPending ||
            unchanged ||
            (mode === "DEPOSIT" && !percentValid)
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
    router.replace("/configuracion");
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
          key={`${alias}|${holder}|${mode}|${percent}|${requireDni}`}
          initialAlias={alias}
          initialHolder={holder}
          initialMode={mode}
          initialPercent={percent}
          initialRequireDni={requireDni}
        />
      )}
    </section>
  );
}
