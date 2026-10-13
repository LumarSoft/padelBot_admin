import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalPage,
  LegalSection,
  LegalP,
  LegalUl,
} from "@/features/landing/components/legal-page";
import { LUMARSOFT } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Términos y Condiciones — GTP",
  description:
    "Condiciones de uso de GTP, la plataforma de Lumarsoft para que los clubes de pádel gestionen reservas y señas con un asistente de WhatsApp.",
};

const UPDATED_AT = "12 de octubre de 2026";

const link = "text-brand font-medium underline underline-offset-4";

export default function TermsPage() {
  return (
    <LegalPage
      title="Términos y Condiciones"
      updatedAt={UPDATED_AT}
      intro="Estos términos regulan el uso de GTP por parte de los clubes de pádel y de su personal. Al usar el servicio, el club los acepta."
    >
      <LegalSection heading="1. El servicio">
        <LegalP>
          GTP es un producto de <strong>Lumarsoft</strong> (Rosario, Santa Fe,
          Argentina). Ofrece a los clubes de pádel un asistente de WhatsApp que
          atiende a sus jugadores, toma reservas y concilia la seña, más un
          panel web y una app móvil para administrar canchas, turnos, cobros y
          conversaciones.
        </LegalP>
      </LegalSection>

      <LegalSection heading="2. Cuenta y responsabilidades del club">
        <LegalUl>
          <li>
            El club es responsable de la información que carga (canchas,
            precios, horarios, datos de cobro) y del uso que su personal hace de
            la cuenta.
          </li>
          <li>
            El club conecta su propio número de WhatsApp Business y su propia
            cuenta de MercadoPago. El dinero de las señas se acredita
            directamente en la cuenta del club: GTP no custodia fondos.
          </li>
          <li>
            El club se compromete a respetar las políticas de WhatsApp Business
            y de Meta, y a usar el asistente solo para atender a jugadores que
            lo contactan o que aceptaron recibir mensajes del club.
          </li>
        </LegalUl>
      </LegalSection>

      <LegalSection heading="3. Datos de los jugadores">
        <LegalP>
          Los datos de los jugadores pertenecen al club, que actúa como
          responsable; Lumarsoft los trata en su nombre únicamente para prestar
          el servicio. El detalle está en la{" "}
          <Link href="/privacidad" className={link}>
            Política de Privacidad
          </Link>{" "}
          y el procedimiento de baja en{" "}
          <Link href="/eliminar-datos" className={link}>
            Eliminación de datos
          </Link>
          .
        </LegalP>
      </LegalSection>

      <LegalSection heading="4. Asistente automático">
        <LegalP>
          El asistente responde con reglas propias y con modelos de inteligencia
          artificial. Puede equivocarse: las reservas solo quedan confirmadas
          cuando el sistema lo indica, y el club puede tomar cualquier
          conversación de forma manual en todo momento.
        </LegalP>
      </LegalSection>

      <LegalSection heading="5. Suscripción, baja y disponibilidad">
        <LegalP>
          El servicio se contrata por sede mediante una suscripción mensual. El
          club puede darse de baja cuando quiera avisándonos por los canales de
          contacto. Hacemos lo razonable para que el servicio esté siempre
          disponible, pero depende también de terceros (Meta, MercadoPago,
          proveedores de infraestructura) cuyas interrupciones no controlamos.
        </LegalP>
      </LegalSection>

      <LegalSection heading="6. Cambios y contacto">
        <LegalP>
          Podemos actualizar estos términos; los cambios relevantes se avisan
          con anticipación. Consultas a{" "}
          <a href={`mailto:${LUMARSOFT.email}`} className={link}>
            {LUMARSOFT.email}
          </a>{" "}
          o por WhatsApp al {LUMARSOFT.whatsappDisplay}.
        </LegalP>
      </LegalSection>
    </LegalPage>
  );
}
