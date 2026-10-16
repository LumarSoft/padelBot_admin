import type { ReactNode } from "react";

/**
 * Re-mounts on every route change (unlike the layout), so each panel screen
 * enters with the fluid fade-up transition. A full-bleed screen stretches
 * through it to fill <main>.
 */
export default function DashboardTemplate({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="animate-fade-up full-bleed:flex full-bleed:min-h-0 full-bleed:flex-1 full-bleed:flex-col">
      {children}
    </div>
  );
}
