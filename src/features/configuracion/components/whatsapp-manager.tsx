"use client";

import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { SettingsSection } from "@/features/configuracion/components/settings-section";
import { WhatsAppConnection } from "@/features/setup/components/whatsapp-connection";

/** Configuración → Bot: the WhatsApp line the bot answers on (same flow as `/setup`). */
export function WhatsAppManager() {
  return (
    <SettingsSection
      title="WhatsApp del bot"
      description="El número en el que el bot atiende a los jugadores. Sin una línea conectada, el bot no recibe mensajes."
      icon={WhatsAppIcon}
    >
      <WhatsAppConnection />
    </SettingsSection>
  );
}
