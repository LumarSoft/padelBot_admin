"use client";

import { useState, type MouseEvent } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { CreditsSidebarMeter } from "@/features/billing/components/credits-sidebar-meter";
import { DashboardNav } from "@/features/dashboard/components/dashboard-nav";
import { ClubCard } from "@/features/dashboard/components/club-card";
import type { SessionUser } from "@/types/api/auth";

/**
 * The sidebar on a phone: a hamburger in the header that slides the same navigation in from
 * the left. Following any link inside closes it.
 */
export function MobileNav({ clubName, role }: { clubName: string; role: SessionUser["role"] }) {
  const [open, setOpen] = useState(false);

  function closeOnLink(event: MouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("a")) setOpen(false);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        render={<Button variant="ghost" size="icon" className="-ml-1.5 md:hidden" aria-label="Abrir menú" />}
      >
        <Menu className="size-5" />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/30 duration-300 ease-fluid supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 md:hidden" />
        <DialogPrimitive.Popup
          onClick={closeOnLink}
          className="glass-overlay text-sidebar-foreground fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col outline-none duration-300 ease-fluid data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left md:hidden"
        >
          <div className="border-border/60 flex h-14 shrink-0 items-center justify-between border-b pr-3 pl-[18px]">
            <DialogPrimitive.Title render={<span />}>
              <Logo />
              <span className="sr-only">Menú del panel</span>
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              render={<Button variant="ghost" size="icon-sm" aria-label="Cerrar menú" />}
            >
              <X />
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto">
            <DashboardNav />
          </div>
          <div className="border-border/60 shrink-0 border-t px-3 py-3">
            {role === "owner" && <CreditsSidebarMeter />}
            <ClubCard clubName={clubName} role={role} />
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
