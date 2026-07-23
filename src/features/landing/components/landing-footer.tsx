import Link from "next/link";
import { Mail } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { LUMARSOFT, lumarsoftEmail, lumarsoftWhatsApp } from "@/lib/contact";
import { BrandWordmark } from "./brand-wordmark";
import { Container } from "./landing-ui";

const PRODUCT_LINKS = [
  { href: "#bot", label: "El bot" },
  { href: "#panel", label: "Panel" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#faq", label: "Preguntas" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 py-14">
      <Container className="flex flex-col gap-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3">
            <BrandWordmark />
            <p className="text-muted-foreground max-w-xs text-sm text-pretty">
              El asistente de WhatsApp que reserva canchas y cobra la seña por
              vos. Hecho para complejos de pádel.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold">Producto</p>
            {PRODUCT_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold">Acceso</p>
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Entrar al panel
            </Link>
            <a
              href={lumarsoftWhatsApp("interested")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Quiero GTP
            </a>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold">Contacto</p>
            <a
              href={lumarsoftWhatsApp("interested")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
            >
              <WhatsAppIcon className="size-4" />
              {LUMARSOFT.whatsappDisplay}
            </a>
            <a
              href={lumarsoftEmail("interested")}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
            >
              <Mail className="size-4" />
              {LUMARSOFT.email}
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} GTP · un producto de Lumarsoft
          </p>
          <p>Hecho en Argentina 🧉</p>
        </div>
      </Container>
    </footer>
  );
}
