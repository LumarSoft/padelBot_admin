"use client";

import type { ComponentType } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  CalendarDays,
  Settings,
  LayoutDashboard,
  Lightbulb,
  Loader2,
  MessagesSquare,
  ShoppingBasket,
  Trophy,
  UserRound,
  UsersRound,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useConversations } from "@/features/conversations/hooks/use-conversations";
import { useBookings } from "@/features/reservas/hooks/use-bookings";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const MAIN_NAV: NavItem[] = [
  { href: "/panel", label: "Resumen", icon: LayoutDashboard },
  { href: "/panel/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/panel/pagos", label: "Pagos", icon: Wallet },
  { href: "/panel/jugadores", label: "Jugadores", icon: UserRound },
  { href: "/panel/torneos", label: "Torneos", icon: Trophy },
  { href: "/panel/penas", label: "Peñas", icon: UsersRound },
  { href: "/panel/conversaciones", label: "Conversaciones", icon: MessagesSquare },
];

/** Kiosk stock for the front desk. The owner manages it from Productos (catalog + stock). */
const STAFF_NAV: NavItem[] = [
  { href: "/panel/kiosco", label: "Kiosco", icon: Boxes },
];

/** About GTP itself, for everyone: what we shipped and their suggestions to us. */
const GTP_NAV: NavItem[] = [
  { href: "/panel/mejoras", label: "Mejoras", icon: Lightbulb },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/panel/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/panel/productos", label: "Productos", icon: ShoppingBasket },
  { href: "/panel/configuracion", label: "Configuración", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/panel") {
    return pathname === "/panel";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The item's icon, swapped for a spinner while its route loads — the click is acknowledged
 * right away even when the screen takes a moment. Same size either way, so nothing shifts.
 */
function NavIcon({ icon: Icon, active }: { icon: NavItem["icon"]; active: boolean }) {
  const { pending } = useLinkStatus();
  if (pending) return <Loader2 className="text-brand size-4 shrink-0 animate-spin" />;
  return (
    <Icon
      className={cn(
        "ease-spring size-4 shrink-0 transition-all duration-300",
        active
          ? "text-brand"
          : "text-muted-foreground group-hover:-rotate-6 group-hover:scale-[1.15] group-hover:text-foreground",
      )}
    />
  );
}

function NavLink({
  item,
  pathname,
  collapsed,
  badge = 0,
  badgeHint,
  pulse = false,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  badge?: number;
  /** What the badge counts, for the collapsed rail's tooltip ("2 piden asesor"). */
  badgeHint?: string;
  /** When true, the badge pulses and uses the emerald "money" color to grab attention. */
  pulse?: boolean;
}) {
  const active = isActive(pathname, item.href);
  const badgeColor = pulse ? "bg-emerald-600 ring-emerald-500/40" : "bg-amber-500 ring-amber-500/30";

  return (
    <Tooltip disabled={!collapsed}>
      <TooltipTrigger
        render={
          <Link
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ease-fluid active:scale-[0.97]",
              active
                ? "bg-card/70 text-foreground shadow-[inset_0_1px_0_0_var(--glass-highlight),0_1px_3px_--alpha(var(--color-black)/6%)] ring-1 ring-foreground/[0.06]"
                : "text-muted-foreground hover:bg-foreground/[0.045] hover:text-foreground dark:hover:bg-white/[0.05]",
            )}
          />
        }
      >
        {active && (
          <span className="bg-brand shadow-brand/40 absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full shadow-[0_0_8px]" />
        )}
        <NavIcon icon={item.icon} active={active} />
        {/* Faded, not removed, when collapsed: screen readers still read the label. */}
        <span
          className={cn(
            "flex-1 transition-opacity duration-200",
            collapsed && "pointer-events-none opacity-0",
          )}
        >
          {item.label}
        </span>
        {badge > 0 &&
          (collapsed ? (
            <span
              className={cn(
                "absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full text-[9px] font-semibold text-white tabular-nums ring-2",
                badgeColor,
                pulse && "animate-pulse",
              )}
            >
              {badge > 9 ? "9+" : badge}
            </span>
          ) : (
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white tabular-nums",
                pulse ? "animate-pulse bg-emerald-600 ring-2 ring-emerald-500/40" : "bg-amber-500",
              )}
            >
              {badge}
            </span>
          ))}
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={14}>
        {item.label}
        {badge > 0 && badgeHint && (
          <span className="text-background/70 font-normal"> · {badgeHint}</span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

/** A group heading; in the collapsed rail it turns into a short rule at the same height. */
function SectionLabel({ children, collapsed, first = false }: {
  children: string;
  collapsed: boolean;
  first?: boolean;
}) {
  return (
    <p
      className={cn(
        "text-muted-foreground relative px-3 pb-1.5 text-xs font-medium tracking-wide whitespace-nowrap uppercase",
        first ? "pt-2" : "pt-4",
      )}
    >
      <span className={cn("transition-opacity duration-200", collapsed && "opacity-0")}>
        {children}
      </span>
      <span
        aria-hidden
        className={cn(
          "bg-border absolute inset-x-3 bottom-2.5 h-px opacity-0 transition-opacity duration-200",
          collapsed && "opacity-100",
        )}
      />
    </p>
  );
}

export function DashboardNav({
  collapsed = false,
}: {
  /** Icons-only rail (desktop sidebar contracted); labels move to tooltips. */
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.user?.role);
  const { data: conversations } = useConversations();
  const advisorCount = (conversations ?? []).filter((c) => c.needsAdvisor).length;
  // Receipts waiting for the admin to verify (RECEIPT mode) — drives the pulsing Pagos badge.
  const { data: pendingPayments } = useBookings({ status: "PENDING_PAYMENT" });
  const receiptsToReview = (pendingPayments ?? []).filter((b) => b.hasReceipt).length;

  function badgeFor(href: string): { badge?: number; badgeHint?: string; pulse?: boolean } {
    if (href === "/panel/conversaciones") {
      return {
        badge: advisorCount,
        badgeHint: advisorCount === 1 ? "1 pide asesor" : `${advisorCount} piden asesor`,
      };
    }
    if (href === "/panel/pagos") {
      return {
        badge: receiptsToReview,
        badgeHint:
          receiptsToReview === 1
            ? "1 comprobante para revisar"
            : `${receiptsToReview} comprobantes para revisar`,
        pulse: receiptsToReview > 0,
      };
    }
    return {};
  }

  const link = (item: NavItem) => (
    <NavLink
      key={item.href}
      item={item}
      pathname={pathname}
      collapsed={collapsed}
      {...badgeFor(item.href)}
    />
  );

  return (
    <nav className="flex flex-col gap-0.5 p-3">
      <SectionLabel collapsed={collapsed} first>
        Gestión
      </SectionLabel>
      {MAIN_NAV.map(link)}
      {role === "staff" && STAFF_NAV.map(link)}

      {role === "owner" && (
        <>
          <SectionLabel collapsed={collapsed}>Administración</SectionLabel>
          {ADMIN_NAV.map(link)}
        </>
      )}

      <SectionLabel collapsed={collapsed}>GTP</SectionLabel>
      {GTP_NAV.map(link)}
    </nav>
  );
}
