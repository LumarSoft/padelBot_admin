"use client";

import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { lumarsoftWhatsApp } from "@/lib/contact";
import { useFeature } from "@/features/plan/hooks/use-plan";
import type { PlanFeature } from "@/types/api/clubs";

/**
 * "Viene con el plan Bandeja": shown where a module the club's plan doesn't include would be
 * turned on. Renders nothing when the plan includes it (or while it loads).
 */
export function PlanUpsell({
  feature,
  children,
  className,
}: {
  feature: PlanFeature;
  /** What the module does, in one line, before the plan name. */
  children?: React.ReactNode;
  className?: string;
}) {
  const { enabled, plan } = useFeature(feature);
  if (enabled) return null;

  return (
    <p
      className={cn(
        "bg-brand/[0.06] ring-brand/15 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ring-1",
        className,
      )}
    >
      <Lock className="text-brand mt-0.5 size-4 shrink-0" />
      <span className="text-pretty">
        {children ? <>{children} </> : null}
        Viene con el plan <strong className="font-semibold">{plan}</strong>.{" "}
        <a
          href={lumarsoftWhatsApp("upgrade")}
          target="_blank"
          rel="noreferrer"
          className="text-brand font-medium underline-offset-2 hover:underline"
        >
          Escribinos y lo activamos
        </a>
        .
      </span>
    </p>
  );
}
