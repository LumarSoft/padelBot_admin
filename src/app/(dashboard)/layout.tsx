import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { requireSession } from "@/lib/session";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SessionSync } from "@/features/auth/components/session-sync";
import { RealtimeSync } from "@/features/realtime/components/realtime-sync";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { ChangePasswordDialog } from "@/features/auth/components/change-password-dialog";
import { ForcePasswordChangeDialog } from "@/features/auth/components/force-password-change-dialog";
import { AppSidebar } from "@/features/dashboard/components/app-sidebar";
import { MobileNav } from "@/features/dashboard/components/mobile-nav";
import { ConnectionStatus } from "@/features/dashboard/components/connection-status";
import { SIDEBAR_COLLAPSED, SIDEBAR_COOKIE } from "@/features/dashboard/lib/sidebar-cookie";
import { SubscriptionBanner } from "@/features/dashboard/components/subscription-banner";
import { AiCreditsBanner } from "@/features/plan/components/ai-credits-banner";
import { GlobalSearch } from "@/features/dashboard/components/global-search";
import { HelpButton } from "@/features/help/components/help-button";
import { SignupInbox } from "@/features/competitions/components/signup-inbox";
import { TourOverlay } from "@/features/help/components/tour-overlay";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Server-side gate: no session → redirect to /login.
  const user = await requireSession();
  const sidebarCollapsed =
    (await cookies()).get(SIDEBAR_COOKIE)?.value === SIDEBAR_COLLAPSED;

  return (
    <div className="flex min-h-svh">
      <SessionSync user={user} />
      <RealtimeSync />
      {/* "Mostrame" guides — only ever started by a tap in the checklist or the "?" help. */}
      <TourOverlay />

      {/* Temporary-password gate: blocks the panel until the user picks their own. */}
      {user.mustChangePassword && <ForcePasswordChangeDialog />}

      {/* Ambient brand glow the glass surfaces blur against. */}
      <div aria-hidden className="ambient-bg" />

      <AppSidebar
        defaultCollapsed={sidebarCollapsed}
        clubName={user.clubName}
        role={user.role}
      />

      {/* A full-bleed screen (the WhatsApp inbox) gets exactly the viewport's height, so its
          panes scroll inside instead of the page. */}
      <div className="flex min-w-0 flex-1 flex-col full-bleed:h-dvh">
        <header className="glass-panel border-border/60 sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <MobileNav clubName={user.clubName} role={user.role} />
            <span className="md:hidden">
              <Logo showWordmark={false} />
            </span>
            {/* The owner's name is also a way to Facturación (the phone's menu has the card too). */}
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
            <SignupInbox />
            <HelpButton />
            <ThemeToggle />
            <ChangePasswordDialog />
            <LogoutButton />
          </div>
        </header>

        <ConnectionStatus />
        <SubscriptionBanner />
        <AiCreditsBanner isOwner={user.role === "owner"} />

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8 full-bleed:flex full-bleed:min-h-0 full-bleed:max-w-none full-bleed:flex-col full-bleed:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
