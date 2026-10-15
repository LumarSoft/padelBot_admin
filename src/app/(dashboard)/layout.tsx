import type { ReactNode } from "react";
import Link from "next/link";
import { requireSession } from "@/lib/session";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SessionSync } from "@/features/auth/components/session-sync";
import { RealtimeSync } from "@/features/realtime/components/realtime-sync";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { ChangePasswordDialog } from "@/features/auth/components/change-password-dialog";
import { ForcePasswordChangeDialog } from "@/features/auth/components/force-password-change-dialog";
import { DashboardNav } from "@/features/dashboard/components/dashboard-nav";
import { SubscriptionBanner } from "@/features/dashboard/components/subscription-banner";
import { AiCreditsBanner } from "@/features/plan/components/ai-credits-banner";
import { CreditsSidebarMeter } from "@/features/billing/components/credits-sidebar-meter";
import { GlobalSearch } from "@/features/dashboard/components/global-search";
import { HelpButton } from "@/features/help/components/help-button";
import { TourOverlay } from "@/features/help/components/tour-overlay";

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
      {/* "Mostrame" guides — only ever started by a tap in the checklist or the "?" help. */}
      <TourOverlay />

      {/* Temporary-password gate: blocks the panel until the user picks their own. */}
      {user.mustChangePassword && <ForcePasswordChangeDialog />}

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
          {user.role === "owner" && <CreditsSidebarMeter />}
          {/* The owner's card opens Facturación (plan, credits); the staff's is just a label. */}
          <UserCard href={user.role === "owner" ? "/panel/facturacion" : undefined}>
            <div className="from-brand to-brand/70 flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-b text-xs font-semibold text-white shadow-[inset_0_1px_0_0_--alpha(var(--color-white)/25%)]">
              {initials(user.clubName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.clubName}</p>
              <p className="text-muted-foreground truncate text-xs capitalize">
                {user.role === "owner" ? "Dueño" : "Staff"}
              </p>
            </div>
          </UserCard>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="glass-panel border-border/60 sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="md:hidden">
              <Logo showWordmark={false} />
            </span>
            {/* On a phone there's no sidebar: the owner's name is the way to Facturación. */}
            {user.role === "owner" ? (
              <Link href="/panel/facturacion" className="min-w-0 hover:opacity-80">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="text-muted-foreground truncate text-xs">{user.email}</p>
              </Link>
            ) : (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {user.email}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <GlobalSearch />
            <HelpButton />
            <ThemeToggle />
            <ChangePasswordDialog />
            <LogoutButton />
          </div>
        </header>

        <SubscriptionBanner />
        {user.role === "owner" && <AiCreditsBanner />}

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

const USER_CARD_CLASS =
  "bg-card/50 ring-foreground/[0.05] flex items-center gap-3 rounded-xl px-2.5 py-2 shadow-[inset_0_1px_0_0_var(--glass-highlight)] ring-1";

/** The club card at the foot of the sidebar: a link when there's somewhere to go. */
function UserCard({ href, children }: { href?: string; children: ReactNode }) {
  if (!href) return <div className={USER_CARD_CLASS}>{children}</div>;
  return (
    <Link href={href} className={`${USER_CARD_CLASS} hover:bg-card/80 transition-colors`}>
      {children}
    </Link>
  );
}
