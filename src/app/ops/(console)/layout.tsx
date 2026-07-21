import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireOpsSession } from "@/lib/ops-session";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { OpsNav } from "@/features/ops/components/ops-nav";
import { OpsLogoutButton } from "@/features/ops/components/ops-logout-button";

export const metadata: Metadata = {
  title: "Consola · Lumarsoft",
};

/**
 * The ops console shell. `/ops/login` lives OUTSIDE this route group on purpose — a layout
 * that requires a session cannot also wrap the page you use to get one.
 */
export default async function OpsConsoleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireOpsSession();

  return (
    <div className="flex min-h-svh flex-col">
      <div aria-hidden className="ambient-bg" />

      <header className="glass-panel border-border/60 sticky top-0 z-20 border-b">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex items-center gap-6">
            <Link href="/ops" className="flex items-center gap-2">
              <span className="font-heading text-sm font-semibold">
                Consola
              </span>
              <span className="bg-foreground/10 text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase">
                Lumarsoft
              </span>
            </Link>
            <OpsNav />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground hidden text-xs sm:inline">
              {admin.email}
            </span>
            <ThemeToggle />
            <OpsLogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
