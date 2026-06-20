"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  MessagesSquare,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const MAIN_NAV: NavItem[] = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/conversaciones", label: "Conversaciones", icon: MessagesSquare },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      {active && (
        <span className="bg-brand absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full" />
      )}
      <Icon
        className={cn(
          "size-4 transition-colors",
          active
            ? "text-foreground"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      />
      {item.label}
    </Link>
  );
}

export function DashboardNav() {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.user?.role);

  return (
    <nav className="flex flex-col gap-0.5 p-3">
      <p className="text-muted-foreground px-3 pt-2 pb-1.5 text-xs font-medium tracking-wide uppercase">
        Gestión
      </p>
      {MAIN_NAV.map((item) => (
        <NavLink key={item.href} item={item} pathname={pathname} />
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
