import type { ReactNode } from "react";

/**
 * Re-mounts on every route change (unlike the layout), so each panel screen
 * enters with the fluid fade-up transition.
 */
export default function DashboardTemplate({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="animate-fade-up">{children}</div>;
}
