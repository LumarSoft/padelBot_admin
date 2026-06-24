import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BrandWordmark } from "./brand-wordmark";
import { LandingButton } from "./landing-ui";

const NAV_LINKS = [
  { href: "#bot", label: "El bot" },
  { href: "#panel", label: "Panel" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#faq", label: "Preguntas" },
];

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" aria-label="Canchea — inicio">
          <BrandWordmark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground hidden rounded-md px-3 py-2 text-sm font-medium transition-colors sm:inline-flex"
          >
            Ingresar
          </Link>
          <LandingButton href="/login" className="px-4 py-2">
            Entrar al panel
          </LandingButton>
        </div>
      </div>
    </header>
  );
}
