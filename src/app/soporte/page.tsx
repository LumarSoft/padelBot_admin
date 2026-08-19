import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import {
  LegalPage,
  LegalSection,
  LegalP,
  LegalUl,
} from "@/features/landing/components/legal-page";
import {
  LUMARSOFT,
  lumarsoftEmail,
  lumarsoftWhatsApp,
} from "@/lib/contact";

export const metadata: Metadata = {
  title: "Soporte — GTP",
  description:
    "Soporte y ayuda de GTP: cómo contactarnos y preguntas frecuentes sobre la app de gestión para clubes de pádel.",
};

const UPDATED_AT = "18 de agosto de 2026";

export default function SupportPage() {
  return (
    <LegalPage
      title="Soporte"
      updatedAt={UPDATED_AT}
      intro="¿Tenés una duda o un problema con GTP? Estamos para ayudarte. Escribinos por cualquiera de estos medios y te respondemos a la brevedad."
    >
      <LegalSection heading="Contactanos">
        <LegalP>
          La forma más rápida de resolver cualquier consulta es por WhatsApp o
          correo. Atendemos en horario comercial de Argentina (GMT-3).
        </LegalP>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <a
            href={lumarsoftWhatsApp("help")}
            target="_blank"
            rel="noopener noreferrer"
            className="border-border bg-card/60 hover:bg-muted inline-flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors"
          >
            <WhatsAppIcon className="size-5 text-brand" />
            <span>
              WhatsApp
              <span className="text-muted-foreground block text-xs font-normal">
                {LUMARSOFT.whatsappDisplay}
              </span>
            </span>
          </a>
          <a
            href={lumarsoftEmail("help")}
            className="border-border bg-card/60 hover:bg-muted inline-flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors"
          >
            <Mail className="size-5 text-brand" />
            <span>
              Correo
              <span className="text-muted-foreground block text-xs font-normal">
                {LUMARSOFT.email}
              </span>
            </span>
          </a>
        </div>
      </LegalSection>

      <LegalSection heading="Preguntas frecuentes">
        <LegalP>
          <strong>¿Qué es GTP?</strong> Es la plataforma que usan los clubes de
          pádel para gestionar sus reservas. Un asistente de WhatsApp atiende a
          los jugadores y reserva canchas; el personal del club administra todo
          desde el panel web y la app móvil.
        </LegalP>
        <LegalP>
          <strong>¿Para quién es la app móvil?</strong> Para el personal
          (staff) y los dueños de un club. Se ingresa con las credenciales que
          asigna el dueño del club: no es una app de registro abierto al público.
        </LegalP>
        <LegalP>
          <strong>No puedo iniciar sesión.</strong> Verificá que tu correo y
          contraseña sean correctos y que tu cuenta esté activa. Si el problema
          sigue, pedile al dueño de tu club que revise tu usuario o
          escribinos.
        </LegalP>
        <LegalP>
          <strong>¿Cómo empiezo a usar GTP en mi club?</strong> Escribinos por
          WhatsApp y coordinamos la puesta en marcha de tu complejo.
        </LegalP>
      </LegalSection>

      <LegalSection heading="¿Qué incluir cuando nos escribís?">
        <LegalUl>
          <li>El nombre de tu club.</li>
          <li>Una descripción de lo que estabas haciendo cuando ocurrió.</li>
          <li>Si es posible, una captura de pantalla del problema.</li>
        </LegalUl>
      </LegalSection>

      <LegalSection heading="Privacidad">
        <LegalP>
          Podés consultar cómo tratamos tus datos en nuestra{" "}
          <Link
            href="/privacidad"
            className="text-brand font-medium underline underline-offset-4"
          >
            Política de Privacidad
          </Link>
          .
        </LegalP>
      </LegalSection>
    </LegalPage>
  );
}
