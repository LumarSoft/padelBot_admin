"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SessionUser } from "@/types/api/auth";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const CARD_CLASS =
  "bg-card/50 ring-foreground/[0.05] flex items-center gap-3 rounded-xl py-2 whitespace-nowrap shadow-[inset_0_1px_0_0_var(--glass-highlight)] ring-1 transition-[padding,background-color] duration-300 ease-fluid";

/**
 * The club card at the foot of the sidebar. The owner's opens Facturación (plan, credits); the
 * staff's is just a label. Collapsed, only the avatar shows and the name moves to a tooltip.
 */
export function ClubCard({
  clubName,
  role,
  collapsed = false,
}: {
  clubName: string;
  role: SessionUser["role"];
  collapsed?: boolean;
}) {
  const roleLabel = role === "owner" ? "Dueño" : "Staff";
  const href = role === "owner" ? "/panel/facturacion" : undefined;
  const className = cn(CARD_CLASS, collapsed ? "px-1" : "px-2.5", href && "hover:bg-card/80");

  const content: ReactNode = (
    <>
      <div className="from-brand to-brand/70 flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-b text-xs font-semibold text-white shadow-[inset_0_1px_0_0_--alpha(var(--color-white)/25%)]">
        {initials(clubName)}
      </div>
      <div className={cn("min-w-0 transition-opacity duration-200", collapsed && "opacity-0")}>
        <p className="truncate text-sm font-medium">{clubName}</p>
        <p className="text-muted-foreground truncate text-xs">{roleLabel}</p>
      </div>
    </>
  );

  return (
    <Tooltip disabled={!collapsed}>
      <TooltipTrigger
        render={href ? <Link href={href} className={className} /> : <div className={className} />}
      >
        {content}
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={14}>
        {clubName} <span className="text-background/70 font-normal">· {roleLabel}</span>
      </TooltipContent>
    </Tooltip>
  );
}
