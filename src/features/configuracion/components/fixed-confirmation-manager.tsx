"use client";

import { useState, type FormEvent } from "react";
import { Loader2, MessageCircleQuestion } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OptionCard } from "@/features/configuracion/components/option-card";
import { SaveBar } from "@/features/configuracion/components/save-bar";
import { SettingsSection } from "@/features/configuracion/components/settings-section";
import {
  useFixedConfirmation,
  useUpdateFixedConfirmation,
} from "@/features/configuracion/hooks/use-fixed-confirmation";

/** The values the API accepts (`UpdateFixedConfirmationDto`). */
const LEAD_OPTIONS = [
  { hours: 24, label: "24 horas antes — el día anterior, a la misma hora (recomendado)" },
  { hours: 48, label: "48 horas antes — dos días antes" },
  { hours: 12, label: "12 horas antes" },
  { hours: 6, label: "6 horas antes" },
  { hours: 3, label: "3 horas antes" },
] as const;

const STATUS_OPTIONS = [
  {
    value: "on",
    label: "Sí, que el bot les pregunte",
    hint: "Les llega un WhatsApp con dos botones y en la Agenda ves quién respondió.",
  },
  {
    value: "off",
    label: "No, los llamamos nosotros",
    hint: "Como siempre: el fijo solo recibe el recordatorio 1 hora antes.",
  },
] as const;

/** What the player sees on WhatsApp — mirrors the template submitted to Meta (api docs). */
function MessagePreview({ leadHours }: { leadHours: number }) {
  const day = leadHours >= 24 ? (leadHours >= 48 ? "el jueves 16/10" : "mañana") : "hoy";
  return (
    <div className="rounded-xl bg-[#e7ddd3] p-3 dark:bg-[#0b141a]">
      <div className="max-w-80 rounded-lg rounded-tl-none bg-white p-2.5 text-[13px] leading-snug text-[#111b21] shadow-sm dark:bg-[#202c33] dark:text-[#e9edef]">
        <p>
          Hola Juan Pérez 👋 Tenés tu turno fijo {day} a las 19:00 en Cancha 1. ¿Venís?
        </p>
        <p className="mt-2">Tocá una opción así el club sabe si te espera o si libera la cancha.</p>
        <p className="mt-1.5 text-[11px] text-[#667781] dark:text-[#8696a0]">
          Si no podés, solo se libera esa fecha. Tu fijo sigue.
        </p>
      </div>
      <div className="mt-1 grid max-w-80 grid-cols-2 gap-1">
        {["Sí, voy", "No puedo"].map((label) => (
          <span
            key={label}
            className="rounded-lg bg-white py-1.5 text-center text-[13px] font-medium text-[#027eb5] shadow-sm dark:bg-[#202c33] dark:text-[#53bdeb]"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function FixedConfirmationForm({
  initialEnabled,
  initialLeadHours,
}: {
  initialEnabled: boolean;
  initialLeadHours: number;
}) {
  const update = useUpdateFixedConfirmation();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [leadHours, setLeadHours] = useState(initialLeadHours);
  const unchanged = enabled === initialEnabled && leadHours === initialLeadHours;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update.mutate({ enabled, leadHours });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <SettingsSection
        icon={MessageCircleQuestion}
        title="Preguntarles a los fijos si vienen"
        description="El bot le escribe a cada turno fijo antes de su turno para saber si viene, así no tenés que llamarlos uno por uno."
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex min-w-0 flex-col gap-5" data-help="fijos-pregunta">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">¿Activamos la pregunta automática?</legend>
              {STATUS_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  name="fixed-confirmation-enabled"
                  value={option.value}
                  checked={enabled === (option.value === "on")}
                  onSelect={() => setEnabled(option.value === "on")}
                  label={option.label}
                  hint={option.hint}
                />
              ))}
            </fieldset>

            <div className="flex flex-col gap-2">
              <Label htmlFor="fixed-confirmation-lead">¿Cuándo les preguntamos?</Label>
              <Select
                value={String(leadHours)}
                onValueChange={(value) => value && setLeadHours(Number(value))}
                disabled={!enabled}
              >
                <SelectTrigger id="fixed-confirmation-lead" className="w-full max-w-md min-w-0">
                  <SelectValue className="truncate">
                    {(value) =>
                      LEAD_OPTIONS.find((option) => String(option.hours) === value)?.label ??
                      `${value} horas antes`
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LEAD_OPTIONS.map((option) => (
                    <SelectItem key={option.hours} value={String(option.hours)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/40 rounded-xl p-3 text-sm">
              <p className="mb-1.5 font-medium">Cómo funciona</p>
              <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-pretty">
                <li>
                  Si toca <strong className="text-foreground">«No puedo»</strong>, liberamos solo
                  ese turno para que lo use otra persona y le avisamos a la lista de espera. Las
                  semanas siguientes su fijo sigue igual.
                </li>
                <li>
                  Si no contesta, <strong className="text-foreground">no se cancela nada</strong>:
                  2 horas antes te llega un aviso al celular y en la Agenda aparece en «Fijos sin
                  respuesta» con el teléfono para llamarlo.
                </li>
                <li>Si ya le preguntamos, no le mandamos además el recordatorio de 1 hora antes.</li>
                <li>
                  El mensaje tiene que estar aprobado por WhatsApp en el número del club. Si no
                  sabés si ya está, consultanos antes de activarlo.
                </li>
              </ul>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-muted-foreground text-xs font-medium">Así le llega al jugador</p>
            <MessagePreview leadHours={leadHours} />
          </div>
        </div>
      </SettingsSection>

      <SaveBar pending={update.isPending} unchanged={unchanged} />
    </form>
  );
}

/** Configuración → Turnos fijos: the automatic WhatsApp "¿venís?" (on/off + how early). */
export function FixedConfirmationManager() {
  const config = useFixedConfirmation();

  if (config.isLoading || !config.data) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando…
      </div>
    );
  }

  // Keyed on the saved values so the form re-initializes after a save lands.
  return (
    <FixedConfirmationForm
      key={`${config.data.enabled}-${config.data.leadHours}`}
      initialEnabled={config.data.enabled}
      initialLeadHours={config.data.leadHours}
    />
  );
}
