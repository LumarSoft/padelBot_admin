"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepLayout } from "@/features/setup/components/step-layout";
import { StepFooter } from "@/features/setup/components/step-footer";
import { BotPreview, type PreviewBubble } from "@/features/setup/components/bot-preview";
import {
  useClubProfile,
  useUpdateClubProfile,
} from "@/features/configuracion/hooks/use-transfer-config";
import type { StepProps } from "@/features/setup/components/setup-wizard";

function ComplejoForm({
  nav,
  initialName,
  initialLocation,
  initialWelcome,
}: Pick<StepProps, "nav"> & {
  initialName: string;
  initialLocation: string;
  initialWelcome: string;
}) {
  const updateProfile = useUpdateClubProfile();
  const [name, setName] = useState(initialName);
  const [location, setLocation] = useState(initialLocation);
  const [welcome, setWelcome] = useState(initialWelcome);

  const trimmedName = name.trim();
  const canSave = trimmedName.length >= 2;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!canSave) return;
    updateProfile.mutate(
      {
        name: trimmedName,
        locationInfo: location.trim(),
        botWelcomeExtra: welcome.trim(),
      },
      { onSuccess: () => nav.onNext() },
    );
  }

  const bubbles: PreviewBubble[] = [
    { from: "player", text: "Hola!" },
    {
      from: "bot",
      text: `¡Hola! Soy el asistente de ${trimmedName || "tu complejo"}. Puedo reservarte una cancha, cancelar o pasarte los horarios.${welcome.trim() ? `\n\n${welcome.trim()}` : ""}`,
    },
    { from: "player", text: "Dónde están?" },
    {
      from: "bot",
      text: location.trim()
        ? location.trim()
        : "Uy, no tengo la dirección cargada. Escribile al club y te la pasan.",
    },
  ];

  return (
    <StepLayout
      id="complejo"
      preview={
        <BotPreview
          clubName={trimmedName || "Tu complejo"}
          bubbles={bubbles}
          caption="Así se presenta el bot y así responde “¿dónde están?”. Se actualiza mientras escribís."
        />
      }
      footer={
        <StepFooter
          nav={nav}
          primary={
            <Button
              type="submit"
              form="setup-complejo"
              variant="brand"
              size="lg"
              disabled={!canSave || updateProfile.isPending}
            >
              {updateProfile.isPending ? (
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
      <form id="setup-complejo" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="setup-club-name">Nombre del complejo</Label>
          <Input
            id="setup-club-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            placeholder="Pádel Center Rosario"
            disabled={updateProfile.isPending}
            autoFocus
          />
          <p className="text-muted-foreground text-xs">
            Con este nombre se presenta el bot en cada conversación.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="setup-location">Cómo llegar</Label>
          <textarea
            id="setup-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Av. Pellegrini 1234, Rosario. Entre Moreno y Balcarce, portón negro. Estacionamiento propio."
            disabled={updateProfile.isPending}
            className="border-input bg-foreground/[0.03] focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-3 py-2 text-sm shadow-[inset_0_1px_2px_--alpha(var(--color-black)/4%)] outline-none focus-visible:ring-3 disabled:opacity-50 dark:bg-input/20"
          />
          <p className="text-muted-foreground text-xs">
            Dirección, referencias o link de Google Maps. El bot lo responde cuando se lo
            preguntan. Sin esto, tiene que decir que no la tiene.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="setup-welcome">Tu mensaje propio (opcional)</Label>
          <textarea
            id="setup-welcome"
            value={welcome}
            onChange={(e) => setWelcome(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Recordá traer paletas. Se puede pagar en efectivo al llegar."
            disabled={updateProfile.isPending}
            className="border-input bg-foreground/[0.03] focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-3 py-2 text-sm shadow-[inset_0_1px_2px_--alpha(var(--color-black)/4%)] outline-none focus-visible:ring-3 disabled:opacity-50 dark:bg-input/20"
          />
          <p className="text-muted-foreground text-xs">
            Las reglas de la casa o el tono del club. El bot lo suma abajo de la bienvenida.
          </p>
        </div>
      </form>
    </StepLayout>
  );
}

export function ComplejoStep({ clubName, nav }: StepProps) {
  const profileQuery = useClubProfile();

  if (profileQuery.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-16 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando los datos del complejo…
      </div>
    );
  }

  return (
    <ComplejoForm
      nav={nav}
      initialName={profileQuery.data?.name ?? clubName}
      initialLocation={profileQuery.data?.locationInfo ?? ""}
      initialWelcome={profileQuery.data?.botWelcomeExtra ?? ""}
    />
  );
}
