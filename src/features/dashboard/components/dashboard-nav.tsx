"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  MessagesSquare,
  Settings,
  LayoutDashboard,
  ShoppingBasket,
  UserRound,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useConversations } from "@/features/conversations/hooks/use-conversations";
import { useBookings } from "@/features/reservas/hooks/use-bookings";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const MAIN_NAV: NavItem[] = [
  { href: "/panel", label: "Resumen", icon: LayoutDashboard },
  { href: "/panel/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/panel/pagos", label: "Pagos", icon: Wallet },
  { href: "/panel/jugadores", label: "Jugadores", icon: UserRound },
  {
    href: "/panel/conversaciones",
    label: "Conversaciones",
    icon: MessagesSquare,
  },
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

function NavLink({
  item,
  pathname,
  badge = 0,
  pulse = false,
}: {
  item: NavItem;
  pathname: string;
  badge?: number;
  /** When true, the badge pulses and uses the emerald "money" color to grab attention. */
  pulse?: boolean;
}) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-fluid active:scale-[0.98]",
        active
          ? "bg-card/70 text-foreground shadow-[inset_0_1px_0_0_var(--glass-highlight),0_1px_3px_--alpha(var(--color-black)/6%)] ring-1 ring-foreground/[0.06]"
          : "text-muted-foreground hover:bg-foreground/[0.045] hover:text-foreground dark:hover:bg-white/[0.05]",
      )}
    >
      {active && (
        <span className="bg-brand shadow-brand/40 absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full shadow-[0_0_8px]" />
      )}
      <Icon
        className={cn(
          "ease-spring size-4 transition-all duration-300",
          active
            ? "text-brand"
            : "text-muted-foreground group-hover:-rotate-6 group-hover:scale-[1.15] group-hover:text-foreground",
        )}
      />
      <span className="flex-1">{item.label}</span>
      {badge > 0 && (
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white tabular-nums",
            pulse ? "animate-pulse bg-emerald-600 ring-2 ring-emerald-500/40" : "bg-amber-500",
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

export function DashboardNav() {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.user?.role);
  const { data: conversations } = useConversations();
  const advisorCount = (conversations ?? []).filter((c) => c.needsAdvisor).length;
  // Receipts waiting for the admin to verify (RECEIPT mode) — drives the pulsing Pagos badge.
  const { data: pendingPayments } = useBookings({ status: "PENDING_PAYMENT" });
  const receiptsToReview = (pendingPayments ?? []).filter((b) => b.hasReceipt).length;

  return (
    <nav className="flex flex-col gap-0.5 p-3">
      <p className="text-muted-foreground px-3 pt-2 pb-1.5 text-xs font-medium tracking-wide uppercase">
        Gestión
      </p>
      {MAIN_NAV.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          pathname={pathname}
          badge={
            item.href === "/panel/conversaciones"
              ? advisorCount
              : item.href === "/panel/pagos"
                ? receiptsToReview
                : 0
          }
          pulse={item.href === "/panel/pagos" && receiptsToReview > 0}
        />
      ))}

      {role === "owner" && (
        <>
          <p className="text-muted-foreground px-3 pt-4 pb-1.5 text-xs font-medium tracking-wide uppercase">
            Administración
          </p>
          {ADMIN_NAV.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </>
      )}
    </nav>
  );
}
