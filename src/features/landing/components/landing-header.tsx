import Link from "next/link";
import { BrandWordmark } from "./brand-wordmark";
import { LandingButton } from "./landing-ui";

const NAV_LINKS = [
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#cuaderno", label: "Antes y después" },
  { href: "/#panel", label: "Panel" },
  { href: "/#incluye", label: "Qué incluye" },
  { href: "/#faq", label: "Preguntas" },
];

/**
 * Floating ink pill. It keeps the same dark look over every section (night,
 * paper, court) so the landing reads as one piece while scrolling.
 */
export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5">
      <div className="bg-ink/85 text-chalk ring-chalk/10 relative mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 rounded-full pr-2 pl-4 shadow-[0_12px_40px_-16px_rgb(0_0_0/0.6)] ring-1 backdrop-blur-xl sm:pl-5">
        <Link href="/" aria-label="GTP — inicio">
          <BrandWordmark />
        </Link>

        <nav aria-label="Secciones" className="hidden items-center lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-fog hover:text-chalk rounded-full px-3 py-2 text-sm font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/login"
            className="text-fog hover:text-chalk hidden rounded-full px-3 py-2 text-sm font-medium transition-colors sm:inline-flex"
          >
            Ingresar
          </Link>
          <LandingButton href="/register" className="px-4 py-2 text-sm">
            Probar gratis
          </LandingButton>
        </div>
      </div>
    </header>
  );
}
