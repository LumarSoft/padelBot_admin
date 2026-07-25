"use client";

import { useState, type FormEvent } from "react";
import { Building2, Loader2, MessageSquareQuote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SaveBar } from "@/features/configuracion/components/save-bar";
import { SettingsSection } from "@/features/configuracion/components/settings-section";
import {
  useClubProfile,
  useUpdateClubProfile,
} from "@/features/configuracion/hooks/use-transfer-config";

function ClubProfileForm({
  initialName,
  slug,
  initialWelcomeExtra,
  initialLocationInfo,
}: {
  initialName: string;
  slug: string;
  initialWelcomeExtra: string;
  initialLocationInfo: string;
}) {
  const updateProfile = useUpdateClubProfile();
  const [name, setName] = useState(initialName);
  const [welcomeExtra, setWelcomeExtra] = useState(initialWelcomeExtra);
  const [locationInfo, setLocationInfo] = useState(initialLocationInfo);

  const trimmed = name.trim();
  const valid = trimmed.length >= 2;
  const unchanged =
    trimmed === initialName &&
    welcomeExtra.trim() === initialWelcomeExtra &&
    locationInfo.trim() === initialLocationInfo;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!valid || unchanged) return;
    updateProfile.mutate({
      name: trimmed,
      botWelcomeExtra: welcomeExtra.trim(),
      locationInfo: locationInfo.trim(),
    });
  }

  return (
    // One form, two columns: the club's identity on the left, what the bot says about it
    // on the right. Both save with the single button below, so they stay one <form>.
    // Stretched (no `items-start`) so the pair ends on the same line, as in Pagos.
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsSection
          icon={Building2}
          title="Identidad del complejo"
          description="Cómo se identifica tu complejo en el panel y en cada mensaje del bot."
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="club-name">Nombre del complejo</Label>
              <Input
                id="club-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                disabled={updateProfile.isPending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="club-slug">Identificador</Label>
              <Input id="club-slug" value={slug} readOnly disabled className="font-mono" />
              <p className="text-muted-foreground text-xs">
                El identificador no se modifica. Si lo necesitás cambiar, escribinos.
              </p>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          icon={MessageSquareQuote}
          title="Lo que el bot cuenta"
          description="Dos textos que el bot usa tal cual los escribas, sin inventar nada."
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="club-welcome-extra">Mensaje propio del bot (opcional)</Label>
              <Textarea
                id="club-welcome-extra"
                value={welcomeExtra}
                onChange={(e) => setWelcomeExtra(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Ej: 🏠 Reglas de la casa: suela lisa y puntualidad — el turno arranca en hora."
                disabled={updateProfile.isPending}
              />
              <p className="text-muted-foreground text-xs">
                El bot lo agrega debajo de su saludo, tal cual lo escribas.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="club-location">Cómo llegar (opcional)</Label>
              <Textarea
                id="club-location"
                value={locationInfo}
                onChange={(e) => setLocationInfo(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Ej: Av. Pellegrini 1234, Rosario — a 2 cuadras del parque. Maps: https://maps.app/..."
                disabled={updateProfile.isPending}
              />
              <p className="text-muted-foreground text-xs">
                El bot responde esto cuando le preguntan la dirección o cómo llegar.
              </p>
            </div>
          </div>
        </SettingsSection>
      </div>

      <SaveBar pending={updateProfile.isPending} unchanged={unchanged} disabled={!valid} />
    </form>
  );
}

export function ClubProfileManager() {
  const profileQuery = useClubProfile();

  if (profileQuery.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando datos del complejo…
      </div>
    );
  }

  const name = profileQuery.data?.name ?? "";
  const slug = profileQuery.data?.slug ?? "";
  const welcomeExtra = profileQuery.data?.botWelcomeExtra ?? "";
  const locationInfo = profileQuery.data?.locationInfo ?? "";

  return (
    <ClubProfileForm
      key={`${name}|${slug}|${welcomeExtra}|${locationInfo}`}
      initialName={name}
      slug={slug}
      initialWelcomeExtra={welcomeExtra}
      initialLocationInfo={locationInfo}
    />
  );
}
