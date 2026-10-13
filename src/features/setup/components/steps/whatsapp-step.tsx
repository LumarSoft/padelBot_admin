"use client";

import { StepLayout } from "@/features/setup/components/step-layout";
import { StepFooter } from "@/features/setup/components/step-footer";
import {
  BotPreview,
  type PreviewBubble,
} from "@/features/setup/components/bot-preview";
import { WhatsAppConnection } from "@/features/setup/components/whatsapp-connection";
import { useWhatsAppLines } from "@/features/setup/hooks/use-setup";
import type { StepProps } from "@/features/setup/components/setup-wizard";

export function WhatsAppStep({ clubName, nav }: StepProps) {
  const linesQuery = useWhatsAppLines();
  const activeLine = linesQuery.data?.find((line) => line.isActive);

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
      <WhatsAppConnection />
    </StepLayout>
  );
}
