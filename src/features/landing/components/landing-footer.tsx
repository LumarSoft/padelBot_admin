import Link from "next/link";
import { Mail } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { LUMARSOFT, lumarsoftEmail, lumarsoftWhatsApp } from "@/lib/contact";
import { BrandWordmark } from "./brand-wordmark";
import { Container } from "./landing-ui";

const PRODUCT_LINKS = [
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#cuaderno", label: "Antes y después" },
  { href: "/#panel", label: "Panel" },
  { href: "/#incluye", label: "Qué incluye" },
  { href: "/#faq", label: "Preguntas" },
];

const LINK_CLASS = "text-fog hover:text-chalk text-sm transition-colors";

export function LandingFooter() {
  return (
    <footer className="bg-ink text-chalk relative overflow-hidden pt-16">
      <Container className="flex flex-col gap-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <BrandWordmark />
            <p className="text-fog max-w-xs text-sm text-pretty">
              El bot de WhatsApp que reserva canchas y cobra la seña por vos,
              con un panel para ver todo. Hecho para complejos de pádel.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-mono text-xs tracking-[0.18em] text-chalk/50 uppercase">
              Producto
            </p>
            {PRODUCT_LINKS.map((link) => (
              <a key={link.href} href={link.href} className={LINK_CLASS}>
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-mono text-xs tracking-[0.18em] text-chalk/50 uppercase">
              Acceso
            </p>
            <Link href="/register" className={LINK_CLASS}>
              Probar gratis
            </Link>
            <Link href="/login" className={LINK_CLASS}>
              Entrar al panel
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-mono text-xs tracking-[0.18em] text-chalk/50 uppercase">
              Contacto
            </p>
            <a
              href={lumarsoftWhatsApp("interested")}
              target="_blank"
              rel="noopener noreferrer"
              className={`${LINK_CLASS} inline-flex items-center gap-2`}
            >
              <WhatsAppIcon className="size-4" />
              {LUMARSOFT.whatsappDisplay}
            </a>
            <a
              href={lumarsoftEmail("interested")}
              className={`${LINK_CLASS} inline-flex items-center gap-2`}
            >
              <Mail className="size-4" />
              {LUMARSOFT.email}
            </a>
          </div>
        </div>

        <div className="border-chalk/10 text-fog flex flex-col items-start justify-between gap-3 border-t pt-6 text-sm sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} GTP · un producto de Lumarsoft</p>
          <div className="flex items-center gap-4">
            <Link href="/privacidad" className="hover:text-chalk transition-colors">
              Privacidad
            </Link>
            <Link href="/soporte" className="hover:text-chalk transition-colors">
              Soporte
            </Link>
            <span>Hecho en Argentina 🧉</span>
          </div>
        </div>
      </Container>

      <p
        aria-hidden
        className="font-display text-chalk/[0.05] mt-10 -mb-[0.3em] text-center text-[28vw] leading-[0.75] font-black select-none"
      >
        GTP
      </p>
    </footer>
  );
}
