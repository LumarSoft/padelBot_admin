"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useTransferConfig,
  useUpdateTransferConfig,
} from "@/features/configuracion/hooks/use-transfer-config";

function TransferConfigForm({
  initialAlias,
  initialHolder,
}: {
  initialAlias: string;
  initialHolder: string;
}) {
  const updateConfig = useUpdateTransferConfig();
  const [alias, setAlias] = useState(initialAlias);
  const [holder, setHolder] = useState(initialHolder);

  const trimmedAlias = alias.trim();
  const trimmedHolder = holder.trim();
  const unchanged = trimmedAlias === initialAlias && trimmedHolder === initialHolder;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (unchanged) return;
    updateConfig.mutate({ transferAlias: trimmedAlias, transferHolder: trimmedHolder });
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
      <div>
        <Button type="submit" disabled={updateConfig.isPending || unchanged}>
          {updateConfig.isPending ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

export function TransferConfigManager() {
  const configQuery = useTransferConfig();
  const alias = configQuery.data?.transferAlias ?? "";
  const holder = configQuery.data?.transferHolder ?? "";

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">Cobros por transferencia</h2>
        <p className="text-muted-foreground text-sm">
          El bot le muestra estos datos al jugador para que transfiera la seña. Sin un alias cargado,
          el bot no puede tomar pagos y le pide al jugador que escriba al club.
        </p>
      </div>

      {configQuery.isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Cargando datos de cobro…
        </div>
      ) : (
        // Remount with fresh useState when the saved values change (e.g. after a
        // save), instead of syncing server data into state via an effect.
        <TransferConfigForm key={`${alias}|${holder}`} initialAlias={alias} initialHolder={holder} />
      )}
    </section>
  );
}
