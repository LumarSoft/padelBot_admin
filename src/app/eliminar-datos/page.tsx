import type { Metadata } from "next";
import {
  LegalPage,
  LegalSection,
  LegalP,
  LegalUl,
} from "@/features/landing/components/legal-page";
import { LUMARSOFT } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Eliminación de datos — GTP",
  description:
    "Cómo pedir que GTP (Lumarsoft) elimine los datos de un club, de su personal o de un jugador, incluidos los obtenidos a través de WhatsApp y Facebook.",
};

const UPDATED_AT = "12 de octubre de 2026";

const mailLink = (
  <a
    href={`mailto:${LUMARSOFT.email}?subject=Eliminaci%C3%B3n%20de%20datos%20GTP`}
    className="text-brand font-medium underline underline-offset-4"
  >
    {LUMARSOFT.email}
  </a>
);

export default function DataDeletionPage() {
  return (
    <LegalPage
      title="Eliminación de datos"
      updatedAt={UPDATED_AT}
      intro="Cualquier persona puede pedir que eliminemos sus datos de GTP. Esta página explica cómo hacerlo y qué pasa con cada tipo de dato."
    >
      <LegalSection heading="1. Cómo pedirlo">
        <LegalP>
          Escribinos a {mailLink} o por WhatsApp al {LUMARSOFT.whatsappDisplay}{" "}
          con el asunto “Eliminación de datos” e indicá:
        </LegalP>
        <LegalUl>
          <li>
            <strong>Si sos jugador:</strong> el número de WhatsApp con el que le
            escribiste al club y el nombre del club.
          </li>
          <li>
            <strong>Si sos dueño o personal de un club:</strong> el correo de tu
            cuenta y el nombre del club.
          </li>
        </LegalUl>
        <LegalP>
          Confirmamos la recepción dentro de los 5 días hábiles y completamos la
          eliminación dentro de los 30 días. Te avisamos por el mismo medio
          cuando esté hecha.
        </LegalP>
      </LegalSection>

      <LegalSection heading="2. Qué eliminamos">
        <LegalUl>
          <li>
            Las conversaciones con el asistente de WhatsApp (textos,
            transcripciones de audios y descripciones de imágenes) y los
            comprobantes de transferencia.
          </li>
          <li>
            El perfil del jugador en el club: nombre, teléfono, DNI e historial
            de reservas, que se anonimiza.
          </li>
          <li>
            Si es un club que se da de baja: sus cuentas de usuario, la conexión
            con WhatsApp (incluido el identificador de acceso que Meta emitió
            para su número) y la conexión con MercadoPago.
          </li>
        </LegalUl>
      </LegalSection>

      <LegalSection heading="3. Datos obtenidos a través de Facebook y WhatsApp">
        <LegalP>
          Cuando un club conecta su número de WhatsApp con el inicio de sesión
          de Facebook, GTP solo guarda los identificadores de su cuenta de
          WhatsApp Business y el número conectado, y un identificador de acceso
          cifrado. No accedemos a tu perfil personal de Facebook. Al pedir la
          eliminación borramos esos datos; también podés quitarle el acceso a
          GTP en cualquier momento desde la configuración de tu portfolio
          empresarial en Meta.
        </LegalP>
      </LegalSection>

      <LegalSection heading="4. Qué podemos conservar">
        <LegalP>
          Conservamos solo lo que la ley nos obligue a guardar (por ejemplo,
          registros contables de la suscripción del club) y por el plazo que esa
          obligación exija.
        </LegalP>
      </LegalSection>
    </LegalPage>
  );
}
