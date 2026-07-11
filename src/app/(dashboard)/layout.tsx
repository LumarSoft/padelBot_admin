import type { ReactNode } from "react";
import { requireSession } from "@/lib/session";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SessionSync } from "@/features/auth/components/session-sync";
import { RealtimeSync } from "@/features/realtime/components/realtime-sync";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { ChangePasswordDialog } from "@/features/auth/components/change-password-dialog";
import { DashboardNav } from "@/features/dashboard/components/dashboard-nav";
import { SubscriptionBanner } from "@/features/dashboard/components/subscription-banner";
import { GlobalSearch } from "@/features/dashboard/components/global-search";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Server-side gate: no session → redirect to /login.
  const user = await requireSession();

  return (
    <div className="grid min-h-svh grid-cols-1 md:grid-cols-[16rem_1fr]">
      <SessionSync user={user} />
      <RealtimeSync />

      {/* Ambient brand glow the glass surfaces blur against. */}
      <div aria-hidden className="ambient-bg" />

      <aside className="glass-panel text-sidebar-foreground border-border/60 sticky top-0 hidden h-svh flex-col border-r md:flex">
        <div className="border-border/60 flex h-14 items-center border-b px-5">
          <Logo />
        </div>

        <div className="flex-1 overflow-y-auto">
          <DashboardNav />
        </div>

        <div className="border-border/60 border-t px-3 py-3">
          <div className="bg-card/50 ring-foreground/[0.05] flex items-center gap-3 rounded-xl px-2.5 py-2 shadow-[inset_0_1px_0_0_var(--glass-highlight)] ring-1">
            <div className="from-brand to-brand/70 flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-b text-xs font-semibold text-white shadow-[inset_0_1px_0_0_--alpha(var(--color-white)/25%)]">
              {initials(user.clubName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.clubName}</p>
              <p className="text-muted-foreground truncate text-xs capitalize">
                {user.role === "owner" ? "Dueño" : "Staff"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="glass-panel border-border/60 sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="md:hidden">
              <Logo showWordmark={false} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="text-muted-foreground truncate text-xs">
                {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GlobalSearch />
            <ThemeToggle />
            <ChangePasswordDialog />
            <LogoutButton />
          </div>
        </header>

        <SubscriptionBanner />

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
