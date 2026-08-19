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
  title: "Política de Privacidad — GTP",
  description:
    "Cómo GTP (Lumarsoft) recopila, usa y protege los datos en la app de gestión y el bot de WhatsApp para clubes de pádel.",
};

const UPDATED_AT = "18 de agosto de 2026";

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Política de Privacidad"
      updatedAt={UPDATED_AT}
      intro="Esta política describe qué datos tratamos en GTP —tanto en el panel web y la app móvil para el personal de los clubes, como en el asistente de WhatsApp que atiende a los jugadores— y cómo los protegemos."
    >
      <LegalSection heading="1. Quiénes somos">
        <LegalP>
          GTP es un producto de <strong>Lumarsoft</strong>, con domicilio en
          Rosario, Santa Fe, Argentina. GTP es una plataforma de gestión para
          clubes de pádel: un asistente de WhatsApp atiende a los jugadores y
          reserva canchas, y los dueños y el personal del club administran las
          reservas desde un panel web y una app móvil.
        </LegalP>
        <LegalP>
          Ante cualquier consulta sobre esta política o tus datos, escribinos a{" "}
          <a
            href={`mailto:${LUMARSOFT.email}`}
            className="text-brand font-medium underline underline-offset-4"
          >
            {LUMARSOFT.email}
          </a>
          .
        </LegalP>
      </LegalSection>

      <LegalSection heading="2. Qué datos recopilamos">
        <LegalP>
          <strong>Datos de las cuentas del club (dueños y personal).</strong>{" "}
          Para iniciar sesión en el panel o la app móvil tratamos: nombre,
          correo electrónico, contraseña (almacenada siempre cifrada, nunca en
          texto plano), rol dentro del club y fecha del último ingreso.
        </LegalP>
        <LegalP>
          <strong>Datos técnicos del dispositivo (app móvil).</strong> Cuando
          activás las notificaciones push, registramos un identificador de
          notificaciones (token de Expo) y el tipo de plataforma (iOS o Android)
          para poder avisarte de nuevas reservas y comprobantes. No accedemos a
          tu agenda, fotos, ubicación ni micrófono.
        </LegalP>
        <LegalP>
          <strong>Datos de los jugadores (tratados por cuenta del club).</strong>{" "}
          Al gestionar reservas se procesan datos de los jugadores del club:
          nombre, número de teléfono, detalle de sus reservas y el comprobante
          de la transferencia de la seña. Estos datos pertenecen al club, que
          actúa como responsable; Lumarsoft los trata en su nombre para prestar
          el servicio.
        </LegalP>
      </LegalSection>

      <LegalSection heading="3. Para qué usamos los datos">
        <LegalUl>
          <li>Autenticar el ingreso y mantener la sesión de forma segura.</li>
          <li>
            Mostrar y gestionar las reservas, pagos y comprobantes del club.
          </li>
          <li>
            Enviar notificaciones sobre nuevas reservas o comprobantes a
            revisar.
          </li>
          <li>
            Conciliar automáticamente el pago de la seña por transferencia.
          </li>
          <li>Brindar soporte y mejorar el funcionamiento del servicio.</li>
        </LegalUl>
        <LegalP>
          No vendemos datos personales ni los usamos con fines publicitarios de
          terceros.
        </LegalP>
      </LegalSection>

      <LegalSection heading="4. Con quién los compartimos">
        <LegalP>
          Solo compartimos datos con proveedores que hacen funcionar el
          servicio, y únicamente en lo necesario:
        </LegalP>
        <LegalUl>
          <li>
            <strong>Meta (WhatsApp Business).</strong> Para que el bot converse
            con los jugadores por WhatsApp.
          </li>
          <li>
            <strong>MercadoPago.</strong> Para conciliar las transferencias de
            la seña de cada club que conecta su cuenta.
          </li>
          <li>
            <strong>Expo.</strong> Para entregar las notificaciones push a los
            dispositivos del personal.
          </li>
          <li>
            <strong>Proveedores de infraestructura</strong> (alojamiento y base
            de datos) que almacenan la información de forma segura.
          </li>
        </LegalUl>
        <LegalP>
          También podremos divulgar datos si la ley lo exige o para proteger
          derechos, la seguridad o la integridad del servicio.
        </LegalP>
      </LegalSection>

      <LegalSection heading="5. Cómo protegemos los datos">
        <LegalP>
          Las contraseñas se almacenan con un algoritmo de hash (bcrypt) y las
          credenciales sensibles de terceros se guardan cifradas. Toda la
          comunicación viaja por HTTPS. En la app móvil, el token de sesión se
          guarda en el almacenamiento seguro del sistema operativo (Keychain en
          iOS, Keystore en Android). El acceso a los datos de cada club está
          aislado por inquilino: un club nunca puede ver datos de otro.
        </LegalP>
      </LegalSection>

      <LegalSection heading="6. Cuánto tiempo los conservamos">
        <LegalP>
          Conservamos los datos mientras la cuenta del club esté activa y
          durante el tiempo necesario para cumplir obligaciones legales,
          contables o de seguridad. Si un club deja de usar el servicio, sus
          datos pueden eliminarse o anonimizarse a pedido, salvo aquello que
          debamos conservar por ley.
        </LegalP>
      </LegalSection>

      <LegalSection heading="7. Tus derechos">
        <LegalP>
          Podés solicitar acceder, rectificar o eliminar tus datos personales, o
          revocar consentimientos, escribiéndonos a{" "}
          <a
            href={`mailto:${LUMARSOFT.email}`}
            className="text-brand font-medium underline underline-offset-4"
          >
            {LUMARSOFT.email}
          </a>
          . Si sos un jugador y querés ejercer estos derechos, también podés
          contactar directamente a tu club. Como titular de datos en Argentina,
          podés dirigirte a la Agencia de Acceso a la Información Pública (AAIP).
        </LegalP>
      </LegalSection>

      <LegalSection heading="8. Menores de edad">
        <LegalP>
          GTP está pensado para el personal de los clubes y para jugadores
          adultos. No recopilamos deliberadamente datos de menores de edad.
        </LegalP>
      </LegalSection>

      <LegalSection heading="9. Cambios en esta política">
        <LegalP>
          Podemos actualizar esta política para reflejar mejoras o cambios
          legales. Publicaremos la versión vigente en esta misma página con su
          fecha de última actualización.
        </LegalP>
      </LegalSection>

      <LegalSection heading="10. Contacto">
        <LegalP>
          Lumarsoft — Rosario, Santa Fe, Argentina.
          <br />
          Correo:{" "}
          <a
            href={`mailto:${LUMARSOFT.email}`}
            className="text-brand font-medium underline underline-offset-4"
          >
            {LUMARSOFT.email}
          </a>
          <br />
          WhatsApp: {LUMARSOFT.whatsappDisplay}
        </LegalP>
        <LegalP>
          ¿Necesitás ayuda con la app?{" "}
          <Link
            href="/soporte"
            className="text-brand font-medium underline underline-offset-4"
          >
            Visitá nuestra página de soporte
          </Link>
          .
        </LegalP>
      </LegalSection>
    </LegalPage>
  );
}
