import type { ComponentType, ReactNode } from "react";

interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Centered placeholder for empty / not-yet-built screens. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="border-border/70 animate-fade-up bg-card/30 flex min-h-[22rem] flex-col items-center justify-center rounded-2xl border border-dashed p-10 text-center backdrop-blur-sm">
      <div className="bg-brand/10 text-brand ring-brand/15 mb-4 flex size-12 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_0_var(--glass-highlight)] ring-1">
        <Icon className="size-6" />
      </div>
      <h3 className="text-base font-medium">{title}</h3>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
