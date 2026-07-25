import type { ComponentType, ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  title: string;
  description?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  /** Buttons that belong to this block (e.g. "Nueva cancha"), pinned to the header. */
  actions?: ReactNode;
  /**
   * For a full-bleed table: drops the content box's own padding and re-applies it to the
   * outer table cells, so rows span the card while the text stays off its edge.
   */
  flush?: boolean;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}

/**
 * The single building block of Configuración: every setting lives inside one of these, so
 * the six tabs share one rhythm (glass card, same heading scale, actions in the header)
 * instead of each manager inventing its own `<h2>` + `rounded-xl border` wrapper.
 */
export function SettingsSection({
  title,
  description,
  icon: Icon,
  actions,
  flush = false,
  className,
  contentClassName,
  children,
}: SettingsSectionProps) {
  return (
    <Card className={cn("gap-0", className)}>
      <CardHeader className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 pb-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span
              aria-hidden
              className="bg-brand/10 text-brand ring-brand/15 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ring-1"
            >
              <Icon className="size-4" />
            </span>
          )}
          <div className="min-w-0 space-y-1">
            <h2 className="font-heading text-base leading-snug font-medium">{title}</h2>
            {description && (
              <p className="text-muted-foreground text-sm text-pretty">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent
        className={cn(
          "border-border/60 border-t pt-(--card-spacing)",
          flush &&
            "px-0 pt-0 [&_tr>*:first-child]:pl-(--card-spacing) [&_tr>*:last-child]:pr-(--card-spacing)",
          contentClassName,
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * Empty state *inside* a section. The page-level `EmptyState` is a 22rem dashed card, which
 * nested in another card reads as a card-in-a-card and pushes the settings below it off the
 * fold — here the section header already carries the icon and the "create" button.
 */
export function SettingsEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted-foreground border-border/70 rounded-xl border border-dashed p-6 text-center text-sm text-pretty">
      {children}
    </p>
  );
}
