"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/ops", label: "Leads" },
  { href: "/ops/clubes", label: "Clubes" },
  { href: "/ops/negocio", label: "Negocio" },
  { href: "/ops/bot", label: "Bot / IA" },
  { href: "/ops/salud", label: "Salud" },
];

export function OpsNav() {
  const pathname = usePathname();

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
          </Link>
        );
      })}
    </nav>
  );
}
