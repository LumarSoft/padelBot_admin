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
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5">
      {/* Progressive scrim: content scrolling behind fades out gradually
          instead of cutting a hard band around the glass pill. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[5.5rem] bg-linear-to-b from-background via-background/60 to-transparent"
      />
      <div className="glass-panel ring-foreground/[0.07] relative mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 rounded-2xl px-4 shadow-[inset_0_1px_0_0_var(--glass-highlight),var(--glass-shadow)] ring-1 sm:px-5">
        <Link href="/" aria-label="PadelBot — inicio">
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
