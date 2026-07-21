"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { lumarsoftWhatsApp } from "@/lib/contact";
import { waLink } from "@/lib/whatsapp";
import { StepLayout } from "@/features/setup/components/step-layout";
import { StepFooter } from "@/features/setup/components/step-footer";
import { BotPreview, type PreviewBubble } from "@/features/setup/components/bot-preview";
import {
  useCreateWhatsAppLine,
  useDeleteWhatsAppLine,
  useWhatsAppLines,
} from "@/features/setup/hooks/use-setup";
import type { StepProps } from "@/features/setup/components/setup-wizard";

export function WhatsAppStep({ clubName, nav }: StepProps) {
  const linesQuery = useWhatsAppLines();
  const createLine = useCreateWhatsAppLine();
  const deleteLine = useDeleteWhatsAppLine();

  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [displayPhone, setDisplayPhone] = useState("");

  const lines = linesQuery.data ?? [];
  const activeLine = lines.find((line) => line.isActive);

  const canSave = phoneNumberId.trim().length > 0 && displayPhone.trim().length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!canSave) return;
    createLine.mutate(
      { phoneNumberId: phoneNumberId.trim(), displayPhone: displayPhone.trim() },
      {
        onSuccess: () => {
          setPhoneNumberId("");
          setDisplayPhone("");
        },
      },
    );
  }

  const bubbles: PreviewBubble[] = [
    { from: "player", text: "Hola" },
    {
      from: "bot",
      text: activeLine
        ? `¡Hola! Soy el asistente de ${clubName}. ¿Querés reservar una cancha?`
        : "…",
    },
  ];

  return (
    <StepLayout
      id="whatsapp"
      preview={
        <BotPreview
          clubName={clubName}
          bubbles={bubbles}
          caption={
            activeLine
              ? `Escribile “hola” a ${activeLine.displayPhone} desde tu teléfono y probalo ahora mismo.`
              : "Sin una línea conectada, el bot no recibe ni un mensaje."
          }
        />
      }
      footer={<StepFooter nav={nav} />}
    >
      {linesQuery.isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Verificando la línea…
        </div>
      ) : activeLine ? (
        <>
          <Card>
            <CardContent className="flex items-center gap-3">
              <CheckCircle2 className="animate-scale-in size-5 shrink-0 text-emerald-600 dark:text-emerald-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  Línea conectada · {activeLine.displayPhone}
                </p>
                <p className="text-muted-foreground text-xs">
                  El bot ya atiende los mensajes que llegan a este número.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Desconectar la línea"
                onClick={() => deleteLine.mutate(activeLine.id)}
                disabled={deleteLine.isPending}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium">Probalo ahora</p>
                <p className="text-muted-foreground mt-1 text-sm text-pretty">
                  Mandale “hola” desde tu propio teléfono. Te va a contestar en segundos, y la
                  conversación te aparece en el panel, en Conversaciones.
                </p>
              </div>
              <div>
                <WhatsAppLink
                  href={waLink(activeLine.displayPhone, "Hola")}
                  className="px-4 py-2"
                >
                  Escribirle al bot
                </WhatsAppLink>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium">Esto lo conectamos nosotros</p>
                <p className="text-muted-foreground mt-1 text-sm text-pretty">
                  El número vive en la cuenta de WhatsApp Business de Meta: no hace falta que
                  el club se pelee con la verificación de Meta ni con las plantillas. Lo damos
                  de alta nosotros y lo dejamos andando en el día.
                </p>
              </div>
              <div>
                <WhatsAppLink href={lumarsoftWhatsApp("whatsapp-setup")} className="px-4 py-2">
                  Pedir la conexión
                </WhatsAppLink>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <p className="text-sm font-medium">Ya tenés el número dado de alta</p>
              <p className="text-muted-foreground mt-1 text-sm text-pretty">
                Pegá los datos que salen del panel de Meta. El <em>phone number ID</em> es el
                identificador que Meta le da al número — no es el teléfono.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="setup-wa-id">Phone number ID (Meta)</Label>
                <Input
                  id="setup-wa-id"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  placeholder="123456789012345"
                  maxLength={64}
                  disabled={createLine.isPending}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="setup-wa-phone">Número visible</Label>
                <Input
                  id="setup-wa-phone"
                  value={displayPhone}
                  onChange={(e) => setDisplayPhone(e.target.value)}
                  placeholder="+54 9 341 555-5555"
                  maxLength={40}
                  disabled={createLine.isPending}
                />
                <p className="text-muted-foreground text-xs">
                  Solo para mostrarlo en el panel.
                </p>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                variant="brand"
                disabled={!canSave || createLine.isPending}
              >
                {createLine.isPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Conectando…
                  </>
                ) : (
                  "Conectar la línea"
                )}
              </Button>
            </div>
          </form>
        </>
      )}
    </StepLayout>
  );
}
