"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { ChevronsLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CreditsSidebarMeter } from "@/features/billing/components/credits-sidebar-meter";
import { DashboardNav } from "@/features/dashboard/components/dashboard-nav";
import { ClubCard } from "@/features/dashboard/components/club-card";
import { saveSidebarCollapsed } from "@/features/dashboard/lib/sidebar-cookie";
import type { SessionUser } from "@/types/api/auth";

const noopSubscribe = () => () => {};

/** ⌘ on Apple keyboards, Ctrl elsewhere. False on the server, so hydration never mismatches. */
function useIsMac(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => false,
  );
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/**
 * The desktop sidebar. It contracts to an icons-only rail (labels and counts move to tooltips)
 * with the button at its foot or ⌘B / Ctrl+B, and remembers the choice in a cookie the layout
 * reads, so a reload paints it at the right width. The icons sit at the same x in both widths,
 * so only the labels fade while it slides.
 */
export function AppSidebar({
  defaultCollapsed,
  clubName,
  role,
}: {
  defaultCollapsed: boolean;
  clubName: string;
  role: SessionUser["role"];
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const isMac = useIsMac();
  const shortcut = isMac ? "⌘B" : "Ctrl B";

  const toggle = useCallback(() => {
    const next = !collapsed;
    setCollapsed(next);
    saveSidebarCollapsed(next);
  }, [collapsed]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "b" || !(event.metaKey || event.ctrlKey)) return;
      if (event.altKey || event.shiftKey || isTypingTarget(event.target)) return;
      event.preventDefault();
      toggle();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  return (
    <TooltipProvider delay={120}>
      <aside
        data-collapsed={collapsed || undefined}
        className={cn(
          "glass-panel text-sidebar-foreground border-border/60 sticky top-0 z-30 hidden h-svh shrink-0 flex-col overflow-hidden border-r transition-[width] duration-300 ease-fluid md:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="border-border/60 flex h-14 shrink-0 items-center border-b px-[18px]">
          <Logo
            wordmarkClassName={cn("transition-opacity duration-200", collapsed && "opacity-0")}
          />
        </div>

        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          <DashboardNav collapsed={collapsed} />
        </div>

        <div className="border-border/60 shrink-0 border-t px-3 py-3">
          <Tooltip disabled={!collapsed}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={toggle}
                  aria-expanded={!collapsed}
                  aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
                  className="text-muted-foreground hover:bg-foreground/[0.045] hover:text-foreground mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors dark:hover:bg-white/[0.05]"
                />
              }
            >
              <ChevronsLeft
                className={cn(
                  "size-4 shrink-0 transition-transform duration-300 ease-fluid",
                  collapsed && "rotate-180",
                )}
              />
              <span
                className={cn(
                  "flex flex-1 items-center justify-between gap-2 transition-opacity duration-200",
                  collapsed && "opacity-0",
                )}
              >
                Contraer menú
                <kbd className="border-border/80 bg-background/60 rounded border px-1.5 py-px font-sans text-[10px] font-medium">
                  {shortcut}
                </kbd>
              </span>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={14}>
              Expandir menú <span className="text-background/70 font-normal">· {shortcut}</span>
            </TooltipContent>
          </Tooltip>

          {role === "owner" && <CreditsSidebarMeter collapsed={collapsed} />}
          <ClubCard clubName={clubName} role={role} collapsed={collapsed} />
        </div>
      </aside>
    </TooltipProvider>
  );
}
