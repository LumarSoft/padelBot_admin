"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  useNewImprovementSuggestionsCount,
  useNewLeadsCount,
} from "@/features/ops/hooks/use-ops";

const LINKS = [
  { href: "/ops", label: "Leads" },
  { href: "/ops/clubes", label: "Clubes" },
  { href: "/ops/negocio", label: "Negocio" },
  { href: "/ops/rentabilidad", label: "Rentabilidad" },
  { href: "/ops/bot", label: "Bot / IA" },
  { href: "/ops/salud", label: "Salud" },
  { href: "/ops/mejoras", label: "Mejoras" },
];

export function OpsNav() {
  const pathname = usePathname();
  // A lead waiting for a call is the one thing that can't wait: it shows from any screen.
  const newLeads = useNewLeadsCount();
  const newSuggestions = useNewImprovementSuggestionsCount();

  return (
    <nav className="flex items-center gap-1">
      {LINKS.map((link) => {
        // "/ops" is the leads screen, so it only matches exactly — otherwise it would
        // light up on every other section too.
        const active =
          link.href === "/ops"
            ? pathname === "/ops"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
            )}
          >
            {link.label}
            {link.href === "/ops" && newLeads > 0 && (
              <span className="bg-brand ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white tabular-nums">
                {newLeads}
              </span>
            )}
            {link.href === "/ops/mejoras" && newSuggestions > 0 && (
              <span className="bg-brand ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white tabular-nums">
                {newSuggestions}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
